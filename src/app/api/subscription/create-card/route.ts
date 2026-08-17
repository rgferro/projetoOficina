import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createMercadoPagoPreapproval, SAAS_PLANS } from "@/lib/mercadopago";
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
    const preapproval = await createMercadoPagoPreapproval(tenant, amount, planName, originUrl);

    if (seatsCount === 0) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { mercadopagoPreapprovalId: preapproval.preapproval_id },
      });
    }

    return NextResponse.json({
      success: true,
      initPoint: preapproval.init_point,
      preapprovalId: preapproval.preapproval_id,
    });
  } catch (error: any) {
    console.error("Erro ao gerar Assinatura Recorrente no Cartão:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao processar assinatura no cartão" },
      { status: 500 }
    );
  }
}
