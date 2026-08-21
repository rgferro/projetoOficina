export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSessionToken, hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { login, password } = body;

    if (!login || !password) {
      return NextResponse.json(
        { success: false, error: "Informe seu e-mail e senha de acesso." },
        { status: 400 }
      );
    }

    const cleanLogin = login.trim().toLowerCase();

    // 1. Caso especial: Super Admin Master (Rafael)
    if (cleanLogin === "rafael.gielow@gmail.com") {
      let masterTenant = await prisma.tenant.findFirst({
        where: { ownerEmail: cleanLogin },
      });

      if (!masterTenant) {
        // Inicializa automaticamente a Oficina Matriz de testes do Super Admin
        masterTenant = await prisma.tenant.create({
          data: {
            name: "Torque Matriz & Demonstração Master",
            ownerName: "Rafael Gielow (Master Admin)",
            ownerEmail: cleanLogin,
            ownerPassword: hashPassword(password),
            plan: "ELITE",
            maxUsers: 999,
            subscriptionStatus: "active",
            isMaster: true,
          },
        });
      }

      let masterEmployee = await prisma.employee.findFirst({
        where: { email: cleanLogin },
      });

      if (!masterEmployee) {
        masterEmployee = await prisma.employee.create({
          data: {
            tenantId: masterTenant.id,
            name: "Rafael Gielow",
            email: cleanLogin,
            role: "Super Administrador",
            accessLevel: "ADMIN",
            pinCode: "1234",
            active: true,
          },
        });
      }

      // Valida senha do Master (se já tiver hash salvo valida, senão atualiza)
      if (masterTenant.ownerPassword) {
        const isValid = verifyPassword(password, masterTenant.ownerPassword);
        if (!isValid) {
          return NextResponse.json(
            { success: false, error: "Senha incorreta para o usuário Master." },
            { status: 401 }
          );
        }
      } else {
        await prisma.tenant.update({
          where: { id: masterTenant.id },
          data: { ownerPassword: hashPassword(password) },
        });
      }

      const token = createSessionToken({
        userId: masterEmployee.id,
        tenantId: masterTenant.id,
        name: masterEmployee.name,
        email: cleanLogin,
        role: "Super Administrador",
        accessLevel: "ADMIN",
        isMaster: true,
        workshopName: masterTenant.name,
        plan: "ELITE",
      });

      const response = NextResponse.json({
        success: true,
        message: "Login de Super Administrador realizado!",
        token,
        user: {
          id: masterEmployee.id,
          name: masterEmployee.name,
          email: cleanLogin,
          role: "Super Administrador",
          accessLevel: "ADMIN",
          isMaster: true,
          workshopName: masterTenant.name,
          plan: "ELITE",
        },
      });

      response.cookies.set("torque_token", token, {
        path: "/",
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });

      return response;
    }

    // 2. Busca por Dono da Oficina (Tenant)
    const tenant = await prisma.tenant.findUnique({
      where: { ownerEmail: cleanLogin },
    });

    if (tenant && tenant.ownerPassword) {
      const isValid = verifyPassword(password, tenant.ownerPassword);
      if (isValid) {
        let employee = await prisma.employee.findFirst({
          where: { tenantId: tenant.id, accessLevel: "ADMIN" },
        });

        if (!employee) {
          employee = await prisma.employee.create({
            data: {
              tenantId: tenant.id,
              name: tenant.ownerName,
              email: tenant.ownerEmail,
              role: "Administrador da Oficina",
              accessLevel: "ADMIN",
              pinCode: "1234",
              active: true,
            },
          });
        }

        // Atualiza o último IP de login e registra auditoria
        const { getClientIp, logAuditEvent } = await import("@/lib/audit");
        const clientIp = getClientIp(req);
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { lastLoginIp: clientIp },
        });

        await logAuditEvent({
          action: "LOGIN_SUCCESS",
          req,
          tenantId: tenant.id,
          userEmail: tenant.ownerEmail,
          details: { role: "ADMIN", isOwner: true },
        });

        const token = createSessionToken({
          userId: employee.id,
          tenantId: tenant.id,
          name: employee.name,
          email: tenant.ownerEmail,
          role: employee.role,
          accessLevel: "ADMIN",
          isMaster: tenant.isMaster,
          workshopName: tenant.name,
          plan: tenant.plan,
        });

        const response = NextResponse.json({
          success: true,
          message: `Bem-vindo de volta, ${employee.name}!`,
          token,
          user: {
            id: employee.id,
            name: employee.name,
            email: tenant.ownerEmail,
            role: employee.role,
            accessLevel: "ADMIN",
            isMaster: tenant.isMaster,
            workshopName: tenant.name,
            plan: tenant.plan,
          },
        });

        response.cookies.set("torque_token", token, {
          path: "/",
          httpOnly: false,
          maxAge: 60 * 60 * 24 * 365,
          sameSite: "lax",
        });

        return response;
      }
    }

    // 3. Busca por Funcionário (Operador, Mecânico, Lavador, Atendente)
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [{ email: cleanLogin }, { name: cleanLogin }],
        active: true,
      },
      include: { tenant: true },
    });

    if (employee) {
      // Valida por PIN ou senha
      const isPinMatch = employee.pinCode === password;
      const isPassMatch = employee.password ? verifyPassword(password, employee.password) : false;

      if (isPinMatch || isPassMatch) {
        const token = createSessionToken({
          userId: employee.id,
          tenantId: employee.tenantId || "default",
          name: employee.name,
          email: employee.email || `${employee.id}@torquerp.com.br`,
          role: employee.role,
          accessLevel: (employee.accessLevel as any) || "MECANICO",
          isMaster: false,
          workshopName: employee.tenant?.name || "Minha Oficina",
          plan: employee.tenant?.plan || "STARTER",
        });

        const response = NextResponse.json({
          success: true,
          message: `Olá, ${employee.name}!`,
          token,
          user: {
            id: employee.id,
            name: employee.name,
            role: employee.role,
            accessLevel: employee.accessLevel,
            isMaster: false,
            workshopName: employee.tenant?.name || "Minha Oficina",
            plan: employee.tenant?.plan || "STARTER",
          },
        });

        response.cookies.set("torque_token", token, {
          path: "/",
          httpOnly: false,
          maxAge: 60 * 60 * 24 * 365,
          sameSite: "lax",
        });

        return response;
      }
    }

    return NextResponse.json(
      { success: false, error: "E-mail, usuário ou senha inválidos." },
      { status: 401 }
    );
  } catch (error: any) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro interno ao realizar login." },
      { status: 500 }
    );
  }
}
