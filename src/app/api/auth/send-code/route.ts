export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Informe um e-mail válido." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Verifica se o e-mail já possui cadastro
    const existingTenant = await prisma.tenant.findUnique({
      where: { ownerEmail: cleanEmail },
    });

    if (existingTenant) {
      return NextResponse.json(
        { success: false, error: "Este e-mail já está cadastrado. Faça login na sua conta." },
        { status: 400 }
      );
    }

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

    // 4. Envia o e-mail via Brevo API
    const emailResult: any = await sendVerificationEmail(cleanEmail, code);

    if (emailResult && emailResult.success === false && !emailResult.simulated) {
      console.warn("⚠️ Aviso no envio de e-mail:", emailResult);
    }

    return NextResponse.json({
      success: true,
      message: `Código de 6 dígitos enviado para ${cleanEmail}. Verifique sua caixa de entrada ou spam!`,
    });
  } catch (error: any) {
    console.error("Erro ao enviar código de e-mail:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao enviar código de verificação." },
      { status: 500 }
    );
  }
}
