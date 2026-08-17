import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "ID do usuário não fornecido" }, { status: 400 });
    }

    // Tenta encontrar em Employee
    const employee = await prisma.employee.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });

    if (employee) {
      return NextResponse.json({
        success: true,
        user: {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          phone: employee.phone,
          role: employee.role,
          accessLevel: employee.accessLevel,
          workshopName: employee.tenant?.name || "Minha Oficina",
          isOwner: false,
        },
      });
    }

    // Tenta encontrar em Tenant (Dono)
    const tenant = await prisma.tenant.findUnique({
      where: { id: userId },
    });

    if (tenant) {
      return NextResponse.json({
        success: true,
        user: {
          id: tenant.id,
          name: tenant.ownerName,
          email: tenant.ownerEmail,
          phone: tenant.phone,
          role: "Proprietário / Administrador",
          accessLevel: "ADMIN",
          workshopName: tenant.name,
          isOwner: true,
        },
      });
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
          phone: phone ? phone.trim() : tenant.phone,
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
          phone: updated.phone,
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
