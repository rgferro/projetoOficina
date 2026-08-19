import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export async function GET(request: Request) {
  try {
    const { tenantId } = await getTenantContext(request);
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const lowStock = searchParams.get("lowStock") === "true";
    const category = searchParams.get("category");

    const where: any = { tenantId };

    if (q) {
      where.AND = [
        {
          OR: [
            { name: { contains: q } },
            { sku: { contains: q } },
            { barcode: { contains: q } },
            { brand: { contains: q } },
          ],
        },
      ];
    }

    if (category && category !== "TODAS") {
      where.category = category;
    }

    let products = await prisma.product.findMany({
      where,
      include: {
        supplier: true,
      },
      orderBy: { name: "asc" },
    });

    if (lowStock) {
      products = products.filter((p) => p.currentStock <= p.minStock);
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return NextResponse.json({ error: "Erro ao buscar produtos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    if (!name) {
      return NextResponse.json({ error: "Nome do produto é obrigatório" }, { status: 400 });
    }

    const cost = Number(costPrice) || 0;
    const margin = Number(profitMargin) || 0;
    const sale = Number(salePrice) || cost * (1 + margin / 100);
    const initialStock = Number(currentStock) || 0;

    const product = await prisma.product.create({
      data: {
        tenantId,
        name,
        sku: sku || null,
        barcode: barcode || null,
        brand: brand || null,
        category: category || "Peças Gerais",
        unit: unit || "UN",
        costPrice: cost,
        profitMargin: margin,
        salePrice: sale,
        currentStock: initialStock,
        minStock: Number(minStock) || 2,
        shelfLocation: shelfLocation || null,
        supplierId: supplierId || null,
        notes: notes || null,
        stockMovements: initialStock > 0
          ? {
              create: [
                {
                  tenantId,
                  type: "ENTRADA",
                  quantity: initialStock,
                  unitCost: cost,
                  description: "Estoque inicial cadastrado",
                },
              ],
            }
          : undefined,
      },
      include: {
        supplier: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar produto:", error);
    return NextResponse.json({ error: error.message || "Erro ao cadastrar produto" }, { status: 500 });
  }
}
