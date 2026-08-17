import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySessionToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("torque_token")?.value;
    const session = token ? verifySessionToken(token) : null;
    const tenantId = session?.tenantId || "default";

    let tenant = null;
    if (session?.tenantId) {
      tenant = await prisma.tenant.findUnique({
        where: { id: session.tenantId },
      });
    }

    // Se não encontrou tenant específico, busca o primeiro tenant ativo ou master
    if (!tenant) {
      tenant = await prisma.tenant.findFirst({
        where: { active: true },
        orderBy: { createdAt: "desc" },
      });
    }

    let settings = await prisma.workshopSetting.findUnique({
      where: { id: tenant?.id || "default" },
    });

    if (!settings && tenant) {
      settings = await prisma.workshopSetting.findUnique({
        where: { id: "default" },
      });
    }

    // Formata o endereço a partir do cadastro do Tenant se disponível
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

    // Se não houver configurações ou se ainda tiverem dados mock/fakes antigos, sincroniza com o cadastro real do dono
    const isMockData =
      !settings ||
      settings.workshopName === "AutoCenter & Lava-Jato Master" ||
      settings.cnpj === "23.456.789/0001-12";

    if (tenant && isMockData) {
      settings = await prisma.workshopSetting.upsert({
        where: { id: tenant.id },
        update: {
          workshopName: tenant.name,
          cnpj: tenant.document || "",
          phone: tenant.ownerPhone || "",
          address: formattedTenantAddress,
          email: tenant.ownerEmail || "",
        },
        create: {
          id: tenant.id,
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
    } else if (!settings) {
      settings = await prisma.workshopSetting.create({
        data: {
          id: "default",
          workshopName: tenant?.name || "AutoGestão Oficina & Lava-Jato",
          cnpj: tenant?.document || "",
          phone: tenant?.ownerPhone || "",
          address: formattedTenantAddress || "",
          email: tenant?.ownerEmail || "",
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
    const token = request.cookies.get("torque_token")?.value;
    const session = token ? verifySessionToken(token) : null;
    const tenantId = session?.tenantId || "default";

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

    // Atualiza as configurações da oficina
    const updated = await prisma.workshopSetting.upsert({
      where: { id: tenantId },
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
        id: tenantId,
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

    // Se estiver associado a um Tenant, mantém a sincronização com os dados cadastrais da empresa
    if (session?.tenantId) {
      await prisma.tenant
        .update({
          where: { id: session.tenantId },
          data: {
            name: workshopName,
            document: cnpj || undefined,
            ownerPhone: phone || undefined,
          },
        })
        .catch(() => {});
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao salvar configurações" }, { status: 500 });
  }
}
