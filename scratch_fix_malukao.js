const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findFirst({
    where: { ownerEmail: "malukao.jogos@gmail.com" }
  });

  if (tenant) {
    const nextExpiry = new Date();
    nextExpiry.setDate(nextExpiry.getDate() + 30);

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        plan: "PRO",
        maxUsers: 4,
        subscriptionStatus: "active",
        subscriptionExpiresAt: nextExpiry,
      }
    });

    await prisma.subscriptionPayment.upsert({
      where: { id: "payment_173423185373" },
      update: { status: "approved", paidAt: new Date() },
      create: {
        id: "payment_173423185373",
        tenantId: tenant.id,
        paymentId: "173423185373",
        amount: 69.9,
        status: "approved",
        method: "pix",
        plan: "PRO",
        paidAt: new Date(),
      }
    });

    console.log("OFICINA DO RAFA ATIVADA COM SUCESSO NO PLANO PRO ATE:", nextExpiry.toISOString());
  }
}

main().finally(() => prisma.$disconnect());
