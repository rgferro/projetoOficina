export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, verifySessionToken, createSessionToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let userId = searchParams.get("userId");

    const token =
      req.cookies.get("torque_token")?.value ||
      req.cookies.get("torque_session")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");
    const session = token ? verifySessionToken(token) : null;

    if (!userId && session?.userId) {
      userId = session.userId;
    }

    if (!userId && !session?.email) {
      return NextResponse.json({ error: "Sessão não informada" }, { status: 400 });
    }

    // 1. Tenta encontrar em Employee por ID ou e-mail
    let employee = userId
      ? await prisma.employee.findUnique({
          where: { id: userId },
          include: { tenant: true },
        })
      : null;

    if (!employee && session?.email) {
      employee = await prisma.employee.findFirst({
        where: { email: session.email },
        include: { tenant: true },
      });
    }

    if (employee) {
      const isOwner = false;
      const newToken = createSessionToken({
        userId: employee.id,
        tenantId: employee.tenantId || "default",
        name: employee.name,
        email: employee.email || `${employee.id}@torquerp.com.br`,
        role: employee.role,
        accessLevel: employee.accessLevel as any,
        isMaster: session?.isMaster || false,
        workshopName: employee.tenant?.name || "Minha Oficina",
        plan: employee.tenant?.plan || "STARTER",
        isOwner,
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          phone: employee.phone,
          role: employee.role,
          accessLevel: employee.accessLevel,
          workshopName: employee.tenant?.name || "Minha Oficina",
          isOwner,
          plan: employee.tenant?.plan || "STARTER",
          active: employee.active,
        },
        token: newToken,
      });

      response.cookies.set("torque_token", newToken, {
        path: "/",
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });

      return response;
    }

    // 2. Tenta encontrar em Tenant (Dono) por ID ou por ownerEmail
    let tenant = userId
      ? await prisma.tenant.findUnique({
          where: { id: userId },
        })
      : null;

    if (!tenant && session?.email) {
      tenant = await prisma.tenant.findUnique({
        where: { ownerEmail: session.email },
      });
    }

    if (tenant) {
      const newToken = createSessionToken({
        userId: tenant.id,
        tenantId: tenant.id,
        name: tenant.ownerName,
        email: tenant.ownerEmail,
        role: "Proprietário",
        accessLevel: "ADMIN",
        isMaster: tenant.isMaster || false,
        workshopName: tenant.name,
        plan: tenant.plan,
        isOwner: true,
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: tenant.id,
          name: tenant.ownerName,
          email: tenant.ownerEmail,
          phone: tenant.ownerPhone || "",
          role: "Proprietário",
          accessLevel: "ADMIN",
          workshopName: tenant.name,
          isOwner: true,
          plan: tenant.plan,
          isMaster: tenant.isMaster,
        },
        token: newToken,
      });

      response.cookies.set("torque_token", newToken, {
        path: "/",
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });

      return response;
    }

    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  } catch (error: any) {
    console.error("Erro ao buscar perfil:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name, phone, currentPassword, newPassword } = body;

    if (!userId) {
      return NextResponse.json({ error: "ID do usuário obrigatório" }, { status: 400 });
    }

    // 1. Atualizar Funcionário
    const employee = await prisma.employee.findUnique({ where: { id: userId } });
    if (employee) {
      // Se informou nova senha, valida a senha atual (caso ele já possua uma)
      if (newPassword && newPassword.trim().length > 0) {
        if (employee.password && currentPassword) {
          const isValid = verifyPassword(currentPassword, employee.password);
          if (!isValid) {
            return NextResponse.json(
              { error: "A senha atual informada está incorreta." },
              { status: 400 }
            );
          }
        }
        if (newPassword.trim().length < 6) {
          return NextResponse.json(
            { error: "A nova senha deve conter no mínimo 6 caracteres." },
            { status: 400 }
          );
        }
      }

      const updated = await prisma.employee.update({
        where: { id: userId },
        data: {
          name: name ? name.trim() : employee.name,
          phone: phone ? phone.trim() : employee.phone,
          password:
            newPassword && newPassword.trim().length >= 6
              ? hashPassword(newPassword.trim())
              : employee.password,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Dados atualizados com sucesso!",
        user: {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          phone: updated.phone,
          role: updated.role,
          accessLevel: updated.accessLevel,
        },
      });
    }

    // 2. Atualizar Proprietário (Tenant)
    const tenant = await prisma.tenant.findUnique({ where: { id: userId } });
    if (tenant) {
      if (newPassword && newPassword.trim().length > 0) {
        if (tenant.ownerPassword && currentPassword) {
          const isValid = verifyPassword(currentPassword, tenant.ownerPassword);
          if (!isValid) {
            return NextResponse.json(
              { error: "A senha atual informada está incorreta." },
              { status: 400 }
            );
          }
        }
        if (newPassword.trim().length < 6) {
          return NextResponse.json(
            { error: "A nova senha deve conter no mínimo 6 caracteres." },
            { status: 400 }
          );
        }
      }

      const updated = await prisma.tenant.update({
        where: { id: userId },
        data: {
          ownerName: name ? name.trim() : tenant.ownerName,
          ownerPhone: phone ? phone.trim() : tenant.ownerPhone,
          ownerPassword:
            newPassword && newPassword.trim().length >= 6
              ? hashPassword(newPassword.trim())
              : tenant.ownerPassword,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Dados do proprietário atualizados com sucesso!",
        user: {
          id: updated.id,
          name: updated.ownerName,
          email: updated.ownerEmail,
          phone: updated.ownerPhone,
          role: "Proprietário / Administrador",
          accessLevel: "ADMIN",
        },
      });
    }

    return NextResponse.json({ error: "Usuário não localizado para alteração" }, { status: 404 });
  } catch (error: any) {
    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
