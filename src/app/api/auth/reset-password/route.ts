export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { validatePasswordStrength } from "@/lib/validation";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code, newPassword } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Informe um e-mail válido." },
        { status: 400 }
      );
    }

    if (!code || code.trim().length !== 6) {
      return NextResponse.json(
        { success: false, error: "Digite o código de verificação de 6 dígitos." },
        { status: 400 }
      );
    }

    if (!newPassword) {
      return NextResponse.json(
        { success: false, error: "Digite a sua nova senha." },
        { status: 400 }
      );
    }

    // 1. Validação de Senha Forte
    const passCheck = validatePasswordStrength(newPassword);
    if (!passCheck.isValid) {
      return NextResponse.json(
        { success: false, error: passCheck.message },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    // 2. Validação do Código de Verificação na tabela EmailVerification
    const verification = await prisma.emailVerification.findUnique({
      where: { email: cleanEmail },
    });

    if (!verification || verification.code !== cleanCode) {
      return NextResponse.json(
        { success: false, error: "Código de verificação incorreto ou inválido." },
        { status: 400 }
      );
    }

    if (new Date() > new Date(verification.expiresAt)) {
      return NextResponse.json(
        { success: false, error: "Este código expirou. Por favor, solicite um novo código de recuperação." },
        { status: 400 }
      );
    }

    // 3. Hash criptográfico seguro PBKDF2
    const passwordHash = hashPassword(newPassword);

    // 4. Atualiza no Tenant (Dono da Oficina) se existir
    const tenant = await prisma.tenant.findUnique({
      where: { ownerEmail: cleanEmail },
    });

    if (tenant) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { ownerPassword: passwordHash },
      });
    }

    // 5. Atualiza no Funcionário se existir
    const employees = await prisma.employee.findMany({
      where: { email: cleanEmail, active: true },
    });

    if (employees.length > 0) {
      await prisma.employee.updateMany({
        where: { email: cleanEmail, active: true },
        data: { password: passwordHash },
      });
    }

    if (!tenant && employees.length === 0) {
      return NextResponse.json(
        { success: false, error: "Nenhuma conta ativa encontrada com este e-mail." },
        { status: 404 }
      );
    }

    // 6. Remove o código de verificação para prevenir reutilização
    try {
      await prisma.emailVerification.delete({
        where: { email: cleanEmail },
      });
    } catch {
      // Ignore if already deleted
    }

    // 7. Registra auditoria de segurança
    await logAuditEvent({
      action: "PASSWORD_RESET_SUCCESS",
      req,
      tenantId: tenant?.id || employees[0]?.tenantId || undefined,
      userEmail: cleanEmail,
      details: {
        updatedTenant: !!tenant,
        updatedEmployeesCount: employees.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Senha redefinida com sucesso! Agora você pode entrar com sua nova senha.",
    });
  } catch (error: any) {
    console.error("Erro ao redefinir senha:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro interno ao redefinir senha." },
      { status: 500 }
    );
  }
}
