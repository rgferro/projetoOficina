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

    const bills = await prisma.accountPayable.findMany({
      where,
      include: {
        supplier: true,
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json(bills);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar contas a pagar" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { description, category, amount, dueDate, supplierId, notes } = body;

    if (!description || !amount || !dueDate) {
      return NextResponse.json({ error: "Descrição, Valor e Vencimento são obrigatórios" }, { status: 400 });
    }

    const bill = await prisma.accountPayable.create({
      data: {
        description,
        category: category || "PEÇAS",
        amount: Number(amount),
        dueDate: new Date(dueDate),
        supplierId: supplierId || null,
        notes: notes || null,
        status: "PENDENTE",
      },
      include: { supplier: true },
    });

    return NextResponse.json(bill, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao criar conta a pagar" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, paymentMethod, paymentDate, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const current = await prisma.accountPayable.findUnique({
      where: { id },
    });

    if (!current) {
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });
    }

    const isPayingNow = status === "PAGO" && current.status !== "PAGO";

    const updated = await prisma.accountPayable.update({
      where: { id },
      data: {
        status: status || current.status,
        paymentMethod: paymentMethod || current.paymentMethod,
        paymentDate: status === "PAGO" ? new Date(paymentDate || Date.now()) : current.paymentDate,
        notes: notes !== undefined ? notes : current.notes,
      },
      include: { supplier: true },
    });

    // Se marcou como pago, registra despesa financeira
    if (isPayingNow) {
      await prisma.financialTransaction.create({
        data: {
          description: `Pagamento: ${current.description}`,
          type: "DESPESA",
          category: current.category,
          amount: current.amount,
          paymentMethod: paymentMethod || "PIX",
          date: new Date(),
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao atualizar conta" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    await prisma.accountPayable.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao excluir conta" }, { status: 500 });
  }
}
