import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken } from "@/lib/auth";
import { validatePasswordStrength } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token de convite não fornecido." },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Digite a sua nova senha." },
        { status: 400 }
      );
    }

    // Validação de Senha Forte
    const passCheck = validatePasswordStrength(password);
    if (!passCheck.isValid) {
      return NextResponse.json(
        { success: false, error: passCheck.message },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { inviteToken: token },
      include: { tenant: true },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Convite inválido ou já utilizado." },
        { status: 404 }
      );
    }

    if (employee.inviteExpiresAt && new Date() > new Date(employee.inviteExpiresAt)) {
      return NextResponse.json(
        { success: false, error: "Este convite expirou. Solicite um novo convite ao dono da oficina." },
        { status: 400 }
      );
    }

    const passwordHash = hashPassword(password);

    // Salva a senha e invalida o token de convite
    const updatedEmployee = await prisma.employee.update({
      where: { id: employee.id },
      data: {
        password: passwordHash,
        inviteToken: null,
        inviteExpiresAt: null,
      },
    });

    // Cria token de sessão para login imediato
    const sessionToken = createSessionToken({
      userId: updatedEmployee.id,
      name: updatedEmployee.name,
      email: updatedEmployee.email || "",
      role: updatedEmployee.role,
      accessLevel: (updatedEmployee.accessLevel as any) || "ATENDENTE",
      tenantId: updatedEmployee.tenantId || "default",
      isOwner: false,
      isMaster: false,
    });

    const userPayload = {
      id: updatedEmployee.id,
      name: updatedEmployee.name,
      email: updatedEmployee.email || "",
      role: updatedEmployee.role,
      accessLevel: updatedEmployee.accessLevel,
      tenantId: updatedEmployee.tenantId || "default",
      workshopName: employee.tenant?.name || "Torque ERP",
      isOwner: false,
      isMaster: false,
      token: sessionToken,
    };

    const response = NextResponse.json({
      success: true,
      message: "Senha criada com sucesso! Redirecionando para o painel...",
      user: userPayload,
    });

    response.cookies.set("torque_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Erro ao ativar convite do funcionário:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao salvar senha de acesso." },
      { status: 500 }
    );
  }
}
