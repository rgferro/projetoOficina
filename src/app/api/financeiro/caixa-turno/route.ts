import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export async function GET(request: Request) {
  try {
    const { tenantId } = await getTenantContext(request);
    const activeShift = await prisma.cashShift.findFirst({
      where: { tenantId, status: "ABERTO" },
      include: { employee: true },
      orderBy: { openedAt: "desc" },
    });

    return NextResponse.json(activeShift || { status: "FECHADO" });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar turno de caixa" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { tenantId } = await getTenantContext(request);
    const body = await request.json();
    const { action, initialBalance, employeeId, amount, reason, finalBalance, notes } = body;

    if (action === "ABRIR") {
      const existing = await prisma.cashShift.findFirst({
        where: { tenantId, status: "ABERTO" },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Já existe um turno de caixa aberto nesta oficina. Feche o atual antes de abrir outro." },
          { status: 400 }
        );
      }

      const shift = await prisma.cashShift.create({
        data: {
          tenantId,
          initialBalance: Number(initialBalance) || 0,
          status: "ABERTO",
          employeeId: employeeId || null,
          notes: notes || null,
          openedAt: new Date(),
        },
        include: { employee: true },
      });

      return NextResponse.json(shift, { status: 201 });
    }

    if (action === "SANGRIA" || action === "SUPRIMENTO") {
      const activeShift = await prisma.cashShift.findFirst({
        where: { tenantId, status: "ABERTO" },
      });

      if (!activeShift) {
        return NextResponse.json({ error: "Nenhum turno de caixa aberto no momento" }, { status: 400 });
      }

      const numAmount = Number(amount) || 0;

      await prisma.financialTransaction.create({
        data: {
          tenantId,
          description: `${action === "SANGRIA" ? "Sangria de Caixa" : "Suprimento de Caixa"}: ${reason || "Sem descrição"}`,
          type: action === "SANGRIA" ? "DESPESA" : "RECEITA",
          category: action,
          amount: numAmount,
          paymentMethod: "DINHEIRO",
          date: new Date(),
        },
      });

      const updatedShift = await prisma.cashShift.update({
        where: { id: activeShift.id },
        data: {
          totalSangrias:
            action === "SANGRIA"
              ? activeShift.totalSangrias + numAmount
              : activeShift.totalSangrias,
          totalSuprimentos:
            action === "SUPRIMENTO"
              ? activeShift.totalSuprimentos + numAmount
              : activeShift.totalSuprimentos,
        },
      });

      return NextResponse.json(updatedShift);
    }

    if (action === "FECHAR") {
      const activeShift = await prisma.cashShift.findFirst({
        where: { tenantId, status: "ABERTO" },
      });

      if (!activeShift) {
        return NextResponse.json({ error: "Nenhum turno de caixa aberto para fechar" }, { status: 400 });
      }

      const transactions = await prisma.financialTransaction.findMany({
        where: {
          tenantId,
          date: { gte: activeShift.openedAt },
          paymentMethod: "DINHEIRO",
        },
      });

      const cashIn = transactions
        .filter((t) => t.type === "RECEITA")
        .reduce((sum, t) => sum + t.amount, 0);

      const cashOut = transactions
        .filter((t) => t.type === "DESPESA")
        .reduce((sum, t) => sum + t.amount, 0);

      const expected = activeShift.initialBalance + cashIn - cashOut;
      const informed = Number(finalBalance) || 0;
      const difference = informed - expected;

      const closed = await prisma.cashShift.update({
        where: { id: activeShift.id },
        data: {
          status: "FECHADO",
          closedAt: new Date(),
          finalBalance: informed,
          expectedBalance: expected,
          difference,
          notes: notes || null,
        },
      });

      return NextResponse.json(closed);
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error: any) {
    console.error("Erro no turno de caixa:", error);
    return NextResponse.json({ error: error.message || "Erro no caixa" }, { status: 500 });
  }
}
