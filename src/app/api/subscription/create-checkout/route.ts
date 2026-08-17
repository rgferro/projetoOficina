import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createMercadoPagoPreference, SAAS_PLANS } from "@/lib/mercadopago";
import { verifySessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId = "PRO", tenantId } = body;

    const token = req.cookies.get("torque_token")?.value;
    const session = token ? verifySessionToken(token) : null;
    const resolvedTenantId = tenantId || session?.tenantId;

    let tenant = null;
    if (resolvedTenantId) {
      tenant = await prisma.tenant.findUnique({
        where: { id: resolvedTenantId },
      });
    }

    if (!tenant && session?.email) {
      tenant = await prisma.tenant.findFirst({
        where: { ownerEmail: session.email },
      });
    }

    if (!tenant) {
      tenant = await prisma.tenant.findFirst({
        where: { active: true },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!tenant) {
      const setting = await prisma.workshopSetting.findUnique({ where: { id: "default" } });
      tenant = await prisma.tenant.create({
        data: {
          name: setting?.workshopName || "Minha Oficina Automotiva",
          document: setting?.cnpj || "12.345.678/0001-90",
          ownerName: "Administrador da Oficina",
          ownerEmail: "admin@torquerp.com.br",
          ownerPhone: setting?.phone || "(11) 98765-4321",
          plan: "STARTER",
          maxUsers: 2,
          subscriptionStatus: "active",
        },
      });
    }

    const { planId = "PRO", tenantId, seatsCount = 0 } = body;

    const plan = SAAS_PLANS[planId] || SAAS_PLANS.PRO;
    const amount = seatsCount > 0 ? SAAS_PLANS.EXTRA_SEAT.price * seatsCount : plan.price;
    const planName =
      seatsCount > 0 ? `+${seatsCount} Usuário(s) Extra(s) - Torque ERP` : plan.name;
    const originUrl = req.nextUrl.origin || req.headers.get("origin") || undefined;
    const pref = await createMercadoPagoPreference(tenant, amount, planName, originUrl);

    // Registra pagamento pendente se for assento extra
    if (seatsCount > 0) {
      await prisma.subscriptionPayment.create({
        data: {
          tenantId: tenant.id,
          paymentId: pref.preference_id,
          amount,
          status: "pending",
          method: "checkout_pro",
          plan: "EXTRA_SEAT",
        },
      });
    }

    return NextResponse.json({
      success: true,
      preferenceId: pref.preference_id,
      initPoint: pref.init_point,
      sandboxInitPoint: pref.sandbox_init_point,
    });
  } catch (err: any) {
    console.error("Erro ao criar Checkout Pro:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro ao conectar com Mercado Pago" },
      { status: 500 }
    );
  }
}
