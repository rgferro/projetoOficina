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
        items: {
          include: { product: true, employee: true },
        },
        photos: true,
        payments: {
          orderBy: { date: "desc" },
        },
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
      defectClaimed,
      defectFound,
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
        productId: item.productId || null,
        employeeId: item.employeeId || null,
        commissionRate: Number(item.commissionRate) || 0,
      };
    });

    const parsedDiscount = Number(discount) || 0;
    const grandTotal = Math.max(0, totalParts + totalServices - parsedDiscount);

    const current = await prisma.serviceOrder.findUnique({
      where: { id: params.id },
      include: { items: true },
    });

    if (!current) {
      return NextResponse.json({ error: "OS não encontrada" }, { status: 404 });
    }

    // Atualiza itens da OS
    await prisma.serviceOrderItem.deleteMany({
      where: { serviceOrderId: params.id },
    });

    let completedAt = current.completedAt;
    if (status === "CONCLUIDO" && !completedAt) {
      completedAt = new Date();
    }

    let paidAmount = current.paidAmount;
    let remainingBalance = Math.max(0, grandTotal - paidAmount);
    let paymentStatus = current.paymentStatus;

    // Se marcou como quitado total agora
    if (markAsPaid && paymentMethod) {
      const balanceToPay = remainingBalance > 0 ? remainingBalance : grandTotal;
      paidAmount = grandTotal;
      remainingBalance = 0;
      paymentStatus = "PAGO";

      await prisma.serviceOrderPayment.create({
        data: {
          serviceOrderId: current.id,
          amount: balanceToPay,
          paymentMethod: paymentMethod,
          notes: "Quitação total de saldo da OS",
          date: new Date(),
        },
      });

      await prisma.financialTransaction.create({
        data: {
          description: `Quitação OS #${current.osNumber} - ${paymentMethod}`,
          type: "RECEITA",
          category: "ORDEM_SERVICO",
          amount: balanceToPay,
          paymentMethod: paymentMethod,
          serviceOrderId: current.id,
          date: new Date(),
        },
      });
    }

    // Se entrou em execução, deduz peças do estoque
    if ((status === "EM_EXECUCAO" || status === "APROVADO") && current.status === "ORCAMENTO") {
      for (const item of formattedItems) {
        if (item.productId) {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
          });
          if (product) {
            const newStock = Math.max(0, product.currentStock - item.quantity);
            await prisma.product.update({
              where: { id: item.productId },
              data: { currentStock: newStock },
            });
            await prisma.stockMovement.create({
              data: {
                productId: item.productId,
                type: "ORDEM_SERVICO",
                quantity: item.quantity,
                unitCost: product.costPrice,
                description: `Aplicação na OS #${current.osNumber}`,
              },
            });
          }
        }
      }
    }

    const updated = await prisma.serviceOrder.update({
      where: { id: params.id },
      data: {
        status: status || current.status,
        entryKm: entryKm ? Number(entryKm) : current.entryKm,
        defectClaimed: defectClaimed !== undefined ? defectClaimed : current.defectClaimed,
        defectFound: defectFound !== undefined ? defectFound : current.defectFound,
        problemDescription: problemDescription ?? current.problemDescription,
        technicalReport: technicalReport ?? current.technicalReport,
        internalNotes: internalNotes ?? current.internalNotes,
        discount: parsedDiscount,
        totalParts,
        totalServices,
        grandTotal,
        paidAmount,
        remainingBalance,
        paymentStatus,
        paymentMethod: paymentMethod || current.paymentMethod,
        employeeId: employeeId !== undefined ? employeeId : current.employeeId,
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : current.estimatedDelivery,
        completedAt,
        items: {
          create: formattedItems,
        },
      },
      include: {
        customer: true,
        vehicle: true,
        employee: true,
        items: { include: { product: true, employee: true } },
        photos: true,
        payments: true,
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
