export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const planFilter = searchParams.get("plan") || "ALL";
    const statusFilter = searchParams.get("status") || "ALL";

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { ownerName: { contains: search } },
        { ownerEmail: { contains: search } },
        { document: { contains: search } },
      ];
    }
    if (planFilter !== "ALL") {
      where.plan = planFilter;
    }
    if (statusFilter === "active") {
      where.active = true;
      where.subscriptionStatus = "active";
    } else if (statusFilter === "inactive") {
      where.OR = [{ active: false }, { subscriptionStatus: { not: "active" } }];
    }

    const allTenants = await prisma.tenant.findMany({
      include: {
        employees: true,
        customers: true,
        serviceOrders: true,
        washTickets: true,
        payments: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const filteredTenants = allTenants.filter((t) => {
      if (search) {
        const s = search.toLowerCase();
        const matches =
          (t.name || "").toLowerCase().includes(s) ||
          (t.ownerName || "").toLowerCase().includes(s) ||
          (t.ownerEmail || "").toLowerCase().includes(s) ||
          (t.document || "").toLowerCase().includes(s);
        if (!matches) return false;
      }
      if (planFilter !== "ALL" && t.plan !== planFilter) return false;
      if (statusFilter === "active" && (!t.active || t.subscriptionStatus !== "active")) return false;
      if (statusFilter === "inactive" && t.active && t.subscriptionStatus === "active") return false;
      return true;
    });

    const payments = await prisma.subscriptionPayment.findMany({
      include: { tenant: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const contactMessages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    // Métricas Globais de Uso do SaaS
    const totalServiceOrders = await prisma.serviceOrder.count();
    const totalWashTickets = await prisma.washTicket.count();
    const totalSales = await prisma.sale.count();
    const totalCustomers = await prisma.customer.count();
    const totalVehicles = await prisma.vehicle.count();
    const totalEmployees = await prisma.employee.count();

    // Cálculo do MRR e ARR
    let mrr = 0;
    allTenants.forEach((t) => {
      if (t.active && t.subscriptionStatus === "active") {
        if (t.plan === "PRO") mrr += 69.9;
        else if (t.plan === "ELITE") mrr += 129.9;
      }
    });
    const arr = mrr * 12;

    const approvedPayments = payments.filter((p) => p.status === "approved");
    const totalRevenue = approvedPayments.reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      success: true,
      stats: {
        totalTenants: allTenants.length,
        activeTenants: allTenants.filter((t) => t.active && t.subscriptionStatus === "active").length,
        pastDueTenants: allTenants.filter((t) => !t.active || t.subscriptionStatus !== "active").length,
        mrr: Number(mrr.toFixed(2)),
        arr: Number(arr.toFixed(2)),
        totalEmployees,
        totalServiceOrders,
        totalWashTickets,
        totalSales,
        totalCustomers,
        totalVehicles,
        totalRevenue,
      },
      tenants: filteredTenants.map((t) => ({
        id: t.id,
        name: t.name,
        document: t.document,
        plan: t.plan,
        subscriptionStatus: t.subscriptionStatus,
        subscriptionExpiresAt: t.subscriptionExpiresAt,
        maxUsers: t.maxUsers,
        ownerEmail: t.ownerEmail,
        ownerName: t.ownerName,
        ownerPhone: t.ownerPhone,
        city: t.city,
        state: t.state,
        active: t.active,
        isMaster: t.isMaster,
        createdAt: t.createdAt,
        currentUsers: t.employees.length,
        totalCustomers: t.customers.length,
        totalServiceOrders: t.serviceOrders.length,
        totalWashTickets: t.washTickets.length,
      })),
      payments,
      contactMessages,
    });
  } catch (error: any) {
    console.error("Erro na API do Master Admin:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro no painel administrativo" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, tenantId, newPlan, newMaxUsers, addDays, newStatus } = body;

    // 1. Atualizar Plano e Limite de Usuários da Oficina
    if (action === "UPDATE_PLAN" && tenantId) {
      const defaultUsers = newPlan === "ELITE" ? 10 : newPlan === "PRO" ? 4 : 1;
      const finalMaxUsers = newMaxUsers ? Number(newMaxUsers) : defaultUsers;

      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          plan: newPlan,
          maxUsers: finalMaxUsers,
          subscriptionStatus: newStatus || undefined,
        },
      });
      return NextResponse.json({ success: true, message: `Plano atualizado para ${newPlan} com sucesso!` });
    }

    // 2. Estender Dias de Validade
    if ((action === "EXTEND_DAYS" || action === "ADD_DAYS") && tenantId && addDays) {
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant) return NextResponse.json({ success: false, error: "Oficina não encontrada" }, { status: 404 });

      const currentExpiry = tenant.subscriptionExpiresAt ? new Date(tenant.subscriptionExpiresAt) : new Date();
      const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
      baseDate.setDate(baseDate.getDate() + Number(addDays));

      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          subscriptionExpiresAt: baseDate,
          subscriptionStatus: "active",
          active: true,
        },
      });
      return NextResponse.json({ success: true, message: `Assinatura estendida em +${addDays} dias com sucesso!` });
    }

    // 3. Alternar Isenção de Pagamentos (Cortesia VIP / Vitalícia)
    if (action === "TOGGLE_EXEMPT" && tenantId) {
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant) return NextResponse.json({ success: false, error: "Oficina não encontrada" }, { status: 404 });

      const isExempt = tenant.subscriptionStatus === "exempt";
      const newSubStatus = isExempt ? "active" : "exempt";
      const newExpiry = isExempt
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : new Date("2099-12-31T23:59:59.000Z");

      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          subscriptionStatus: newSubStatus,
          subscriptionExpiresAt: newExpiry,
          active: true,
        },
      });
      return NextResponse.json({
        success: true,
        message: isExempt
          ? `Cobrança reativada para a oficina "${tenant.name}".`
          : `Oficina "${tenant.name}" isenta de pagamentos com sucesso (Cortesia Master)!`,
      });
    }

    // 4. Alternar Bloqueio / Ativação da Oficina
    if ((action === "TOGGLE_STATUS" || action === "SET_STATUS") && tenantId) {
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant) return NextResponse.json({ success: false, error: "Oficina não encontrada" }, { status: 404 });

      const nextActive = newStatus ? newStatus === "active" : !tenant.active;
      const nextSubStatus = nextActive ? "active" : "suspended";

      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          active: nextActive,
          subscriptionStatus: nextSubStatus,
        },
      });
      return NextResponse.json({
        success: true,
        message: nextActive ? "Oficina desbloqueada e ativa no sistema." : "Oficina bloqueada com sucesso.",
      });
    }

    // 5. Impersonate (Acesso Temporário de Suporte)
    if (action === "IMPERSONATE" && tenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { employees: true },
      });
      if (!tenant) return NextResponse.json({ success: false, error: "Oficina não encontrada" }, { status: 404 });

      let adminEmployee = tenant.employees.find((e) => e.accessLevel === "ADMIN") || tenant.employees[0];
      if (!adminEmployee) {
        adminEmployee = await prisma.employee.create({
          data: {
            tenantId: tenant.id,
            name: `[Suporte] ${tenant.ownerName}`,
            email: tenant.ownerEmail,
            role: "Administrador da Oficina",
            accessLevel: "ADMIN",
            pinCode: "1234",
            active: true,
          },
        });
      }

      const { createSessionToken } = await import("@/lib/auth");
      const token = createSessionToken({
        userId: adminEmployee.id,
        tenantId: tenant.id,
        name: `[Suporte] ${tenant.ownerName}`,
        email: tenant.ownerEmail,
        role: "Administrador da Oficina",
        accessLevel: "ADMIN",
        isMaster: true,
        workshopName: tenant.name,
        plan: tenant.plan,
        isOwner: true,
      });

      const response = NextResponse.json({
        success: true,
        token,
        user: {
          id: adminEmployee.id,
          name: `[Suporte] ${tenant.ownerName}`,
          email: tenant.ownerEmail,
          role: "Administrador da Oficina",
          accessLevel: "ADMIN",
          isMaster: true,
          workshopName: tenant.name,
          plan: tenant.plan,
          isOwner: true,
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

    return NextResponse.json({ success: false, error: "Ação inválida" }, { status: 400 });
  } catch (error: any) {
    console.error("Erro na ação do Master Admin:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao executar ação administrativa" },
      { status: 500 }
    );
  }
}
