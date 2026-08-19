import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await getTenantContext(request);
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: params.id, tenantId },
      include: {
        customer: true,
        serviceOrders: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        washTickets: {
          orderBy: { enteredAt: "desc" },
          take: 10,
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json({ error: "Veículo não encontrado nesta oficina" }, { status: 404 });
    }

    return NextResponse.json(vehicle);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar veículo" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await getTenantContext(request);
    const body = await request.json();
    const { plate, brand, model, year, color, currentKm, category, notes, customerId } = body;

    const existing = await prisma.vehicle.findFirst({
      where: { id: params.id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Veículo não encontrado nesta oficina" }, { status: 404 });
    }

    const updated = await prisma.vehicle.update({
      where: { id: params.id },
      data: {
        plate: plate ? plate.toUpperCase().trim() : existing.plate,
        brand: brand !== undefined ? brand : existing.brand,
        model: model !== undefined ? model : existing.model,
        year: year ? Number(year) : existing.year,
        color: color !== undefined ? color : existing.color,
        currentKm: currentKm ? Number(currentKm) : existing.currentKm,
        category: category !== undefined ? category : existing.category,
        notes: notes !== undefined ? notes : existing.notes,
        customerId: customerId !== undefined ? customerId : existing.customerId,
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
    const { tenantId } = await getTenantContext(request);
    const existing = await prisma.vehicle.findFirst({
      where: { id: params.id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Veículo não encontrado nesta oficina" }, { status: 404 });
    }

    await prisma.vehicle.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao excluir veículo" }, { status: 500 });
  }
}
