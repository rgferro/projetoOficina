export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext, ensureTenantDefaults, DEFAULT_SERVICES_LIST } from "@/lib/tenant";

export async function GET(request: Request) {
  try {
    const { tenantId } = await getTenantContext(request);
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";

    // Garante que a oficina tenha sua tabela de serviços populada
    await ensureTenantDefaults(tenantId);

    const where: any = { tenantId };
    if (q) {
      where.AND = [
        {
          OR: [
            { name: { contains: q } },
            { category: { contains: q } },
            { description: { contains: q } },
          ],
        },
      ];
    }

    const services = await prisma.standardService.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(services);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar tabela de serviços" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { tenantId } = await getTenantContext(request);
    const body = await request.json();

    if (body.action === "seed-defaults") {
      for (const def of DEFAULT_SERVICES_LIST) {
        const exists = await prisma.standardService.findFirst({
          where: { tenantId, name: def.name },
        });
        if (!exists) {
          await prisma.standardService.create({
            data: { ...def, tenantId },
          });
        }
      }
      const all = await prisma.standardService.findMany({
        where: { tenantId },
        orderBy: { name: "asc" },
      });
      return NextResponse.json(all, { status: 200 });
    }

    const { name, category, defaultPrice, estimatedMinutes, description } = body;

    if (!name) {
      return NextResponse.json({ error: "Nome do serviço é obrigatório" }, { status: 400 });
    }

    const service = await prisma.standardService.create({
      data: {
        tenantId,
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
    const { tenantId } = await getTenantContext(request);
    const body = await request.json();
    const { id, name, category, defaultPrice, estimatedMinutes, description } = body;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const existing = await prisma.standardService.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Serviço não encontrado nesta oficina" }, { status: 404 });
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
    const { tenantId } = await getTenantContext(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const existing = await prisma.standardService.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Serviço não encontrado nesta oficina" }, { status: 404 });
    }

    await prisma.standardService.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao excluir" }, { status: 500 });
  }
}
