import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";

    const vehicles = await prisma.vehicle.findMany({
      where: q
        ? {
            OR: [
              { plate: { contains: q } },
              { model: { contains: q } },
              { brand: { contains: q } },
              { customer: { name: { contains: q } } },
            ],
          }
        : undefined,
      include: {
        customer: true,
      },
      orderBy: { plate: "asc" },
    });

    return NextResponse.json(vehicles);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar veículos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { plate, brand, model, year, color, category, currentKm, notes, customerId } = body;

    if (!plate || !customerId) {
      return NextResponse.json(
        { error: "Placa e Cliente são obrigatórios" },
        { status: 400 }
      );
    }

    const cleanPlate = plate.toUpperCase().trim().replace(/[^A-Z0-9]/g, "");

    const vehicle = await prisma.vehicle.create({
      data: {
        plate: cleanPlate,
        brand: brand || "Desconhecida",
        model: model || "Modelo",
        year: year ? Number(year) : null,
        color: color || null,
        category: category || "Hatch / Sedan",
        currentKm: currentKm ? Number(currentKm) : 0,
        notes: notes || null,
        customerId,
      },
      include: {
        customer: true,
      },
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Já existe um veículo cadastrado com esta placa." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message || "Erro ao criar veículo" }, { status: 500 });
  }
}
