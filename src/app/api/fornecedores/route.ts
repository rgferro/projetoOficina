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
            { name: { contains: q } },
            { document: { contains: q } },
            { contactName: { contains: q } },
            { phone: { contains: q } },
          ],
        },
      ];
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        _count: {
          select: { products: true, accountsPayable: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(suppliers);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar fornecedores" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { tenantId } = await getTenantContext(request);
    const body = await request.json();
    const { name, document, contactName, phone, email, city, state, pixKey, notes } = body;

    if (!name) {
      return NextResponse.json({ error: "Razão Social / Nome Fantasia é obrigatório" }, { status: 400 });
    }

    const supplier = await prisma.supplier.create({
      data: {
        tenantId,
        name,
        document: document || null,
        contactName: contactName || null,
        phone: phone || null,
        email: email || null,
        city: city || null,
        state: state || null,
        pixKey: pixKey || null,
        notes: notes || null,
      },
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao cadastrar fornecedor" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { tenantId } = await getTenantContext(request);
    const body = await request.json();
    const { id, name, document, contactName, phone, email, city, state, pixKey, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const existing = await prisma.supplier.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Fornecedor não encontrado nesta oficina" }, { status: 404 });
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        name,
        document,
        contactName,
        phone,
        email,
        city,
        state,
        pixKey,
        notes,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao atualizar fornecedor" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { tenantId } = await getTenantContext(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const existing = await prisma.supplier.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Fornecedor não encontrado nesta oficina" }, { status: 404 });
    }

    await prisma.supplier.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao excluir fornecedor" }, { status: 500 });
  }
}
