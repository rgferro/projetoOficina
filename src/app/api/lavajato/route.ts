import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { isRouteAllowedForPlan } from "@/lib/permissions";

async function ensurePlanAccessToLavajato(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, plan: true },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Oficina não encontrada." }, { status: 404 });
  }

  if (!isRouteAllowedForPlan(tenant.plan, "/lavajato")) {
    return NextResponse.json(
      {
        error: "O módulo Lava-Jato não está disponível no seu plano atual. Faça upgrade para o Plano Pro.",
      },
      { status: 403 }
    );
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const { tenantId } = await getTenantContext(request);
    const blocked = await ensurePlanAccessToLavajato(tenantId);
    if (blocked) return blocked;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const activeOnly = searchParams.get("active") === "true";

    const whereClause: any = { tenantId };
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
    const { tenantId } = await getTenantContext(request);
    const blocked = await ensurePlanAccessToLavajato(tenantId);
    if (blocked) return blocked;
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

      let existingVehicle = await prisma.vehicle.findFirst({
        where: { tenantId, plate: cleanPlate },
      });

      if (existingVehicle) {
        targetVehicleId = existingVehicle.id;
      } else {
        let customer = await prisma.customer.create({
          data: {
            tenantId,
            name: newCustomerName || `Cliente ${cleanPlate}`,
            phone: newCustomerPhone || "00000000000",
          },
        });

        const newVehicle = await prisma.vehicle.create({
          data: {
            tenantId,
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

    // Validação de cota mensal por tenant (legado para planos com cota ativa)
    const { checkTenantMonthlyQuota } = await import("@/lib/audit");
    if (tenantId) {
      const quotaCheck = await checkTenantMonthlyQuota(tenantId, "WASH");
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
      where: { tenantId },
      orderBy: { ticketNumber: "desc" },
    });
    const ticketNumber = lastTicket ? lastTicket.ticketNumber + 1 : 1001;

    const ticket = await prisma.washTicket.create({
      data: {
        tenantId,
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
    const { tenantId } = await getTenantContext(request);
    const blocked = await ensurePlanAccessToLavajato(tenantId);
    if (blocked) return blocked;
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

    const current = await prisma.washTicket.findFirst({
      where: { id, tenantId },
      include: { vehicle: true },
    });

    if (!current) {
      return NextResponse.json({ error: "Lavagem não encontrada nesta oficina" }, { status: 404 });
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
            tenantId,
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
    const { tenantId } = await getTenantContext(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const existing = await prisma.washTicket.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Ticket não encontrado nesta oficina" }, { status: 404 });
    }

    await prisma.washTicket.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao excluir ticket" }, { status: 500 });
  }
}
