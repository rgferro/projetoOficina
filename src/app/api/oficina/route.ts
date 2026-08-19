import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export async function GET(request: Request) {
  try {
    const { tenantId } = await getTenantContext(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const q = searchParams.get("q") || "";

    const whereClause: any = { tenantId };
    if (status && status !== "TODOS") {
      whereClause.status = status;
    }
    if (q) {
      whereClause.AND = [
        {
          OR: [
            { customer: { name: { contains: q } } },
            { vehicle: { plate: { contains: q } } },
            { vehicle: { model: { contains: q } } },
          ],
        },
      ];
    }

    const orders = await prisma.serviceOrder.findMany({
      where: whereClause,
      include: {
        customer: true,
        vehicle: true,
        employee: true,
        items: {
          include: { product: true, employee: true },
        },
        photos: true,
        payments: true,
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
    const { tenantId } = await getTenantContext(request);
    const body = await request.json();
    const {
      customerId,
      vehicleId,
      employeeId,
      status,
      entryKm,
      defectClaimed,
      defectFound,
      problemDescription,
      technicalReport,
      internalNotes,
      discount,
      estimatedDelivery,
      items,
      photos,
    } = body;

    if (!customerId || !vehicleId) {
      return NextResponse.json(
        { error: "Cliente e Veículo são obrigatórios" },
        { status: 400 }
      );
    }

    // Validação de Cota Mensal do Plano Starter (30 OSs / mês)
    const { checkTenantMonthlyQuota } = await import("@/lib/audit");
    if (tenantId) {
      const quotaCheck = await checkTenantMonthlyQuota(tenantId, "OS");
      if (!quotaCheck.allowed) {
        return NextResponse.json(
          {
            error: quotaCheck.message,
            quotaExceeded: true,
            quotaType: "OS",
            current: quotaCheck.currentCount,
            limit: quotaCheck.limit,
          },
          { status: 403 }
        );
      }
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
        productId: item.productId || null,
        employeeId: item.employeeId || null,
        commissionRate: Number(item.commissionRate) || 0,
      };
    });

    const parsedDiscount = Number(discount) || 0;
    const grandTotal = Math.max(0, totalParts + totalServices - parsedDiscount);

    if (entryKm) {
      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: { currentKm: Number(entryKm) },
      }).catch(() => {});
    }

    const lastOrder = await prisma.serviceOrder.findFirst({
      where: { tenantId },
      orderBy: { osNumber: "desc" },
    });
    const osNumber = lastOrder ? lastOrder.osNumber + 1 : 1001;

    const formattedPhotos = (photos || []).map((p: any) => ({
      imageUrl: p.imageUrl,
      type: p.type || "AVARIA",
      caption: p.caption || null,
    }));

    const order = await prisma.serviceOrder.create({
      data: {
        tenantId,
        osNumber,
        customerId,
        vehicleId,
        employeeId: employeeId || null,
        status: status || "ORCAMENTO",
        entryKm: entryKm ? Number(entryKm) : null,
        defectClaimed: defectClaimed || null,
        defectFound: defectFound || null,
        problemDescription: problemDescription || defectClaimed || null,
        technicalReport: technicalReport || defectFound || null,
        internalNotes: internalNotes || null,
        discount: parsedDiscount,
        totalParts,
        totalServices,
        grandTotal,
        paidAmount: 0.0,
        remainingBalance: grandTotal,
        paymentStatus: "PENDENTE",
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
        items: {
          create: formattedItems,
        },
        photos: formattedPhotos.length > 0
          ? {
              create: formattedPhotos,
            }
          : undefined,
      },
      include: {
        customer: true,
        vehicle: true,
        employee: true,
        items: true,
        photos: true,
      },
    });

    // Se o status for de execução ou aprovação, baixa o estoque das peças vinculadas
    if (status === "EM_EXECUCAO" || status === "APROVADO") {
      for (const item of formattedItems) {
        if (item.productId) {
          const product = await prisma.product.findFirst({
            where: { id: item.productId, tenantId },
          });
          if (product) {
            const newStock = Math.max(0, product.currentStock - item.quantity);
            await prisma.product.update({
              where: { id: item.productId },
              data: { currentStock: newStock },
            });
            await prisma.stockMovement.create({
              data: {
                tenantId,
                productId: item.productId,
                type: "ORDEM_SERVICO",
                quantity: item.quantity,
                unitCost: product.costPrice,
                description: `Aplicação na OS #${order.osNumber}`,
              },
            });
          }
        }
      }
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar Ordem de Serviço:", error);
    return NextResponse.json({ error: error.message || "Erro ao criar OS" }, { status: 500 });
  }
}
