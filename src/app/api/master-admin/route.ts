import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        payments: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: "desc" },
    });

    const payments = await prisma.subscriptionPayment.findMany({
      include: { tenant: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const contactMessages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Métricas Globais de Uso do SaaS
    const totalServiceOrders = await prisma.serviceOrder.count();
    const totalWashTickets = await prisma.washTicket.count();
    const totalSales = await prisma.sale.count();
    const totalCustomers = await prisma.customer.count();
    const totalVehicles = await prisma.vehicle.count();

    const approvedPayments = payments.filter((p) => p.status === "approved");
    const totalRevenue = approvedPayments.reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      success: true,
      stats: {
        totalTenants: tenants.length,
        activeTenants: tenants.filter((t) => t.subscriptionStatus === "active").length,
        totalEmployees: employees.length,
        totalServiceOrders,
        totalWashTickets,
        totalSales,
        totalCustomers,
        totalVehicles,
        totalRevenue,
      },
      tenants,
      employees,
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
    const { action, tenantId, newPlan, newMaxUsers, addDays } = body;

    if (action === "UPDATE_PLAN" && tenantId) {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          plan: newPlan,
          maxUsers: Number(newMaxUsers) || (newPlan === "ELITE" ? 10 : newPlan === "PRO" ? 4 : 1),
        },
      });
      return NextResponse.json({ success: true, message: "Plano atualizado com sucesso!" });
    }

    if ((action === "EXTEND_DAYS" || action === "ADD_DAYS") && tenantId && addDays) {
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      const currentExpiry = tenant?.subscriptionExpiresAt ? new Date(tenant.subscriptionExpiresAt) : new Date();
      currentExpiry.setDate(currentExpiry.getDate() + Number(addDays));

      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          subscriptionExpiresAt: currentExpiry,
          subscriptionStatus: "active",
        },
      });
      return NextResponse.json({ success: true, message: `Assinatura estendida em +${addDays} dias!` });
    }

    if ((action === "TOGGLE_STATUS" || action === "SET_STATUS") && tenantId) {
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      const newStatus = body.newStatus || (tenant?.subscriptionStatus === "active" ? "suspended" : "active");

      await prisma.tenant.update({
        where: { id: tenantId },
        data: { subscriptionStatus: newStatus },
      });
      return NextResponse.json({ success: true, message: `Status alterado para ${newStatus}!` });
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
