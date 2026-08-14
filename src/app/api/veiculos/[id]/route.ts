import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { plate, brand, model, year, color, category, currentKm, notes } = body;

    const cleanPlate = plate.toUpperCase().trim().replace(/[^A-Z0-9]/g, "");

    const updated = await prisma.vehicle.update({
      where: { id: params.id },
      data: {
        plate: cleanPlate,
        brand,
        model,
        year: year ? Number(year) : null,
        color: color || null,
        category: category || "Hatch / Sedan",
        currentKm: currentKm ? Number(currentKm) : 0,
        notes: notes || null,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao atualizar veículo" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.vehicle.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao excluir veículo" }, { status: 500 });
  }
}
