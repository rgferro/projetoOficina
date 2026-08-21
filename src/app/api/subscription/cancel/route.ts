export const dynamic = "force-dynamic";
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

    // 1. Marca o status como cancelado (não haverá novas cobranças automáticas no cartão/PIX),
    // mas MANTÉM o plano atual e todos os recursos ativos até a data de expiração já paga (fim do ciclo de 1 mês).
    const expiresAt = tenant.subscriptionExpiresAt || new Date();
    const formattedExpiry = new Date(expiresAt).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        subscriptionStatus: "cancelled",
        // A data de expiração permanece a mesma contratada (não zera no cancelamento)
      },
    });

    return NextResponse.json({
      success: true,
      expiresAt: tenant.subscriptionExpiresAt,
      message: `Assinatura cancelada com sucesso. A renovação automática foi suspensa e o seu plano (${tenant.plan}) continuará totalmente ativo com todos os usuários até ${formattedExpiry}. Após essa data, o plano será revertido para o Torque Starter gratuito.`,
    });
  } catch (error: any) {
    console.error("Erro ao cancelar assinatura:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao processar cancelamento" },
      { status: 500 }
    );
  }
}
