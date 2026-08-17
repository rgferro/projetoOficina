import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
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

    if (!tenant) {
      tenant = await prisma.tenant.findFirst({
        where: { active: true },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!tenant) {
      return NextResponse.json({ error: "Oficina não encontrada" }, { status: 404 });
    }

    // 1. Reverte o plano para STARTER com limite de 2 usuários (Dono + 1 operador)
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        plan: "STARTER",
        maxUsers: 2,
        subscriptionStatus: "cancelled",
        subscriptionExpiresAt: new Date(),
      },
    });

    // 2. Desativa todos os funcionários da equipe (SEM excluir seus dados ou histórico)
    // O proprietário poderá acessar a aba Equipe e reativar apenas 1 funcionário compatível com o plano Starter
    await prisma.employee.updateMany({
      where: { tenantId: tenant.id },
      data: {
        active: false,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Assinatura cancelada com sucesso. O plano foi revertido para o Torque Starter gratuito. Os funcionários foram desativados preventivamente sem perder nenhum histórico, e você pode reativar até 1 funcionário na aba Equipe.",
    });
  } catch (error: any) {
    console.error("Erro ao cancelar assinatura:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao processar cancelamento" },
      { status: 500 }
    );
  }
}
