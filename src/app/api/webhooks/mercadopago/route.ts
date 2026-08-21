export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMercadoPagoPaymentStatus, SAAS_PLANS } from "@/lib/mercadopago";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { searchParams } = new URL(req.url);

    const paymentId =
      body?.data?.id ||
      searchParams.get("data.id") ||
      searchParams.get("id");

    if (paymentId) {
      const paymentInfo = await getMercadoPagoPaymentStatus(paymentId);

      if (paymentInfo && paymentInfo.status === "approved") {
        const tenantId = paymentInfo.external_reference;
        const amount = paymentInfo.transaction_amount;

        // Calcula +30 dias de expiração da assinatura
        const nextExpiry = new Date();
        nextExpiry.setDate(nextExpiry.getDate() + 30);

        const recordedPayment = await prisma.subscriptionPayment.findFirst({
          where: { paymentId: String(paymentId) },
        });

        if (tenantId) {
          if (recordedPayment && recordedPayment.plan === "EXTRA_SEAT") {
            const extraSeatsCount = Math.round(amount / SAAS_PLANS.EXTRA_SEAT.price) || 1;
            await prisma.tenant.update({
              where: { id: tenantId },
              data: {
                maxUsers: { increment: extraSeatsCount },
              },
            });
          } else {
            // Identifica o plano com base no valor pago
            let targetPlan = "PRO";
            let targetMaxUsers = 4;

            if (amount >= SAAS_PLANS.ELITE.price - 1) {
              targetPlan = "ELITE";
              targetMaxUsers = 10;
            } else if (amount >= SAAS_PLANS.PRO.price - 1) {
              targetPlan = "PRO";
              targetMaxUsers = 4;
            }

            await prisma.tenant.update({
              where: { id: tenantId },
              data: {
                plan: targetPlan,
                maxUsers: targetMaxUsers,
                subscriptionStatus: "active",
                subscriptionExpiresAt: nextExpiry,
              },
            });
          }
        }

        // Atualiza o registro de pagamento
        await prisma.subscriptionPayment.updateMany({
          where: { paymentId: String(paymentId) },
          data: {
            status: "approved",
            paidAt: new Date(),
          },
        });

        console.log(`✅ [Webhook MP] Pagamento ${paymentId} APROVADO! Assinatura renovada até ${nextExpiry.toISOString()}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Erro no processamento do Webhook Mercado Pago:", error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
