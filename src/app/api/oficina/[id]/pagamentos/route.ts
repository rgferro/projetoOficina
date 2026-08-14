import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { amount, paymentMethod, notes, date } = body;

    const numAmount = Number(amount) || 0;
    if (numAmount <= 0) {
      return NextResponse.json({ error: "Valor do pagamento deve ser maior que zero" }, { status: 400 });
    }

    const order = await prisma.serviceOrder.findUnique({
      where: { id: params.id },
      include: { payments: true, vehicle: true },
    });

    if (!order) {
      return NextResponse.json({ error: "OS não encontrada" }, { status: 404 });
    }

    // 1. Cria o registro de pagamento
    const payment = await prisma.serviceOrderPayment.create({
      data: {
        serviceOrderId: params.id,
        amount: numAmount,
        paymentMethod: paymentMethod || "PIX",
        notes: notes || null,
        date: date ? new Date(date) : new Date(),
      },
    });

    // 2. Recalcula totais pagos
    const newPaidAmount = order.paidAmount + numAmount;
    const newRemaining = Math.max(0, order.grandTotal - newPaidAmount);
    const newPaymentStatus = newRemaining <= 0.01 ? "PAGO" : "PARCIAL";

    const updatedOrder = await prisma.serviceOrder.update({
      where: { id: params.id },
      data: {
        paidAmount: newPaidAmount,
        remainingBalance: newRemaining,
        paymentStatus: newPaymentStatus,
      },
      include: {
        payments: true,
        items: true,
      },
    });

    // 3. Registra receita no caixa financeiro
    await prisma.financialTransaction.create({
      data: {
        description: `Pagamento Parcial OS #${order.osNumber} - ${order.vehicle.model} (${order.vehicle.plate})`,
        type: "RECEITA",
        category: "ORDEM_SERVICO",
        amount: numAmount,
        paymentMethod: paymentMethod || "PIX",
        serviceOrderId: order.id,
        date: new Date(),
      },
    });

    return NextResponse.json({ payment, order: updatedOrder }, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao registrar pagamento na OS:", error);
    return NextResponse.json({ error: error.message || "Erro no pagamento" }, { status: 500 });
  }
}
