export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { tenantId } = await getTenantContext(request);
    const customer = await prisma.customer.findFirst({
      where: { id, tenantId },
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
      return NextResponse.json({ error: "Cliente não encontrado nesta oficina" }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Erro ao buscar cliente por ID:", error);
    return NextResponse.json({ error: "Falha ao buscar cliente" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { tenantId } = await getTenantContext(request);
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

    const existing = await prisma.customer.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Cliente não encontrado nesta oficina" }, { status: 404 });
    }

    const updated = await prisma.customer.update({
      where: { id },
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
    return NextResponse.json({ error: error.message || "Erro ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { tenantId } = await getTenantContext(request);
    const existing = await prisma.customer.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Cliente não encontrado nesta oficina" }, { status: 404 });
    }

    await prisma.customer.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao excluir" }, { status: 500 });
  }
}
