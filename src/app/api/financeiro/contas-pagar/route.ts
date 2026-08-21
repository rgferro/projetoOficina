export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export async function GET(request: Request) {
  try {
    const { tenantId } = await getTenantContext(request);
    const payables = await prisma.accountPayable.findMany({
      where: { tenantId },
      include: { supplier: true },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json(payables);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar contas a pagar" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { tenantId } = await getTenantContext(request);
    const body = await request.json();
    const { description, category, amount, dueDate, paymentMethod, status, supplierId, notes } = body;

    if (!description || !amount || !dueDate) {
      return NextResponse.json({ error: "Descrição, Valor e Vencimento são obrigatórios" }, { status: 400 });
    }

    const payable = await prisma.accountPayable.create({
      data: {
        tenantId,
        description,
        category: category || "PEÇAS",
        amount: Number(amount),
        dueDate: new Date(dueDate),
        paymentMethod: paymentMethod || null,
        status: status || "PENDENTE",
        supplierId: supplierId || null,
        notes: notes || null,
      },
      include: { supplier: true },
    });

    return NextResponse.json(payable, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao criar conta a pagar" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { tenantId } = await getTenantContext(request);
    const body = await request.json();
    const { id, description, category, amount, dueDate, paymentDate, paymentMethod, status, supplierId, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const existing = await prisma.accountPayable.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Conta não encontrada nesta oficina" }, { status: 404 });
    }

    const updated = await prisma.accountPayable.update({
      where: { id },
      data: {
        description,
        category,
        amount: amount !== undefined ? Number(amount) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        paymentMethod,
        status,
        supplierId: supplierId || null,
        notes,
      },
      include: { supplier: true },
    });

    // Se foi marcada como PAGO, registra despesa no financeiro
    if (status === "PAGO" && existing.status !== "PAGO") {
      await prisma.financialTransaction.create({
        data: {
          tenantId,
          description: `Pagamento de Conta: ${updated.description}`,
          type: "DESPESA",
          category: updated.category,
          amount: updated.amount,
          paymentMethod: updated.paymentMethod || "PIX",
          date: paymentDate ? new Date(paymentDate) : new Date(),
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao atualizar conta a pagar" }, { status: 500 });
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

    const existing = await prisma.accountPayable.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Conta não encontrada nesta oficina" }, { status: 404 });
    }

    await prisma.accountPayable.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao excluir conta a pagar" }, { status: 500 });
  }
}
