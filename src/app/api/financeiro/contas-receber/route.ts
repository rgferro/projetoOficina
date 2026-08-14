import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status && status !== "TODAS") {
      where.status = status;
    }

    const receivables = await prisma.accountReceivable.findMany({
      where,
      include: {
        customer: true,
        serviceOrder: true,
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json(receivables);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar contas a receber" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { description, amount, dueDate, customerId, serviceOrderId, notes } = body;

    if (!description || !amount || !dueDate) {
      return NextResponse.json({ error: "Descrição, Valor e Vencimento são obrigatórios" }, { status: 400 });
    }

    const rec = await prisma.accountReceivable.create({
      data: {
        description,
        amount: Number(amount),
        dueDate: new Date(dueDate),
        customerId: customerId || null,
        serviceOrderId: serviceOrderId || null,
        notes: notes || null,
        status: "PENDENTE",
      },
      include: { customer: true, serviceOrder: true },
    });

    return NextResponse.json(rec, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao cadastrar conta a receber" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, paymentMethod, receivedDate, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const current = await prisma.accountReceivable.findUnique({
      where: { id },
    });

    if (!current) {
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });
    }

    const isReceivingNow = status === "PAGO" && current.status !== "PAGO";

    const updated = await prisma.accountReceivable.update({
      where: { id },
      data: {
        status: status || current.status,
        paymentMethod: paymentMethod || current.paymentMethod,
        receivedDate: status === "PAGO" ? new Date(receivedDate || Date.now()) : current.receivedDate,
        notes: notes !== undefined ? notes : current.notes,
      },
      include: { customer: true, serviceOrder: true },
    });

    if (isReceivingNow) {
      await prisma.financialTransaction.create({
        data: {
          description: `Recebimento: ${current.description}`,
          type: "RECEITA",
          category: "ORDEM_SERVICO",
          amount: current.amount,
          paymentMethod: paymentMethod || "PIX",
          serviceOrderId: current.serviceOrderId,
          date: new Date(),
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao atualizar recebimento" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    await prisma.accountReceivable.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao excluir" }, { status: 500 });
  }
}
