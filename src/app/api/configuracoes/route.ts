import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await getTenantContext(req);

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    let settings = await prisma.workshopSetting.findUnique({
      where: { tenantId },
    });

    const formattedTenantAddress = tenant
      ? [
          tenant.street && tenant.number ? `${tenant.street}, ${tenant.number}` : tenant.street,
          tenant.complement,
          tenant.neighborhood,
          tenant.city && tenant.state ? `${tenant.city}/${tenant.state}` : tenant.city,
          tenant.cep ? `CEP ${tenant.cep}` : null,
        ]
          .filter(Boolean)
          .join(" - ")
      : "";

    if (!settings && tenant) {
      settings = await prisma.workshopSetting.create({
        data: {
          id: tenantId,
          tenantId,
          workshopName: tenant.name,
          cnpj: tenant.document || "",
          phone: tenant.ownerPhone || "",
          address: formattedTenantAddress,
          email: tenant.ownerEmail || "",
          warrantyDays: 90,
          whatsappWashReadyTemplate:
            "Olá {nome}! Seu {veiculo} ({placa}) já está limpo e pronto para retirada no {oficina}! 🚗✨\nValor: {valor}\nPode retirar a qualquer momento!",
          whatsappOilReminderTemplate:
            "Olá {nome}! Notamos que faz 6 meses da última revisão/troca de óleo do seu {veiculo} ({placa}). Agende sua revisão preventiva com a gente no {oficina}! 🛠️",
          whatsappWashReminderTemplate:
            "Olá {nome}! Faz {dias} dias que seu {veiculo} ({placa}) não toma aquele banho especial no {oficina}. Que tal agendar uma lavagem hoje? 🧼✨",
          whatsappBirthdayTemplate:
            "🎉 Parabéns {nome}! A equipe do {oficina} deseja a você um feliz aniversário com muita saúde e sucesso! Venha comemorar conosco e ganhe 15% de desconto em qualquer serviço neste mês! 🎁🚗",
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
    return NextResponse.json({ error: "Erro ao buscar configurações" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { tenantId } = await getTenantContext(request);
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
      whatsappBirthdayTemplate,
    } = body;

    const updated = await prisma.workshopSetting.upsert({
      where: { tenantId },
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
        whatsappBirthdayTemplate,
      },
      create: {
        tenantId,
        workshopName: workshopName || "AutoGestão Oficina & Lava-Jato",
        cnpj,
        phone,
        address,
        email,
        warrantyDays: warrantyDays ? Number(warrantyDays) : 90,
        whatsappWashReadyTemplate,
        whatsappOilReminderTemplate,
        whatsappWashReminderTemplate,
        whatsappBirthdayTemplate,
      },
    });

    await prisma.tenant
      .update({
        where: { id: tenantId },
        data: {
          name: workshopName,
          document: cnpj || undefined,
          ownerPhone: phone || undefined,
        },
      })
      .catch(() => {});

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao salvar configurações" }, { status: 500 });
  }
}
