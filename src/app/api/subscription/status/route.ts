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

    // Regra de Vigência Contratual: Se a assinatura foi cancelada ou está pendente,
    // o usuário MANTÉM todos os benefícios do plano contratado até a data final de expiração (1 mês completo)
    let effectivePlan = tenant.plan;
    let effectiveMaxUsers = tenant.maxUsers;
    let effectiveStatus = tenant.subscriptionStatus || "active";

    if (tenant.subscriptionExpiresAt) {
      const now = new Date();
      const expiresAt = new Date(tenant.subscriptionExpiresAt);

      if (now > expiresAt && tenant.plan !== "STARTER") {
        // Expirou oficialmente: agora sim reverte para STARTER e 2 usuários
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            plan: "STARTER",
            maxUsers: 2,
            subscriptionStatus: "expired",
          },
        });

        // Desativa excedentes preventivamente
        await prisma.employee.updateMany({
          where: { tenantId: tenant.id },
          data: { active: false },
        });

        effectivePlan = "STARTER";
        effectiveMaxUsers = 2;
        effectiveStatus = "expired";
      }
    }

    const planConfig = SAAS_PLANS[effectivePlan] || SAAS_PLANS.STARTER;

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        plan: tenant.plan,
        planName: planConfig.name,
        planPrice: planConfig.price,
        status: tenant.subscriptionStatus,
        expiresAt: tenant.subscriptionExpiresAt,
        maxUsers: tenant.maxUsers,
        currentUsersCount: Math.max(1, currentUsersCount),
        ownerEmail: tenant.ownerEmail,
        ownerName: tenant.ownerName,
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
