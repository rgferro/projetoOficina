import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      ownerName,
      ownerEmail,
      ownerPassword,
      ownerPhone,
      workshopName,
      document,
    } = body;

    if (!ownerName || !ownerEmail || !ownerPassword || !workshopName) {
      return NextResponse.json(
        { success: false, error: "Por favor, preencha todos os campos obrigatórios." },
        { status: 400 }
      );
    }

    const cleanEmail = ownerEmail.trim().toLowerCase();

    // Verifica se o e-mail já está cadastrado
    const existing = await prisma.tenant.findUnique({
      where: { ownerEmail: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Este e-mail já está cadastrado. Faça login ou use outro e-mail." },
        { status: 400 }
      );
    }

    const isMaster = cleanEmail === "rafael.gielow@gmail.com";
    const passwordHash = hashPassword(ownerPassword);

    // 1. Cria a Oficina / Tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: workshopName.trim(),
        document: document ? document.trim() : null,
        ownerName: ownerName.trim(),
        ownerEmail: cleanEmail,
        ownerPassword: passwordHash,
        ownerPhone: ownerPhone ? ownerPhone.trim() : null,
        plan: "STARTER",
        maxUsers: 2, // 2 Usuários Grátis no Starter
        subscriptionStatus: "active",
        isMaster,
      },
    });

    // 2. Cria o Dono como Primeiro Colaborador / Administrador da Oficina
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

    // 3. Cria token de sessão
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

    // Salva cookie de sessão seguro
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
