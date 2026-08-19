import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export async function GET(request: Request) {
  try {
    const { tenantId } = await getTenantContext(request);
    const sales = await prisma.sale.findMany({
      where: { tenantId },
      include: {
        customer: true,
        employee: true,
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(sales);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar vendas do PDV" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { tenantId } = await getTenantContext(request);
    const body = await request.json();
    const {
      customerId,
      employeeId,
      items,
      discount,
      paymentMethod,
      paidAmount,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "O carrinho do PDV não pode estar vazio" }, { status: 400 });
    }

    let subtotal = 0;
    const formattedItems = [];

    for (const item of items) {
      const qty = Number(item.quantity) || 1;
      const unitPrice = Number(item.unitPrice) || 0;
      const total = qty * unitPrice;
      subtotal += total;

      formattedItems.push({
        productId: item.productId || null,
        name: item.name || "Produto",
        quantity: qty,
        unitPrice,
        totalPrice: total,
      });
    }

    const discountValue = Number(discount) || 0;
    const grandTotal = Math.max(0, subtotal - discountValue);
    const paid = Number(paidAmount) || grandTotal;
    const change = Math.max(0, paid - grandTotal);

    const lastSale = await prisma.sale.findFirst({
      where: { tenantId },
      orderBy: { saleNumber: "desc" },
    });
    const saleNumber = lastSale ? lastSale.saleNumber + 1 : 1001;

    const sale = await prisma.sale.create({
      data: {
        tenantId,
        saleNumber,
        customerId: customerId || null,
        employeeId: employeeId || null,
        totalAmount: subtotal,
        discount: discountValue,
        grandTotal,
        paymentMethod: paymentMethod || "DINHEIRO",
        paidAmount: paid,
        changeAmount: change,
        status: "CONCLUIDA",
        date: new Date(),
        items: {
          create: formattedItems,
        },
      },
      include: {
        customer: true,
        employee: true,
        items: true,
      },
    });

    for (const item of items) {
      if (item.productId) {
        const product = await prisma.product.findFirst({
          where: { id: item.productId, tenantId },
        });

        if (product) {
          const newStock = Math.max(0, product.currentStock - Number(item.quantity));
          await prisma.product.update({
            where: { id: item.productId },
            data: { currentStock: newStock },
          });

          await prisma.stockMovement.create({
            data: {
              tenantId,
              productId: item.productId,
              type: "VENDA_PDV",
              quantity: Number(item.quantity),
              unitCost: product.costPrice,
              description: `Venda PDV Balcão #${sale.saleNumber}`,
            },
          });
        }
      }
    }

    await prisma.financialTransaction.create({
      data: {
        tenantId,
        description: `Venda PDV Balcão #${sale.saleNumber}`,
        type: "RECEITA",
        category: "PDV_BALCAO",
        amount: grandTotal,
        paymentMethod: paymentMethod || "DINHEIRO",
        saleId: sale.id,
        date: new Date(),
      },
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error: any) {
    console.error("Erro no PDV:", error);
    return NextResponse.json({ error: error.message || "Falha ao finalizar venda PDV" }, { status: 500 });
  }
}
