import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken } from "@/lib/auth";
import { validateCPF, validateCNPJ } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      ownerName,
      ownerEmail,
      ownerPassword,
      ownerPhone,
      workshopName,
      documentType, // "CPF" ou "CNPJ"
      document,
      cep,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      verificationCode, // Código de 6 dígitos enviado por e-mail
    } = body;

    if (!ownerName || !ownerEmail || !ownerPassword || !workshopName) {
      return NextResponse.json(
        { success: false, error: "Por favor, preencha todos os campos obrigatórios." },
        { status: 400 }
      );
    }

    const cleanEmail = ownerEmail.trim().toLowerCase();

    // 1. Validação de CPF ou CNPJ
    if (document) {
      const cleanDoc = document.replace(/\D/g, "");
      if (documentType === "CPF" || cleanDoc.length === 11) {
        if (!validateCPF(cleanDoc)) {
          return NextResponse.json(
            { success: false, error: "O CPF informado é inválido. Verifique os números digitados." },
            { status: 400 }
          );
        }
      } else if (documentType === "CNPJ" || cleanDoc.length === 14) {
        if (!validateCNPJ(cleanDoc)) {
          return NextResponse.json(
            { success: false, error: "O CNPJ informado é inválido. Verifique os números digitados." },
            { status: 400 }
          );
        }
      }
    }

    // 2. Validação do Código de 6 Dígitos do E-mail
    if (!verificationCode) {
      return NextResponse.json(
        { success: false, error: "Informe o código de verificação de 6 dígitos enviado para seu e-mail." },
        { status: 400 }
      );
    }

    const cleanCode = verificationCode.trim();
    const verification = await prisma.emailVerification.findUnique({
      where: { email: cleanEmail },
    });

    if (!verification || verification.code !== cleanCode) {
      return NextResponse.json(
        { success: false, error: "Código de verificação incorreto. Verifique o código recebido no seu e-mail." },
        { status: 400 }
      );
    }

    if (new Date() > new Date(verification.expiresAt)) {
      return NextResponse.json(
        { success: false, error: "O código de verificação expirou. Solicite um novo código." },
        { status: 400 }
      );
    }

    // 3. Verifica se o e-mail já está cadastrado
    const existing = await prisma.tenant.findUnique({
      where: { ownerEmail: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Este e-mail já está cadastrado. Faça login na sua conta." },
        { status: 400 }
      );
    }

    const isMaster = cleanEmail === "rafael.gielow@gmail.com";
    const passwordHash = hashPassword(ownerPassword);

    // 4. Cria a Oficina / Tenant com dados de endereço completos
    const tenant = await prisma.tenant.create({
      data: {
        name: workshopName.trim(),
        document: document ? document.trim() : null,
        ownerName: ownerName.trim(),
        ownerEmail: cleanEmail,
        ownerPassword: passwordHash,
        ownerPhone: ownerPhone ? ownerPhone.trim() : null,
        cep: cep ? cep.trim() : null,
        street: street ? street.trim() : null,
        number: number ? number.trim() : null,
        complement: complement ? complement.trim() : null,
        neighborhood: neighborhood ? neighborhood.trim() : null,
        city: city ? city.trim() : null,
        state: state ? state.trim() : null,
        plan: "STARTER",
        maxUsers: 2, // 2 Usuários Grátis no Starter
        subscriptionStatus: "active",
        isMaster,
      },
    });

    // 5. Cria o Dono como Primeiro Colaborador / Administrador da Oficina
    const employee = await prisma.employee.create({
      data: {
        tenantId: tenant.id,
        name: ownerName.trim(),
        role: "Proprietário / Administrador",
        accessLevel: "ADMIN",
        email: cleanEmail,
        phone: ownerPhone || null,
        password: passwordHash,
        pinCode: "1234",
        active: true,
      },
    });

    // Limpa o código de verificação utilizado
    await prisma.emailVerification.delete({ where: { email: cleanEmail } }).catch(() => {});

    // 6. Cria token de sessão
    const sessionToken = createSessionToken({
      userId: employee.id,
      tenantId: tenant.id,
      name: employee.name,
      email: cleanEmail,
      role: employee.role,
      accessLevel: "ADMIN",
      isMaster,
      workshopName: tenant.name,
      plan: tenant.plan,
    });

    const response = NextResponse.json({
      success: true,
      message: "Cadastro realizado com sucesso! Bem-vindo ao Torque ERP.",
      token: sessionToken,
      user: {
        id: employee.id,
        name: employee.name,
        email: cleanEmail,
        accessLevel: "ADMIN",
        isMaster,
        workshopName: tenant.name,
        plan: tenant.plan,
      },
    });

    response.cookies.set("torque_token", sessionToken, {
      path: "/",
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    console.error("Erro no cadastro de oficina:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro interno ao cadastrar oficina." },
      { status: 500 }
    );
  }
}
