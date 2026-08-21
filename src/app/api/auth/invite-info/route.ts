export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token de convite não fornecido." },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { inviteToken: token },
      include: { tenant: true },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Convite inválido ou já utilizado. Entre em contato com o dono da oficina." },
        { status: 404 }
      );
    }

    if (employee.inviteExpiresAt && new Date() > new Date(employee.inviteExpiresAt)) {
      return NextResponse.json(
        { success: false, error: "Este convite expirou. Solicite um novo convite ao dono da oficina." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        accessLevel: employee.accessLevel,
      },
      workshop: {
        name: employee.tenant?.name || "Torque ERP",
        ownerName: employee.tenant?.ownerName || "Administrador",
      },
    });
  } catch (error: any) {
    console.error("Erro ao validar convite:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao validar convite." },
      { status: 500 }
    );
  }
}
