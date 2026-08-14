import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let settings = await prisma.workshopSetting.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.workshopSetting.create({
        data: {
          id: "default",
          workshopName: "AutoGestão Oficina & Lava-Jato",
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar configurações" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      workshopName,
      cnpj,
      phone,
      address,
      email,
      warrantyDays,
      whatsappWashReadyTemplate,
      whatsappOilReminderTemplate,
      whatsappWashReminderTemplate,
    } = body;

    const updated = await prisma.workshopSetting.upsert({
      where: { id: "default" },
      update: {
        workshopName,
        cnpj,
        phone,
        address,
        email,
        warrantyDays: warrantyDays ? Number(warrantyDays) : 90,
        whatsappWashReadyTemplate,
        whatsappOilReminderTemplate,
        whatsappWashReminderTemplate,
      },
      create: {
        id: "default",
        workshopName: workshopName || "AutoGestão Oficina & Lava-Jato",
        cnpj,
        phone,
        address,
        email,
        warrantyDays: warrantyDays ? Number(warrantyDays) : 90,
        whatsappWashReadyTemplate,
        whatsappOilReminderTemplate,
        whatsappWashReminderTemplate,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao salvar configurações" }, { status: 500 });
  }
}
