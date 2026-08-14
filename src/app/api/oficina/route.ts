import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const q = searchParams.get("q") || "";

    const whereClause: any = {};
    if (status && status !== "TODOS") {
      whereClause.status = status;
    }
    if (q) {
      whereClause.OR = [
        { customer: { name: { contains: q } } },
        { vehicle: { plate: { contains: q } } },
        { vehicle: { model: { contains: q } } },
      ];
    }

    const orders = await prisma.serviceOrder.findMany({
      where: whereClause,
      include: {
        customer: true,
        vehicle: true,
        employee: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Erro ao buscar Ordens de Serviço:", error);
    return NextResponse.json({ error: "Erro ao buscar OSs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerId,
      vehicleId,
      employeeId,
      status,
      entryKm,
      problemDescription,
      technicalReport,
      internalNotes,
      discount,
      estimatedDelivery,
      items,
    } = body;

    if (!customerId || !vehicleId) {
      return NextResponse.json(
        { error: "Cliente e Veículo são obrigatórios" },
        { status: 400 }
      );
    }

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

    if (entryKm) {
      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: { currentKm: Number(entryKm) },
      });
    }

    const lastOrder = await prisma.serviceOrder.findFirst({
      orderBy: { osNumber: "desc" },
    });
    const osNumber = lastOrder ? lastOrder.osNumber + 1 : 1001;

    const order = await prisma.serviceOrder.create({
      data: {
        osNumber,
        customerId,
        vehicleId,
        employeeId: employeeId || null,
        status: status || "ORCAMENTO",
        entryKm: entryKm ? Number(entryKm) : null,
        problemDescription: problemDescription || null,
        technicalReport: technicalReport || null,
        internalNotes: internalNotes || null,
        discount: parsedDiscount,
        totalParts,
        totalServices,
        grandTotal,
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
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

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar Ordem de Serviço:", error);
    return NextResponse.json({ error: error.message || "Erro ao criar OS" }, { status: 500 });
  }
}
