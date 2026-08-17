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

    let targetTenantId = externalReference || session?.tenantId;

    if (!targetTenantId && session?.email) {
      const t = await prisma.tenant.findFirst({
        where: { ownerEmail: session.email },
      });
      targetTenantId = t?.id;
    }

    if (!targetTenantId) {
      const defaultTenant = await prisma.tenant.findFirst({
        where: { active: true },
        orderBy: { createdAt: "desc" },
      });
      targetTenantId = defaultTenant?.id;
    }

    if (!targetTenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant não encontrado" },
        { status: 404 }
      );
    }

    let isApproved = status === "approved";
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

      let targetPlan = "PRO";
      let targetMaxUsers = 4;

      if (amount >= SAAS_PLANS.ELITE.price - 1 || resolvedPlan === "ELITE") {
        targetPlan = "ELITE";
        targetMaxUsers = 8;
      } else {
        targetPlan = "PRO";
        targetMaxUsers = 4;
      }

      await prisma.tenant.update({
        where: { id: targetTenantId },
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
