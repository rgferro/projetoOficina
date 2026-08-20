import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import {
  generateWhatsappLink,
  buildOilReminderMessage,
  buildWashReminderMessage,
} from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { tenantId } = await getTenantContext(request);

    const settings = await prisma.workshopSetting.findUnique({
      where: { tenantId },
    });

    const workshopName = settings?.workshopName || "Oficina & Lava-Jato";

    const now = new Date();
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    const vehicles = await prisma.vehicle.findMany({
      where: { tenantId },
      include: {
        customer: true,
        washTickets: {
          where: { tenantId },
          orderBy: { enteredAt: "desc" },
          take: 1,
        },
        serviceOrders: {
          where: { tenantId },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const washRetentionAlerts: any[] = [];
    const oilServiceAlerts: any[] = [];

    vehicles.forEach((vehicle) => {
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
