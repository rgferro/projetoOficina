import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        stockMovements: {
          orderBy: { date: "desc" },
          take: 20,
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar produto" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      name,
      sku,
      barcode,
      brand,
      category,
      unit,
      costPrice,
      profitMargin,
      salePrice,
      currentStock,
      minStock,
      shelfLocation,
      supplierId,
      notes,
      stockAdjustmentReason,
    } = body;

    const current = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!current) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    const newStock = currentStock !== undefined ? Number(currentStock) : current.currentStock;
    const stockDiff = newStock - current.currentStock;

    // Se houve ajuste manual de estoque, registra movimentação
    if (stockDiff !== 0) {
      await prisma.stockMovement.create({
        data: {
          productId: params.id,
          type: stockDiff > 0 ? "ENTRADA" : "AJUSTE",
          quantity: Math.abs(stockDiff),
          unitCost: Number(costPrice) || current.costPrice,
          description: stockAdjustmentReason || "Ajuste manual de estoque",
        },
      });
    }

    const updated = await prisma.product.update({
      where: { id: params.id },
      data: {
        name: name ?? current.name,
        sku: sku !== undefined ? sku || null : current.sku,
        barcode: barcode !== undefined ? barcode || null : current.barcode,
        brand: brand !== undefined ? brand || null : current.brand,
        category: category ?? current.category,
        unit: unit ?? current.unit,
        costPrice: costPrice !== undefined ? Number(costPrice) : current.costPrice,
        profitMargin: profitMargin !== undefined ? Number(profitMargin) : current.profitMargin,
        salePrice: salePrice !== undefined ? Number(salePrice) : current.salePrice,
        currentStock: newStock,
        minStock: minStock !== undefined ? Number(minStock) : current.minStock,
        shelfLocation: shelfLocation !== undefined ? shelfLocation || null : current.shelfLocation,
        supplierId: supplierId !== undefined ? supplierId || null : current.supplierId,
        notes: notes !== undefined ? notes || null : current.notes,
      },
      include: {
        supplier: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao atualizar produto" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.product.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao excluir produto" }, { status: 500 });
  }
}
