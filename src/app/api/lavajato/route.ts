import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const activeOnly = searchParams.get("active") === "true";

    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    } else if (activeOnly) {
      whereClause.status = {
        in: ["AGUARDANDO", "EM_LAVAGEM", "FINALIZADO"],
      };
    }

    const tickets = await prisma.washTicket.findMany({
      where: whereClause,
      include: {
        vehicle: {
          include: {
            customer: true,
          },
        },
        employee: true,
      },
      orderBy: { enteredAt: "desc" },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Erro ao buscar tickets do lava-jato:", error);
    return NextResponse.json({ error: "Erro ao buscar lavagens" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      serviceType,
      price,
      notes,
      vehicleId,
      employeeId,
      newPlate,
      newCustomerName,
      newCustomerPhone,
      newVehicleModel,
      newVehicleCategory,
    } = body;

    let targetVehicleId = vehicleId;

    if (!targetVehicleId && newPlate) {
      const cleanPlate = newPlate.toUpperCase().trim().replace(/[^A-Z0-9]/g, "");

      let existingVehicle = await prisma.vehicle.findUnique({
        where: { plate: cleanPlate },
      });

      if (existingVehicle) {
        targetVehicleId = existingVehicle.id;
      } else {
        let customer = await prisma.customer.create({
          data: {
            name: newCustomerName || `Cliente ${cleanPlate}`,
            phone: newCustomerPhone || "00000000000",
          },
        });

        const newVehicle = await prisma.vehicle.create({
          data: {
            plate: cleanPlate,
            brand: "Geral",
            model: newVehicleModel || "Veículo",
            category: newVehicleCategory || "Hatch / Sedan",
            customerId: customer.id,
          },
        });

        targetVehicleId = newVehicle.id;
      }
    }

    if (!targetVehicleId || !serviceType || price === undefined) {
      return NextResponse.json(
        { error: "Veículo, Tipo de Serviço e Valor são obrigatórios" },
        { status: 400 }
      );
    }

    // 1. Validação de Sessão e Cota Mensal do Plano Starter (50 Lavagens / mês)
    const { cookies } = await import("next/headers");
    const { verifySessionToken } = await import("@/lib/auth");
    const { checkTenantMonthlyQuota } = await import("@/lib/audit");

    const cookieStore = await cookies();
    const token = cookieStore.get("torque_token")?.value;
    const session = token ? verifySessionToken(token) : null;

    let targetTenantId = session?.tenantId;
    if (!targetTenantId) {
      const firstTenant = await prisma.tenant.findFirst({ where: { active: true } });
      targetTenantId = firstTenant?.id;
    }

    if (targetTenantId) {
      const quotaCheck = await checkTenantMonthlyQuota(targetTenantId, "WASH");
      if (!quotaCheck.allowed) {
        return NextResponse.json(
          {
            error: quotaCheck.message,
            quotaExceeded: true,
            quotaType: "WASH",
            current: quotaCheck.currentCount,
            limit: quotaCheck.limit,
          },
          { status: 403 }
        );
      }
    }

    const lastTicket = await prisma.washTicket.findFirst({
      orderBy: { ticketNumber: "desc" },
    });
    const ticketNumber = lastTicket ? lastTicket.ticketNumber + 1 : 1001;

    const ticket = await prisma.washTicket.create({
      data: {
        ticketNumber,
        serviceType,
        price: Number(price),
        notes: notes || null,
        vehicleId: targetVehicleId,
        employeeId: employeeId || null,
        status: "AGUARDANDO",
        enteredAt: new Date(),
      },
      include: {
        vehicle: {
          include: {
            customer: true,
          },
        },
        employee: true,
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar ticket do lava-jato:", error);
    return NextResponse.json({ error: error.message || "Erro ao criar lavagem" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      status,
      paymentMethod,
      notifiedWhatsapp,
      notes,
      employeeId,
      price,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "ID do ticket é obrigatório" }, { status: 400 });
    }

    const current = await prisma.washTicket.findUnique({
      where: { id },
      include: { vehicle: true },
    });

    if (!current) {
      return NextResponse.json({ error: "Lavagem não encontrada" }, { status: 404 });
    }

    const dataToUpdate: any = {};
    if (status) dataToUpdate.status = status;
    if (notes !== undefined) dataToUpdate.notes = notes;
    if (employeeId !== undefined) dataToUpdate.employeeId = employeeId;
    if (price !== undefined) dataToUpdate.price = Number(price);
    if (notifiedWhatsapp !== undefined) dataToUpdate.notifiedWhatsapp = notifiedWhatsapp;

    if (status === "FINALIZADO" && !current.finishedAt) {
      dataToUpdate.finishedAt = new Date();
    }

    if (status === "ENTREGUE") {
      dataToUpdate.deliveredAt = new Date();
      if (paymentMethod) {
        dataToUpdate.paymentMethod = paymentMethod;
        dataToUpdate.paymentStatus = "PAGO";

        await prisma.financialTransaction.create({
          data: {
            description: `Lavagem #${current.ticketNumber} - ${current.serviceType} (${current.vehicle.plate})`,
            type: "RECEITA",
            category: "LAVA_JATO",
            amount: Number(price !== undefined ? price : current.price),
            paymentMethod: paymentMethod,
            washTicketId: current.id,
            date: new Date(),
          },
        });
      }
    }

    const updated = await prisma.washTicket.update({
      where: { id },
      data: dataToUpdate,
      include: {
        vehicle: {
          include: {
            customer: true,
          },
        },
        employee: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Erro ao atualizar ticket:", error);
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

    await prisma.washTicket.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao excluir ticket" }, { status: 500 });
  }
}
