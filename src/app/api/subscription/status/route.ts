import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SAAS_PLANS } from "@/lib/mercadopago";
import { verifySessionToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("torque_token")?.value;
    const session = token ? verifySessionToken(token) : null;

    let tenant = null;
    if (session?.tenantId) {
      tenant = await prisma.tenant.findUnique({
        where: { id: session.tenantId },
      });
    }

    if (!tenant && session?.email) {
      tenant = await prisma.tenant.findFirst({
        where: { ownerEmail: session.email },
      });
    }

    // Se não encontrou tenant da sessão, busca o tenant ativo mais recente
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

    const currentUsersCount = await prisma.employee.count({
      where: {
        active: true,
        ...(tenant ? { tenantId: tenant.id } : {}),
      },
    });

    const recentPayments = await prisma.subscriptionPayment.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // 🔄 Auto-Sync com Mercado Pago: Se o tenant tiver pagamentos recentes pendentes no banco,
    // consulta a API do Mercado Pago para ver se o PIX/Cartão foi aprovado enquanto o webhook não chegava
    const pendingPayment = await prisma.subscriptionPayment.findFirst({
      where: {
        tenantId: tenant.id,
        status: "pending",
      },
      orderBy: { createdAt: "desc" },
    });

    if (pendingPayment && pendingPayment.paymentId) {
      try {
        const mpStatus = await getMercadoPagoPaymentStatus(pendingPayment.paymentId);
        if (mpStatus && mpStatus.status === "approved") {
          const nextExpiry = new Date();
          nextExpiry.setDate(nextExpiry.getDate() + 30);

          let newPlan = pendingPayment.plan === "ELITE" ? "ELITE" : "PRO";
          let newMax = newPlan === "ELITE" ? 8 : 4;

          if (pendingPayment.plan === "EXTRA_SEAT") {
            const extraCount = Math.round(pendingPayment.amount / SAAS_PLANS.EXTRA_SEAT.price) || 1;
            await prisma.tenant.update({
              where: { id: tenant.id },
              data: { maxUsers: { increment: extraCount } },
            });
          } else {
            tenant = await prisma.tenant.update({
              where: { id: tenant.id },
              data: {
                plan: newPlan,
                maxUsers: newMax,
                subscriptionStatus: "active",
                subscriptionExpiresAt: nextExpiry,
              },
            });
          }

          await prisma.subscriptionPayment.update({
            where: { id: pendingPayment.id },
            data: { status: "approved", paidAt: new Date() },
          });

          console.log(`✅ [Auto-Sync MP] Pagamento PIX ${pendingPayment.paymentId} confirmado e ativado automaticamente!`);
        }
      } catch (err) {
        console.warn("Auto-sync MP fallback:", err);
      }
    }

    // Regra de Vigência Contratual e Tolerância de Pagamento PIX:
    // - Durante os 30 dias contratados: Plano 100% ativo.
    // - Se a fatura/PIX vencer:
    //    * Dias 1 e 2 após vencimento: Mantém acesso integral com AVISO URGENTE DE COBRANÇA.
    //    * A partir do Dia 3: Rebaixa automaticamente para o Plano Starter (2 usuários) e pausa funcionários adicionais com todo histórico preservado.
    let effectivePlan = tenant.plan;
    let effectiveMaxUsers = tenant.maxUsers;
    let effectiveStatus = tenant.subscriptionStatus || "active";
    let paymentOverdueNotice: { daysOverdue: number; message: string; isGracePeriod: boolean } | null = null;

    if (tenant.subscriptionExpiresAt && tenant.plan !== "STARTER") {
      const now = new Date();
      const expiresAt = new Date(tenant.subscriptionExpiresAt);

      if (now > expiresAt) {
        const diffMs = now.getTime() - expiresAt.getTime();
        const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

        if (daysOverdue <= 2) {
          // Dias 1 e 2 de atraso: Tolerância ativa, avisa o usuário sem bloquear
          paymentOverdueNotice = {
            daysOverdue,
            isGracePeriod: true,
            message: `⚠️ Sua assinatura via PIX venceu há ${daysOverdue} dia(s). Renove hoje para evitar que seus colaboradores sejam pausados amanhã no 3º dia.`,
          };
          effectiveStatus = "past_due";
        } else {
          // Dia 3 em diante: Rebaixa para STARTER mantendo todo o histórico intacto no banco
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: {
              plan: "STARTER",
              maxUsers: 2,
              subscriptionStatus: "expired",
            },
          });

          // Desativa colaboradores adicionais preventivamente sem apagar nada
          await prisma.employee.updateMany({
            where: { tenantId: tenant.id },
            data: { active: false },
          });

          effectivePlan = "STARTER";
          effectiveMaxUsers = 2;
          effectiveStatus = "expired";
          paymentOverdueNotice = {
            daysOverdue,
            isGracePeriod: false,
            message: "Seu plano foi revertido para o Torque Starter gratuito devido à falta de pagamento. Todo o seu histórico e funcionários foram salvos e podem ser reativados com a renovação.",
          };
        }
      }
    }

    const planConfig = SAAS_PLANS[effectivePlan] || SAAS_PLANS.STARTER;

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        plan: effectivePlan,
        planName: planConfig.name,
        planPrice: planConfig.price,
        status: effectiveStatus,
        expiresAt: tenant.subscriptionExpiresAt,
        maxUsers: effectiveMaxUsers,
        currentUsersCount: Math.max(1, currentUsersCount),
        ownerEmail: tenant.ownerEmail,
        ownerName: tenant.ownerName,
        paymentOverdueNotice,
      },
      recentPayments,
    });
  } catch (error: any) {
    console.error("Erro ao consultar status da assinatura:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao consultar assinatura" },
      { status: 500 }
    );
  }
}
