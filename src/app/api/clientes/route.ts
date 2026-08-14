import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";

    const customers = await prisma.customer.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q } },
              { phone: { contains: q } },
              { document: { contains: q } },
              { vehicles: { some: { plate: { contains: q } } } },
            ],
          }
        : undefined,
      include: {
        vehicles: true,
        _count: {
          select: {
            serviceOrders: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    return NextResponse.json(
      { error: "Falha ao buscar clientes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      type,
      phone,
      email,
      document,
      stateRegistration,
      birthDate,
      address,
      notes,
      vehicle,
    } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Nome e WhatsApp/Telefone são obrigatórios" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        type: type || "PF",
        phone,
        email: email || null,
        document: document || null,
        stateRegistration: stateRegistration || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        address: address || null,
        notes: notes || null,
        vehicles: vehicle && vehicle.plate
          ? {
              create: [
                {
                  plate: vehicle.plate.toUpperCase().trim(),
                  brand: vehicle.brand || "Desconhecida",
                  model: vehicle.model || "Modelo",
                  year: vehicle.year ? Number(vehicle.year) : null,
                  color: vehicle.color || null,
                  category: vehicle.category || "Hatch / Sedan",
                  currentKm: vehicle.currentKm ? Number(vehicle.currentKm) : 0,
                  notes: vehicle.notes || null,
                },
              ],
            }
          : undefined,
      },
      include: {
        vehicles: true,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar cliente:", error);
    return NextResponse.json(
      { error: error?.message || "Falha ao criar cliente" },
      { status: 500 }
    );
  }
}
