import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateWhatsappLink } from "@/lib/whatsapp";
import { getTenantContext } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { tenantId } = await getTenantContext(request);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "geral";
    const month = searchParams.get("month") ? Number(searchParams.get("month")) : new Date().getMonth();

    const settings = await prisma.workshopSetting.findUnique({
      where: { tenantId },
    });
    const workshopName = settings?.workshopName || "Oficina Mecânica";

    // 1. ANIVERSARIANTES DO MÊS DA OFICINA
    const allCustomers = await prisma.customer.findMany({
      where: {
        tenantId,
        birthDate: { not: null },
      },
      include: {
        vehicles: true,
      },
    });

    const birthdayCustomers = allCustomers
      .filter((c) => {
        if (!c.birthDate) return false;
        const bDate = new Date(c.birthDate);
        return bDate.getUTCMonth() === month;
      })
      .map((c) => {
        const bDate = new Date(c.birthDate!);
        const template =
          settings?.whatsappBirthdayTemplate ||
          "🎉 Parabéns {nome}! A equipe do {oficina} deseja a você um feliz aniversário com muita saúde e sucesso! Venha nos visitar e ganhe um desconto especial este mês! 🎁🚗";

        const msg = template
          .replace(/{nome}/g, c.name.split(" ")[0])
          .replace(/{oficina}/g, workshopName);

        return {
          id: c.id,
          name: c.name,
          phone: c.phone,
          day: bDate.getUTCDate(),
          vehicles: c.vehicles.map((v) => `${v.brand} ${v.model} (${v.plate})`).join(", "),
          whatsappLink: generateWhatsappLink(c.phone, msg),
          messagePreview: msg,
        };
      })
      .sort((a, b) => a.day - b.day);

    // 2. CURVA ABC DE PRODUTOS DA OFICINA
    const products = await prisma.product.findMany({
      where: { tenantId },
      include: {
        saleItems: true,
        orderItems: true,
      },
    });

    let totalRevenueAllProducts = 0;

    const productStats = products.map((p) => {
      const soldInPDV = p.saleItems.reduce((sum, item) => sum + item.quantity, 0);
      const soldInOS = p.orderItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalUnitsSold = soldInPDV + soldInOS;

      const revenuePDV = p.saleItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const revenueOS = p.orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const totalRevenue = revenuePDV + revenueOS;

      totalRevenueAllProducts += totalRevenue;

      return {
        id: p.id,
        name: p.name,
        brand: p.brand || "-",
        sku: p.sku || "-",
        category: p.category,
        salePrice: p.salePrice,
        costPrice: p.costPrice,
        currentStock: p.currentStock,
        minStock: p.minStock,
        totalUnitsSold,
        totalRevenue,
      };
    });

    productStats.sort((a, b) => b.totalRevenue - a.totalRevenue);

    let accumulatedRevenue = 0;
    const abcClassified = productStats.map((item) => {
      accumulatedRevenue += item.totalRevenue;
      const percentageOfTotal = totalRevenueAllProducts > 0
        ? (accumulatedRevenue / totalRevenueAllProducts) * 100
        : 0;

      let classification = "C";
      if (percentageOfTotal <= 70) {
        classification = "A";
      } else if (percentageOfTotal <= 90) {
        classification = "B";
      } else {
        classification = "C";
      }

      return {
        ...item,
        accumulatedPercentage: percentageOfTotal.toFixed(1),
        classification,
      };
    });

    // 3. POSIÇÃO GERAL DE ESTOQUE
    let totalStockItems = 0;
    let totalStockCostValue = 0;
    let totalStockSaleValue = 0;
    const lowStockAlerts = [];

    for (const p of products) {
      totalStockItems += p.currentStock;
      totalStockCostValue += p.currentStock * p.costPrice;
      totalStockSaleValue += p.currentStock * p.salePrice;

      if (p.currentStock <= p.minStock) {
        lowStockAlerts.push({
          id: p.id,
          name: p.name,
          sku: p.sku,
          brand: p.brand,
          currentStock: p.currentStock,
          minStock: p.minStock,
          shelfLocation: p.shelfLocation,
        });
      }
    }

    // 4. PRODUTIVIDADE E COMISSÕES DA EQUIPE
    const employees = await prisma.employee.findMany({
      where: { tenantId },
      include: {
        orderItems: true,
        washTickets: { where: { status: "ENTREGUE" } },
        sales: true,
      },
    });

    const productivity = employees.map((emp) => {
      const totalServicesCount = emp.orderItems.length;
      const servicesRevenue = emp.orderItems.reduce((sum, item) => sum + item.totalPrice, 0);

      const totalWashesCount = emp.washTickets.length;
      const washesRevenue = emp.washTickets.reduce((sum, w) => sum + w.price, 0);

      const totalSalesCount = emp.sales.length;
      const salesRevenue = emp.sales.reduce((sum, s) => sum + s.grandTotal, 0);

      const commissionTotal =
        (servicesRevenue * emp.commissionRate) / 100 +
        (washesRevenue * emp.commissionRate) / 100;

      return {
        id: emp.id,
        name: emp.name,
        role: emp.role,
        commissionRate: emp.commissionRate,
        totalServicesCount,
        servicesRevenue,
        totalWashesCount,
        washesRevenue,
        totalSalesCount,
        salesRevenue,
        commissionTotal,
      };
    });

    return NextResponse.json({
      birthdays: {
        currentMonth: month,
        total: birthdayCustomers.length,
        customers: birthdayCustomers,
      },
      stock: {
        totalProductsCatalog: products.length,
        totalUnitsInStock: totalStockItems,
        totalCostValue: totalStockCostValue,
        totalSaleValue: totalStockSaleValue,
        potentialProfit: totalStockSaleValue - totalStockCostValue,
        lowStockCount: lowStockAlerts.length,
        lowStockAlerts,
      },
      abcCurve: {
        totalRevenue: totalRevenueAllProducts,
        products: abcClassified,
      },
      productivity,
    });
  } catch (error: any) {
    console.error("Erro ao gerar relatórios:", error);
    return NextResponse.json({ error: "Erro ao gerar relatórios" }, { status: 500 });
  }
}
