import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        washTickets: {
          where: { status: "ENTREGUE" },
          select: { price: true, enteredAt: true },
        },
        serviceOrders: {
          where: { status: "CONCLUIDO" },
          select: { grandTotal: true, totalServices: true, createdAt: true },
        },
      },
      orderBy: { name: "asc" },
    });

    // Calcula resumo de produção e comissão estimada
    const enriched = employees.map((emp) => {
      const totalWashes = emp.washTickets.length;
      const washVolume = emp.washTickets.reduce((sum, w) => sum + w.price, 0);

      const totalOS = emp.serviceOrders.length;
      const osServicesVolume = emp.serviceOrders.reduce(
        (sum, os) => sum + os.totalServices,
        0
      );

      // Comissão calculada sobre serviços e lavagens
      const totalEligibleVolume = washVolume + osServicesVolume;
      const estimatedCommission = (totalEligibleVolume * emp.commissionRate) / 100;

      return {
        ...emp,
        stats: {
          totalWashes,
          washVolume,
          totalOS,
          osServicesVolume,
          estimatedCommission,
        },
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Erro ao buscar equipe:", error);
    return NextResponse.json({ error: "Erro ao buscar equipe" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, role, phone, commissionRate } = body;

    if (!name || !role) {
      return NextResponse.json(
        { error: "Nome e Cargo são obrigatórios" },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.create({
      data: {
        name,
        role,
        phone: phone || null,
        commissionRate: Number(commissionRate) || 0,
        active: true,
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao criar funcionário" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, role, phone, commissionRate, active } = body;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        name,
        role,
        phone,
        commissionRate: Number(commissionRate) || 0,
        active: active !== undefined ? active : true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao atualizar funcionário" }, { status: 500 });
  }
}
