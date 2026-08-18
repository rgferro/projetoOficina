const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany();
  console.log("=== TENANTS ===");
  console.log(JSON.stringify(tenants, null, 2));

  const payments = await prisma.subscriptionPayment.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  console.log("=== PAYMENTS ===");
  console.log(JSON.stringify(payments, null, 2));
}

main().finally(() => prisma.$disconnect());
