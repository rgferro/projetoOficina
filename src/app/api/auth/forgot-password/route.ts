import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { logAuditEvent, getClientIp } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Informe um e-mail válido para recuperação." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Procura se existe Tenant (Dono) ou Funcionário associado a este e-mail
    const tenant = await prisma.tenant.findUnique({
      where: { ownerEmail: cleanEmail },
    });

    const employee = await prisma.employee.findFirst({
      where: { email: cleanEmail, active: true },
    });

    if (!tenant && !employee) {
      return NextResponse.json(
        {
          success: false,
          error: "Nenhuma conta ou oficina cadastrada foi encontrada com este e-mail.",
        },
        { status: 404 }
      );
    }

    const recipientName = tenant?.ownerName || employee?.name || "Usuário";

    // 2. Gera código numérico aleatório de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Expira em 15 minutos
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // 3. Salva ou atualiza na tabela de verificação
    await prisma.emailVerification.upsert({
      where: { email: cleanEmail },
      create: {
        email: cleanEmail,
        code,
        expiresAt,
      },
      update: {
        code,
        expiresAt,
      },
    });

    // 4. Registra auditoria
    await logAuditEvent({
      action: "FORGOT_PASSWORD_REQUESTED",
      req,
      tenantId: tenant?.id || employee?.tenantId || undefined,
      userEmail: cleanEmail,
      details: {
        recipientName,
        isOwner: !!tenant,
        isEmployee: !!employee,
      },
    });

    // 5. Envia o e-mail via Brevo API
    const emailResult: any = await sendPasswordResetEmail(cleanEmail, code, recipientName);

    if (emailResult && emailResult.success === false && !emailResult.simulated) {
      console.warn("⚠️ Aviso no envio de e-mail de recuperação:", emailResult);
    }

    return NextResponse.json({
      success: true,
      message: `Código de recuperação de 6 dígitos enviado para ${cleanEmail}. Verifique sua caixa de entrada ou spam!`,
    });
  } catch (error: any) {
    console.error("Erro ao solicitar recuperação de senha:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao processar solicitação de recuperação de senha." },
      { status: 500 }
    );
  }
}
