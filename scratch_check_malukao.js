const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const target = await prisma.tenant.findFirst({
    where: { ownerEmail: { contains: "malukao" } }
  });
  console.log("MALUKAO TENANT:", JSON.stringify(target, null, 2));

  const allTenants = await prisma.tenant.findMany({
    select: { id: true, name: true, ownerEmail: true, plan: true, subscriptionStatus: true, subscriptionExpiresAt: true }
  });
  console.log("ALL TENANTS:", JSON.stringify(allTenants, null, 2));
}

main().finally(() => prisma.$disconnect());
