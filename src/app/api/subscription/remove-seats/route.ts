import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { seatsCount = 1 } = body;

    const token = req.cookies.get("torque_token")?.value;
    const session = token ? verifySessionToken(token) : null;

    let tenant = null;
    if (session?.tenantId) {
      tenant = await prisma.tenant.findUnique({ where: { id: session.tenantId } });
    }

    if (!tenant && session?.email) {
      tenant = await prisma.tenant.findFirst({ where: { ownerEmail: session.email } });
    }

    if (!tenant) {
      tenant = await prisma.tenant.findFirst({ where: { active: true }, orderBy: { createdAt: "desc" } });
    }

    if (!tenant) {
      return NextResponse.json({ success: false, error: "Oficina não encontrada" }, { status: 404 });
    }

    const baseLimit = tenant.plan === "ELITE" ? 8 : tenant.plan === "PRO" ? 4 : 2;
    const currentMax = tenant.maxUsers || baseLimit;
    const newMaxUsers = Math.max(baseLimit, currentMax - Number(seatsCount));

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: { maxUsers: newMaxUsers },
    });

    // Se o número de funcionários ativos exceder a nova cota (Dono + N operadores)
    const allowedActiveEmployees = Math.max(1, newMaxUsers - 1);
    const activeEmployees = await prisma.employee.findMany({
      where: { tenantId: tenant.id, active: true },
      orderBy: { createdAt: "asc" },
    });

    if (activeEmployees.length > allowedActiveEmployees) {
      const excess = activeEmployees.slice(allowedActiveEmployees);
      for (const emp of excess) {
        await prisma.employee.update({
          where: { id: emp.id },
          data: { active: false },
        });
      }
    }

    return NextResponse.json({
      success: true,
      maxUsers: updatedTenant.maxUsers,
      message: `Assentos reduzidos com sucesso! Limite atual: ${updatedTenant.maxUsers} usuários.`,
    });
  } catch (error: any) {
    console.error("Erro ao remover assentos extras:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao remover assentos" },
      { status: 500 }
    );
  }
}
