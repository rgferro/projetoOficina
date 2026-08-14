import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const order = await prisma.serviceOrder.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        vehicle: true,
        employee: true,
        items: true,
        transactions: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Ordem de Serviço não encontrada" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar OS" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      status,
      entryKm,
      problemDescription,
      technicalReport,
      internalNotes,
      discount,
      employeeId,
      estimatedDelivery,
      items,
      paymentMethod,
      markAsPaid,
    } = body;

    let totalParts = 0;
    let totalServices = 0;

    const formattedItems = (items || []).map((item: any) => {
      const qty = Number(item.quantity) || 1;
      const unit = Number(item.unitPrice) || 0;
      const total = qty * unit;

      if (item.type === "PECA") {
        totalParts += total;
      } else {
        totalServices += total;
      }

      return {
        type: item.type || "SERVICO",
        name: item.name,
        quantity: qty,
        unitPrice: unit,
        totalPrice: total,
      };
    });

    const parsedDiscount = Number(discount) || 0;
    const grandTotal = Math.max(0, totalParts + totalServices - parsedDiscount);

    // Remove itens antigos e recria
    await prisma.serviceOrderItem.deleteMany({
      where: { serviceOrderId: params.id },
    });

    const current = await prisma.serviceOrder.findUnique({
      where: { id: params.id },
      include: { vehicle: true },
    });

    let completedAt = current?.completedAt;
    if (status === "CONCLUIDO" && !completedAt) {
      completedAt = new Date();
    }

    // Se marcou como pago agora
    if (markAsPaid && paymentMethod && current) {
      await prisma.financialTransaction.create({
        data: {
          description: `Recebimento OS #${current.osNumber} - ${current.vehicle.model} (${current.vehicle.plate})`,
          type: "RECEITA",
          category: "ORDEM_SERVICO",
          amount: grandTotal,
          paymentMethod: paymentMethod,
          serviceOrderId: current.id,
          date: new Date(),
        },
      });
    }

    const updated = await prisma.serviceOrder.update({
      where: { id: params.id },
      data: {
        status: status || current?.status,
        entryKm: entryKm ? Number(entryKm) : current?.entryKm,
        problemDescription: problemDescription ?? current?.problemDescription,
        technicalReport: technicalReport ?? current?.technicalReport,
        internalNotes: internalNotes ?? current?.internalNotes,
        discount: parsedDiscount,
        totalParts,
        totalServices,
        grandTotal,
        employeeId: employeeId !== undefined ? employeeId : current?.employeeId,
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : current?.estimatedDelivery,
        completedAt,
        paymentMethod: paymentMethod || current?.paymentMethod,
        paymentStatus: markAsPaid ? "PAGO" : current?.paymentStatus,
        items: {
          create: formattedItems,
        },
      },
      include: {
        customer: true,
        vehicle: true,
        employee: true,
        items: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Erro ao atualizar OS:", error);
    return NextResponse.json({ error: error.message || "Erro ao atualizar OS" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.serviceOrder.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao excluir OS" }, { status: 500 });
  }
}
