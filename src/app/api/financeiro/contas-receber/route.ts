export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export async function GET(request: Request) {
  try {
    const { tenantId } = await getTenantContext(request);
    const receivables = await prisma.accountReceivable.findMany({
      where: { tenantId },
      include: { customer: true, serviceOrder: true },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json(receivables);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar contas a receber" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { tenantId } = await getTenantContext(request);
    const body = await request.json();
    const { description, amount, dueDate, paymentMethod, status, customerId, serviceOrderId, notes } = body;

    if (!description || !amount || !dueDate) {
      return NextResponse.json({ error: "Descrição, Valor e Vencimento são obrigatórios" }, { status: 400 });
    }

    const receivable = await prisma.accountReceivable.create({
      data: {
        tenantId,
        description,
        amount: Number(amount),
        dueDate: new Date(dueDate),
        paymentMethod: paymentMethod || null,
        status: status || "PENDENTE",
        customerId: customerId || null,
        serviceOrderId: serviceOrderId || null,
        notes: notes || null,
      },
      include: { customer: true, serviceOrder: true },
    });

    return NextResponse.json(receivable, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao criar conta a receber" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { tenantId } = await getTenantContext(request);
    const body = await request.json();
    const { id, description, amount, dueDate, receivedDate, paymentMethod, status, customerId, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const existing = await prisma.accountReceivable.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Conta não encontrada nesta oficina" }, { status: 404 });
    }

    const updated = await prisma.accountReceivable.update({
      where: { id },
      data: {
        description,
        amount: amount !== undefined ? Number(amount) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        receivedDate: receivedDate ? new Date(receivedDate) : null,
        paymentMethod,
        status,
        customerId: customerId || null,
        notes,
      },
      include: { customer: true, serviceOrder: true },
    });

    if (status === "PAGO" && existing.status !== "PAGO") {
      await prisma.financialTransaction.create({
        data: {
          tenantId,
          description: `Recebimento de Conta: ${updated.description}`,
          type: "RECEITA",
          category: "OUTROS",
          amount: updated.amount,
          paymentMethod: updated.paymentMethod || "PIX",
          date: receivedDate ? new Date(receivedDate) : new Date(),
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao atualizar conta a receber" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { tenantId } = await getTenantContext(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const existing = await prisma.accountReceivable.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Conta não encontrada nesta oficina" }, { status: 404 });
    }

    await prisma.accountReceivable.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao excluir conta a receber" }, { status: 500 });
  }
}
