import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createMercadoPagoPixPayment, SAAS_PLANS } from "@/lib/mercadopago";
import { verifySessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId = "PRO", tenantId, seatsCount = 0 } = body;

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

    const now = new Date();
    const isWithinActivePeriod =
      tenant.subscriptionExpiresAt &&
      new Date(tenant.subscriptionExpiresAt) > now &&
      tenant.plan === planId &&
      seatsCount === 0;

    // Se já estiver no período válido e a assinatura estava apenas com renovação cancelada, apenas reativa
    if (isWithinActivePeriod && tenant.subscriptionStatus === "cancelled") {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          subscriptionStatus: "active",
        },
      });

      return NextResponse.json({
        success: true,
        reactivatedOnly: true,
        message: "Sua assinatura foi reativada com sucesso! Você continuará com acesso integral até o fim do seu ciclo contratado.",
      });
    }

    const plan = SAAS_PLANS[planId] || SAAS_PLANS.PRO;
    const amount = seatsCount > 0 ? SAAS_PLANS.EXTRA_SEAT.price * seatsCount : plan.price;
    const planName = seatsCount > 0 ? `+${seatsCount} Usuário(s) Adicional(is)` : plan.name;

    const pixData = await createMercadoPagoPixPayment(tenant, amount, planName);

    // Registra pagamento pendente no banco
    const payment = await prisma.subscriptionPayment.create({
      data: {
        tenantId: tenant.id,
        paymentId: pixData.payment_id,
        amount,
        status: "pending",
        method: "pix",
        plan: seatsCount > 0 ? "EXTRA_SEAT" : planId,
        qrCode: pixData.qr_code,
        qrCodeBase64: pixData.qr_code_base64,
      },
    });

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      mpPaymentId: pixData.payment_id,
      qrCode: pixData.qr_code,
      qrCodeBase64: pixData.qr_code_base64,
      amount,
      planName,
    });
  } catch (error: any) {
    console.error("Erro ao gerar PIX para assinatura:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao processar PIX" },
      { status: 500 }
    );
  }
}
