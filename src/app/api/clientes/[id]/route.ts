import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        vehicles: {
          include: {
            washTickets: {
              orderBy: { enteredAt: "desc" },
              take: 5,
            },
            serviceOrders: {
              orderBy: { createdAt: "desc" },
              take: 5,
            },
          },
        },
        serviceOrders: {
          orderBy: { createdAt: "desc" },
          include: {
            vehicle: true,
            employee: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Erro ao buscar cliente por ID:", error);
    return NextResponse.json({ error: "Falha ao buscar cliente" }, { status: 500 });
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
      type,
      phone,
      email,
      document,
      stateRegistration,
      birthDate,
      address,
      notes,
    } = body;

    const updated = await prisma.customer.update({
      where: { id: params.id },
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
      },
      include: {
        vehicles: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Erro ao atualizar cliente:", error);
    return NextResponse.json({ error: error.message || "Erro ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.customer.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao excluir cliente:", error);
    return NextResponse.json({ error: error.message || "Erro ao excluir" }, { status: 500 });
  }
}
