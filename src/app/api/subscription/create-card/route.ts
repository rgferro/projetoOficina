import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createMercadoPagoPreapproval, SAAS_PLANS } from "@/lib/mercadopago";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId = "PRO", tenantId } = body;

    let tenant = await prisma.tenant.findFirst({
      where: tenantId ? { id: tenantId } : undefined,
    });

    if (!tenant) {
      const setting = await prisma.workshopSetting.findUnique({ where: { id: "default" } });
      tenant = await prisma.tenant.create({
        data: {
          name: setting?.workshopName || "Minha Oficina Automotiva",
          document: setting?.cnpj || "12.345.678/0001-90",
          ownerName: "Administrador da Oficina",
          ownerEmail: "admin@torquerp.com.br",
          ownerPhone: setting?.phone || "(11) 98765-4321",
          plan: "STARTER",
          maxUsers: 2,
          subscriptionStatus: "active",
        },
      });
    }

    const plan = SAAS_PLANS[planId] || SAAS_PLANS.PRO;
    const preapproval = await createMercadoPagoPreapproval(tenant, plan.price, plan.name);

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { mercadopagoPreapprovalId: preapproval.preapproval_id },
    });

    return NextResponse.json({
      success: true,
      initPoint: preapproval.init_point,
      preapprovalId: preapproval.preapproval_id,
    });
  } catch (error: any) {
    console.error("Erro ao gerar Assinatura Recorrente no Cartão:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao processar assinatura no cartão" },
      { status: 500 }
    );
  }
}
