import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMercadoPagoPaymentStatus, SAAS_PLANS } from "@/lib/mercadopago";
import { verifySessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { paymentId, status, externalReference, planId } = body;

    const token = req.cookies.get("torque_token")?.value;
    const session = token ? verifySessionToken(token) : null;

    const cleanExtRef =
      externalReference &&
      externalReference !== "null" &&
      externalReference !== "undefined" &&
      String(externalReference).trim().length > 5
        ? String(externalReference).trim()
        : null;

    let targetTenant = null;

    if (cleanExtRef) {
      targetTenant = await prisma.tenant.findUnique({ where: { id: cleanExtRef } });
    }

    if (!targetTenant && session?.tenantId) {
      targetTenant = await prisma.tenant.findUnique({ where: { id: session.tenantId } });
    }

    if (!targetTenant && session?.email) {
      targetTenant = await prisma.tenant.findFirst({
        where: { ownerEmail: session.email },
      });
    }

    if (!targetTenant) {
      targetTenant = await prisma.tenant.findFirst({
        where: { active: true },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!targetTenant) {
      return NextResponse.json(
        { success: false, error: "Tenant da oficina não encontrado" },
        { status: 404 }
      );
    }

    let isApproved = status === "approved" || status === "sucesso";
    let amount = 69.9;
    let resolvedPlan = planId || "PRO";

    if (paymentId) {
      try {
        const paymentInfo = await getMercadoPagoPaymentStatus(paymentId);
        if (paymentInfo && paymentInfo.status === "approved") {
          isApproved = true;
          amount = paymentInfo.transaction_amount || amount;
        }
      } catch (err) {
        console.warn("Consulta ao MP falhou, usando status retornado pelo redirect:", err);
      }
    }

    if (isApproved) {
      const nextExpiry = new Date();
      nextExpiry.setDate(nextExpiry.getDate() + 30);

      if (paymentId) {
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
          return NextResponse.json({
            success: true,
            plan: updatedTenant.plan,
            maxUsers: updatedTenant.maxUsers,
            message: `+${extraSeatsCount} assento(s) de usuário adicionado(s) com sucesso!`,
          });
        }
      }

      let targetPlan = "PRO";
      let targetMaxUsers = 4;

      if (amount >= SAAS_PLANS.ELITE.price - 1 || resolvedPlan === "ELITE") {
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

      return NextResponse.json({
        success: true,
        plan: targetPlan,
        maxUsers: targetMaxUsers,
        message: "Assinatura ativada com sucesso!",
      });
    }

    return NextResponse.json({
      success: false,
      error: "Pagamento não aprovado",
    });
  } catch (err: any) {
    console.error("Erro ao confirmar retorno de assinatura:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
