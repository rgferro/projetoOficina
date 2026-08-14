import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateWhatsappLink,
  buildOilReminderMessage,
  buildWashReminderMessage,
} from "@/lib/whatsapp";

export async function GET() {
  try {
    const settings = await prisma.workshopSetting.findUnique({
      where: { id: "default" },
    });

    const workshopName = settings?.workshopName || "Oficina & Lava-Jato";

    // 1. Clientes do Lava-Jato sem retorno há mais de 15 dias
    const now = new Date();
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

    const vehicles = await prisma.vehicle.findMany({
      include: {
        customer: true,
        washTickets: {
          orderBy: { enteredAt: "desc" },
          take: 1,
        },
        serviceOrders: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const washRetentionAlerts: any[] = [];
    const oilServiceAlerts: any[] = [];

    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    vehicles.forEach((vehicle) => {
      // Análise Lava-Jato
      const lastWash = vehicle.washTickets[0];
      if (lastWash && lastWash.enteredAt <= fifteenDaysAgo) {
        const diffTime = Math.abs(now.getTime() - new Date(lastWash.enteredAt).getTime());
        const daysSince = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const msg = buildWashReminderMessage({
          customerName: vehicle.customer.name,
          vehicleName: `${vehicle.brand} ${vehicle.model}`,
          plate: vehicle.plate,
          daysSinceLastWash: daysSince,
          workshopName,
          customTemplate: settings?.whatsappWashReminderTemplate,
        });

        washRetentionAlerts.push({
          vehicleId: vehicle.id,
          plate: vehicle.plate,
          vehicleModel: `${vehicle.brand} ${vehicle.model}`,
          customerId: vehicle.customer.id,
          customerName: vehicle.customer.name,
          customerPhone: vehicle.customer.phone,
          lastWashDate: lastWash.enteredAt,
          daysSinceLastWash: daysSince,
          whatsappLink: generateWhatsappLink(vehicle.customer.phone, msg),
          messagePreview: msg,
        });
      }

      // Análise Oficina / Revisão / Troca de Óleo (> 180 dias da última OS)
      const lastOS = vehicle.serviceOrders[0];
      if (lastOS && lastOS.createdAt <= sixMonthsAgo) {
        const diffTime = Math.abs(now.getTime() - new Date(lastOS.createdAt).getTime());
        const monthsSince = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));

        const msg = buildOilReminderMessage({
          customerName: vehicle.customer.name,
          vehicleName: `${vehicle.brand} ${vehicle.model}`,
          plate: vehicle.plate,
          workshopName,
          customTemplate: settings?.whatsappOilReminderTemplate,
        });

        oilServiceAlerts.push({
          vehicleId: vehicle.id,
          plate: vehicle.plate,
          vehicleModel: `${vehicle.brand} ${vehicle.model}`,
          customerId: vehicle.customer.id,
          customerName: vehicle.customer.name,
          customerPhone: vehicle.customer.phone,
          lastOSDate: lastOS.createdAt,
          monthsSince,
          lastOsNumber: lastOS.osNumber,
          whatsappLink: generateWhatsappLink(vehicle.customer.phone, msg),
          messagePreview: msg,
        });
      }
    });

    return NextResponse.json({
      summary: {
        washAlertsCount: washRetentionAlerts.length,
        oilAlertsCount: oilServiceAlerts.length,
        totalAlerts: washRetentionAlerts.length + oilServiceAlerts.length,
      },
      washRetentionAlerts,
      oilServiceAlerts,
    });
  } catch (error) {
    console.error("Erro no CRM:", error);
    return NextResponse.json({ error: "Erro ao gerar alertas do CRM" }, { status: 500 });
  }
}
