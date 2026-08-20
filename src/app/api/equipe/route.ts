import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendEmployeeInviteEmail } from "@/lib/email";
import { hashPassword, verifySessionToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token =
      req.cookies.get("torque_token")?.value ||
      req.cookies.get("torque_session")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");
    const session = token ? verifySessionToken(token) : null;

    const { searchParams } = new URL(req.url);
    const paramTenantId = searchParams.get("tenantId") || req.headers.get("x-tenant-id");

    let targetTenantId: string | undefined = session?.tenantId || paramTenantId || undefined;
    if (!targetTenantId) {
      const defaultTenant = await prisma.tenant.findFirst({
        where: { active: true },
        orderBy: { createdAt: "desc" },
      });
      targetTenantId = defaultTenant?.id;
    }

    const employees = await prisma.employee.findMany({
      where: targetTenantId ? { tenantId: targetTenantId } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        washTickets: {
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        },
        orderItems: {
          where: {
            serviceOrder: {
              status: "CONCLUIDO",
              createdAt: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              },
            },
          },
          include: {
            serviceOrder: true,
          },
        },
      },
    });

    // Calcula faturamento mensal gerado por cada colaborador e comissão estimada
    const enriched = employees.map((emp) => {
      const washVolume = emp.washTickets.reduce((sum, w) => sum + w.price, 0);
      const osServicesVolume = emp.orderItems
        .filter((item) => item.type === "SERVICO")
        .reduce((sum, item) => sum + item.totalPrice, 0);
      const totalVolume = washVolume + osServicesVolume;
      const estimatedCommission = totalVolume * (emp.commissionRate / 100);

      return {
        id: emp.id,
        name: emp.name,
        role: emp.role,
        accessLevel: emp.accessLevel,
        email: emp.email,
        phone: emp.phone,
        commissionRate: emp.commissionRate,
        inviteToken: emp.inviteToken,
        hasPassword: !!emp.password,
        active: emp.active,
        createdAt: emp.createdAt,
        totalServicesThisMonth: emp.washTickets.length + emp.orderItems.length,
        totalVolumeThisMonth: totalVolume,
        estimatedCommissionThisMonth: estimatedCommission,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Erro ao buscar equipe:", error);
    return NextResponse.json({ error: "Erro ao buscar equipe" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token =
      req.cookies.get("torque_token")?.value ||
      req.cookies.get("torque_session")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");
    const session = token ? verifySessionToken(token) : null;

    const body = await req.json();
    const { name, role, accessLevel, email, phone, commissionRate, password, tenantId: bodyTenantId } = body;

    if (!name || !role) {
      return NextResponse.json(
        { error: "Nome e Cargo são obrigatórios" },
        { status: 400 }
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Informe um e-mail válido para o funcionário." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Busca dados da oficina do proprietário logado
    const targetTenantId = session?.tenantId || bodyTenantId;
    let tenant: any = null;
    if (targetTenantId) {
      tenant = await prisma.tenant.findUnique({ where: { id: targetTenantId } });
    } else {
      tenant = await prisma.tenant.findFirst({ where: { active: true }, orderBy: { createdAt: "desc" } });
    }

    if (!tenant) {
      return NextResponse.json(
        { error: "Oficina não encontrada para cadastrar o colaborador." },
        { status: 404 }
      );
    }

    // Verifica se já existe um funcionário com este e-mail nesta mesma oficina
    const existing = await prisma.employee.findFirst({
      where: {
        email: cleanEmail,
        tenantId: tenant.id,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Já existe um membro da equipe cadastrado com este e-mail nesta oficina." },
        { status: 400 }
      );
    }

    const activeCount = await prisma.employee.count({
      where: { tenantId: tenant.id, active: true },
    });
    const maxAllowedEmployees = Math.max(0, (tenant.maxUsers || 1) - 1);
    if (activeCount >= maxAllowedEmployees) {
      if (maxAllowedEmployees === 0) {
        return NextResponse.json(
          {
            error: "Seu plano atual (Torque Starter) permite apenas 1 Usuário único (Proprietário). Para adicionar e convidar membros para a sua equipe, faça upgrade para o Plano Torque Oficina Pro.",
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        {
          error: `Seu plano atual (${tenant.plan}) permite até ${tenant.maxUsers} usuários no total (1 Proprietário + ${maxAllowedEmployees} Colaborador(es) ativos). Para cadastrar mais membros, faça upgrade de plano ou adicione assentos extras.`,
        },
        { status: 400 }
      );
    }

    // Gera token de convite com validade de 48 horas
    const inviteToken = crypto.randomBytes(24).toString("hex");
    const inviteExpiresAt = new Date();
    inviteExpiresAt.setHours(inviteExpiresAt.getHours() + 48);

    const employee = await prisma.employee.create({
      data: {
        tenantId: tenant.id,
        name: name.trim(),
        role: role.trim(),
        accessLevel: accessLevel || "MECANICO",
        email: cleanEmail,
        phone: phone ? phone.trim() : null,
        commissionRate: Number(commissionRate) || 0,
        password: password ? hashPassword(password) : null,
        inviteToken,
        inviteExpiresAt,
        active: true,
      },
    });

    // Constrói o link de convite oficial
    const appUrl = process.env.APP_URL || "https://torquerp.com.br";
    const forwardedHost = req.headers.get("x-forwarded-host");
    const host = forwardedHost || req.headers.get("host") || "";
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
    const baseUrl = !isLocal && host ? `https://${host}` : (isLocal ? `http://${host}` : appUrl);
    const inviteLink = `${baseUrl}/convite?token=${inviteToken}`;

    // Dispara e-mail de convite via Brevo REST API v3
    await sendEmployeeInviteEmail({
      employeeName: employee.name,
      employeeEmail: cleanEmail,
      role: employee.role,
      workshopName: tenant.name || "Torque ERP",
      ownerName: tenant.ownerName || "Administração",
      inviteLink,
    }).catch((err) => console.error("Erro ao enviar e-mail de convite:", err));

    return NextResponse.json(
      {
        success: true,
        employee,
        message: password
          ? `Funcionário ${employee.name} cadastrado com sucesso! Já pode realizar login.`
          : `Convite enviado com sucesso para ${cleanEmail}! O funcionário receberá um link para criar sua senha de acesso.`,
        inviteLink,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erro ao cadastrar funcionário:", error);
    return NextResponse.json({ error: error.message || "Erro ao cadastrar funcionário" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token =
      req.cookies.get("torque_token")?.value ||
      req.cookies.get("torque_session")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");
    const session = token ? verifySessionToken(token) : null;

    const body = await req.json();
    const { id, name, role, accessLevel, email, phone, commissionRate, password, active } = body;

    if (!id || !name || !role) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const currentEmp = await prisma.employee.findUnique({ where: { id } });
    if (!currentEmp) {
      return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 });
    }

    // Validação de Tenant: se sessão existe e não for master admin, impede modificar funcionário de outra oficina
    if (session?.tenantId && !session.isMaster && currentEmp.tenantId && currentEmp.tenantId !== session.tenantId) {
      return NextResponse.json({ error: "Acesso não autorizado para modificar colaborador de outra oficina" }, { status: 403 });
    }

    if (!currentEmp.active && active === true) {
      const tenant = currentEmp.tenantId
        ? await prisma.tenant.findUnique({ where: { id: currentEmp.tenantId } })
        : (session?.tenantId ? await prisma.tenant.findUnique({ where: { id: session.tenantId } }) : await prisma.tenant.findFirst({ where: { active: true }, orderBy: { createdAt: "desc" } }));

      if (tenant) {
        const activeCount = await prisma.employee.count({
          where: { tenantId: tenant.id, active: true },
        });
        const maxAllowedEmployees = Math.max(1, (tenant.maxUsers || 2) - 1);
        if (activeCount >= maxAllowedEmployees) {
          return NextResponse.json(
            {
              error: `Limite de usuários atingido! Seu plano atual (${tenant.plan}) permite no máximo ${maxAllowedEmployees} funcionário ativo (+ 1 Proprietário). Desative outro colaborador ou faça upgrade para o Plano Pro.`,
            },
            { status: 400 }
          );
        }
      }
    }

    const updateData: any = {
      name: name.trim(),
      role: role.trim(),
      accessLevel,
      email: email ? email.trim().toLowerCase() : null,
      phone: phone ? phone.trim() : null,
      commissionRate: Number(commissionRate) || 0,
      active: active !== undefined ? active : true,
    };

    if (password && password.trim().length > 0) {
      updateData.password = hashPassword(password.trim());
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      employee,
      message: "Dados do funcionário atualizados com sucesso!",
    });
  } catch (error: any) {
    console.error("Erro ao atualizar funcionário:", error);
    return NextResponse.json({ error: error.message || "Erro ao atualizar funcionário" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token =
      req.cookies.get("torque_token")?.value ||
      req.cookies.get("torque_session")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");
    const session = token ? verifySessionToken(token) : null;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
    }

    const currentEmp = await prisma.employee.findUnique({ where: { id } });
    if (!currentEmp) {
      return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 });
    }

    // Validação de Tenant: impede deletar colaborador de outra oficina
    if (session?.tenantId && !session.isMaster && currentEmp.tenantId && currentEmp.tenantId !== session.tenantId) {
      return NextResponse.json({ error: "Acesso não autorizado para remover colaborador de outra oficina" }, { status: 403 });
    }

    await prisma.employee.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao remover funcionário:", error);
    return NextResponse.json({ error: error.message || "Erro ao remover funcionário" }, { status: 500 });
  }
}
