import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export async function GET(request: Request) {
  try {
    const { tenantId } = await getTenantContext(request);
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";

    const where: any = { tenantId };
    if (q) {
      where.AND = [
        {
          OR: [
            { plate: { contains: q } },
            { model: { contains: q } },
            { brand: { contains: q } },
            { customer: { name: { contains: q } } },
          ],
        },
      ];
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        customer: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(vehicles);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar veículos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { tenantId } = await getTenantContext(request);
    const body = await request.json();
    const { plate, brand, model, year, color, currentKm, category, notes, customerId } = body;

    if (!plate || !customerId) {
      return NextResponse.json({ error: "Placa e Cliente são obrigatórios" }, { status: 400 });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        tenantId,
        plate: plate.toUpperCase().trim(),
        brand: brand || "Geral",
        model: model || "Veículo",
        year: year ? Number(year) : null,
        color: color || null,
        currentKm: currentKm ? Number(currentKm) : 0,
        category: category || "Hatch / Sedan",
        notes: notes || null,
        customerId,
      },
      include: {
        customer: true,
      },
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao cadastrar veículo" }, { status: 500 });
  }
}
