import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendEmployeeInviteEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId");

    const whereClause: any = {};
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    const employees = await prisma.employee.findMany({
      where: whereClause,
      include: {
        tenant: true,
        washTickets: {
          where: { status: "ENTREGUE" },
          select: { price: true, enteredAt: true },
        },
        serviceOrders: {
          where: { status: "CONCLUIDO" },
          select: { grandTotal: true, totalServices: true, createdAt: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const enriched = employees.map((emp) => {
      const totalWashes = emp.washTickets.length;
      const washVolume = emp.washTickets.reduce((sum, w) => sum + w.price, 0);

      const totalOS = emp.serviceOrders.length;
      const osServicesVolume = emp.serviceOrders.reduce(
        (sum, os) => sum + os.totalServices,
        0
      );

      const totalEligibleVolume = washVolume + osServicesVolume;
      const estimatedCommission = (totalEligibleVolume * emp.commissionRate) / 100;

      return {
        ...emp,
        hasPassword: !!emp.password,
        hasPendingInvite: !!emp.inviteToken && (!emp.inviteExpiresAt || new Date() < new Date(emp.inviteExpiresAt)),
        stats: {
          totalWashes,
          washVolume,
          totalOS,
          osServicesVolume,
          estimatedCommission,
        },
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
    const body = await req.json();
    const { name, role, accessLevel, email, phone, commissionRate, tenantId } = body;

    if (!name || !role) {
      return NextResponse.json(
        { error: "Nome e Cargo são obrigatórios" },
        { status: 400 }
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Informe um e-mail válido para enviar o convite de criação de senha do funcionário." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Verifica se já existe um funcionário com este e-mail
    const existing = await prisma.employee.findFirst({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Já existe um membro da equipe cadastrado com este e-mail." },
        { status: 400 }
      );
    }

    // Busca dados da oficina
    let tenant: any = null;
    if (tenantId) {
      tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    } else {
      tenant = await prisma.tenant.findFirst();
    }

    // Gera token de convite com validade de 48 horas
    const inviteToken = crypto.randomBytes(24).toString("hex");
    const inviteExpiresAt = new Date();
    inviteExpiresAt.setHours(inviteExpiresAt.getHours() + 48);

    const employee = await prisma.employee.create({
      data: {
        tenantId: tenant?.id || null,
        name: name.trim(),
        role: role.trim(),
        accessLevel: accessLevel || "MECANICO",
        email: cleanEmail,
        phone: phone ? phone.trim() : null,
        commissionRate: Number(commissionRate) || 0,
        inviteToken,
        inviteExpiresAt,
        active: true,
      },
    });

    // Constrói o link de convite
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const inviteLink = `${protocol}://${host}/convite?token=${inviteToken}`;

    // Dispara e-mail de convite via Brevo REST API v3
    await sendEmployeeInviteEmail({
      employeeName: employee.name,
      employeeEmail: cleanEmail,
      role: employee.role,
      workshopName: tenant?.name || "Torque ERP",
      ownerName: tenant?.ownerName || "Administração",
      inviteLink,
    }).catch((err) => console.error("Erro ao enviar e-mail de convite:", err));

    return NextResponse.json(
      {
        success: true,
        employee,
        message: `Convite enviado com sucesso para ${cleanEmail}! O funcionário receberá um link para criar sua senha de acesso.`,
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
    const body = await req.json();
    const { id, name, role, accessLevel, email, phone, commissionRate, active } = body;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        name,
        role,
        accessLevel: accessLevel !== undefined ? accessLevel : undefined,
        email: email !== undefined ? email : undefined,
        phone: phone !== undefined ? phone : undefined,
        commissionRate: commissionRate !== undefined ? Number(commissionRate) : undefined,
        active: active !== undefined ? active : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao atualizar funcionário" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    await prisma.employee.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao remover funcionário" }, { status: 500 });
  }
}
