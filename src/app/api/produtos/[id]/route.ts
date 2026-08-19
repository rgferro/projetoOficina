import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await getTenantContext(request);
    const product = await prisma.product.findFirst({
      where: { id: params.id, tenantId },
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
    const { tenantId } = await getTenantContext(request);
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
    } = body;

    const existing = await prisma.product.findFirst({
      where: { id: params.id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Produto não encontrado nesta oficina" }, { status: 404 });
    }

    const updated = await prisma.product.update({
      where: { id: params.id },
      data: {
        name,
        sku: sku || null,
        barcode: barcode || null,
        brand: brand || null,
        category: category || "Peças Gerais",
        unit: unit || "UN",
        costPrice: Number(costPrice) || 0,
        profitMargin: Number(profitMargin) || 0,
        salePrice: Number(salePrice) || 0,
        currentStock: Number(currentStock) || 0,
        minStock: Number(minStock) || 2,
        shelfLocation: shelfLocation || null,
        supplierId: supplierId || null,
        notes: notes || null,
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
    const { tenantId } = await getTenantContext(request);
    const existing = await prisma.product.findFirst({
      where: { id: params.id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Produto não encontrado nesta oficina" }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao excluir produto" }, { status: 500 });
  }
}
