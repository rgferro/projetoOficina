import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";

    const services = await prisma.standardService.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q } },
              { category: { contains: q } },
              { description: { contains: q } },
            ],
          }
        : undefined,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(services);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar tabela de serviços" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, defaultPrice, estimatedMinutes, description } = body;

    if (!name) {
      return NextResponse.json({ error: "Nome do serviço é obrigatório" }, { status: 400 });
    }

    const service = await prisma.standardService.create({
      data: {
        name,
        category: category || "Mecânica Geral",
        defaultPrice: Number(defaultPrice) || 0,
        estimatedMinutes: Number(estimatedMinutes) || 60,
        description: description || null,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao criar serviço" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, category, defaultPrice, estimatedMinutes, description } = body;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const updated = await prisma.standardService.update({
      where: { id },
      data: {
        name,
        category,
        defaultPrice: Number(defaultPrice) || 0,
        estimatedMinutes: Number(estimatedMinutes) || 60,
        description,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    await prisma.standardService.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao excluir" }, { status: 500 });
  }
}
