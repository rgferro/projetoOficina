import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { tenantId } = await getTenantContext(req);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 1. Lava-Jato hoje
    const activeWashTickets = await prisma.washTicket.findMany({
      where: {
        tenantId,
        status: { in: ["AGUARDANDO", "EM_LAVAGEM", "FINALIZADO"] },
      },
      include: {
        vehicle: { include: { customer: true } },
        employee: true,
      },
      orderBy: { enteredAt: "asc" },
    });

    // 2. Ordens de Servi�o ativas
    const activeServiceOrders = await prisma.serviceOrder.findMany({
      where: {
        tenantId,
        status: { in: ["ORCAMENTO", "APROVADO", "EM_EXECUCAO", "AGUARDANDO_PECA"] },
      },
      include: {
        customer: true,
        vehicle: true,
        employee: true,
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    });

    // 3. Faturamento hoje
    const todayTransactions = await prisma.financialTransaction.findMany({
      where: {
        tenantId,
        date: { gte: todayStart },
      },
    });

    // 4. Configura��es da oficina
    const settings = await prisma.workshopSetting.findUnique({
      where: { tenantId },
    });

    // 5. Totalizadores
    const totalCustomers = await prisma.customer.count({
      where: { tenantId },
    });
    const totalVehicles = await prisma.vehicle.count({
      where: { tenantId },
    });

    const waitingCount = activeWashTickets.filter((t) => t.status === "AGUARDANDO").length;
    const inProgressCount = activeWashTickets.filter((t) => t.status === "EM_LAVAGEM").length;
    const readyCount = activeWashTickets.filter((t) => t.status === "FINALIZADO").length;

    const todayIncome = todayTransactions
      .filter((t) => t.type === "RECEITA")
      .reduce((sum, t) => sum + t.amount, 0);

    const todayExpense = todayTransactions
      .filter((t) => t.type === "DESPESA")
      .reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json(
      {
        success: true,
        data: {
          workshopName: settings?.workshopName || "Oficina & Lava-Jato",
          activeWashTicketsCount: activeWashTickets.length,
          waitingCount,
          inProgressCount,
          readyCount,
          activeServiceOrdersCount: activeServiceOrders.length,
          todayIncome,
          todayExpense,
          totalCustomers,
          totalVehicles,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (err: any) {
    console.error("Erro na API do Dashboard:", err);
    return NextResponse.json(
      { success: false, error: "Erro ao carregar dados do Dashboard" },
      { status: 500 }
    );
  }
}
