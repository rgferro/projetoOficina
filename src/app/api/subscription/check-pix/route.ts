import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMercadoPagoPaymentStatus, SAAS_PLANS } from "@/lib/mercadopago";
import { verifySessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json({ success: false, error: "Payment ID obrigatório" }, { status: 400 });
    }

    const token = req.cookies.get("torque_token")?.value;
    const session = token ? verifySessionToken(token) : null;

    const paymentInfo = await getMercadoPagoPaymentStatus(String(paymentId));

    if (!paymentInfo || paymentInfo.status !== "approved") {
      return NextResponse.json({
        success: false,
        status: paymentInfo?.status || "pending",
        message: "Pagamento ainda não foi aprovado pelo banco/Mercado Pago.",
      });
    }

    const amount = Number(paymentInfo.transaction_amount) || 69.9;
    const cleanExtRef =
      paymentInfo.external_reference &&
      paymentInfo.external_reference !== "null" &&
      paymentInfo.external_reference !== "undefined"
        ? String(paymentInfo.external_reference).trim()
        : null;

    let targetTenant = null;
    if (cleanExtRef) {
      targetTenant = await prisma.tenant.findUnique({ where: { id: cleanExtRef } });
    }

    if (!targetTenant && session?.tenantId) {
      targetTenant = await prisma.tenant.findUnique({ where: { id: session.tenantId } });
    }

    if (!targetTenant && session?.email) {
      targetTenant = await prisma.tenant.findFirst({ where: { ownerEmail: session.email } });
    }

    if (!targetTenant) {
      targetTenant = await prisma.tenant.findFirst({ where: { active: true }, orderBy: { createdAt: "desc" } });
    }

    if (!targetTenant) {
      return NextResponse.json({ success: false, error: "Oficina não encontrada" }, { status: 404 });
    }

    // Calcula 30 dias de vigência a partir de hoje
    const nextExpiry = new Date();
    nextExpiry.setDate(nextExpiry.getDate() + 30);

    const recordedPayment = await prisma.subscriptionPayment.findFirst({
      where: { paymentId: String(paymentId) },
    });

    if (recordedPayment && recordedPayment.plan === "EXTRA_SEAT") {
      const extraSeatsCount = Math.round(amount / SAAS_PLANS.EXTRA_SEAT.price) || 1;
      const updatedTenant = await prisma.tenant.update({
        where: { id: targetTenant.id },
        data: {
          maxUsers: { increment: extraSeatsCount },
        },
      });

      await prisma.subscriptionPayment.updateMany({
        where: { paymentId: String(paymentId) },
        data: { status: "approved", paidAt: new Date() },
      });

      return NextResponse.json({
        success: true,
        status: "approved",
        plan: updatedTenant.plan,
        maxUsers: updatedTenant.maxUsers,
        message: `+${extraSeatsCount} assento(s) adicionado(s) com sucesso!`,
      });
    }

    let targetPlan = "PRO";
    let targetMaxUsers = 4;

    if (amount >= SAAS_PLANS.ELITE.price - 1) {
      targetPlan = "ELITE";
      targetMaxUsers = 8;
    } else {
      targetPlan = "PRO";
      targetMaxUsers = 4;
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id: targetTenant.id },
      data: {
        plan: targetPlan,
        maxUsers: targetMaxUsers,
        subscriptionStatus: "active",
        subscriptionExpiresAt: nextExpiry,
      },
    });

    await prisma.subscriptionPayment.updateMany({
      where: { paymentId: String(paymentId) },
      data: { status: "approved", paidAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      status: "approved",
      plan: targetPlan,
      maxUsers: targetMaxUsers,
      expiresAt: nextExpiry,
      message: `🎉 Pagamento PIX Aprovado com Sucesso! Seu plano ${targetPlan} está ativo por 30 dias!`,
    });
  } catch (error: any) {
    console.error("Erro ao checar status do PIX:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao consultar pagamento" },
      { status: 500 }
    );
  }
}
