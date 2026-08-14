import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import {
  getCloudBackupStatus,
  performAutoCloudBackup,
} from "@/lib/cloudBackup";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format"); // "db", "json" ou "status"

    // 1. Status do Backup em Nuvem Automático
    if (format === "status") {
      const status = getCloudBackupStatus();
      return NextResponse.json(status);
    }

    const dateStr = new Date().toISOString().replace(/:/g, "-").split(".")[0];

    // 2. Exportação JSON
    if (format === "json") {
      const customers = await prisma.customer.findMany({ include: { vehicles: true } });
      const employees = await prisma.employee.findMany();
      const suppliers = await prisma.supplier.findMany();
      const products = await prisma.product.findMany();
      const standardServices = await prisma.standardService.findMany();
      const washTickets = await prisma.washTicket.findMany();
      const serviceOrders = await prisma.serviceOrder.findMany({
        include: { items: true, payments: true, photos: true },
      });
      const sales = await prisma.sale.findMany({ include: { items: true } });
      const transactions = await prisma.financialTransaction.findMany();
      const accountsPayable = await prisma.accountPayable.findMany();
      const accountsReceivable = await prisma.accountReceivable.findMany();
      const settings = await prisma.workshopSetting.findMany();

      const dump = {
        exportedAt: new Date().toISOString(),
        version: "2.0",
        data: {
          settings,
          employees,
          customers,
          suppliers,
          products,
          standardServices,
          washTickets,
          serviceOrders,
          sales,
          transactions,
          accountsPayable,
          accountsReceivable,
        },
      };

      return new NextResponse(JSON.stringify(dump, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="backup_autogestao_${dateStr}.json"`,
        },
      });
    }

    // 3. Download direto do arquivo SQLite .db
    const dbPath = path.join(process.cwd(), "prisma", "dev.db");
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: "Arquivo de banco dev.db não encontrado" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(dbPath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/x-sqlite3",
        "Content-Disposition": `attachment; filename="autogestao_backup_${dateStr}.db"`,
      },
    });
  } catch (error: any) {
    console.error("Erro ao gerar backup:", error);
    return NextResponse.json({ error: error.message || "Erro no backup" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Executa backup em nuvem automático
    const result = performAutoCloudBackup();
    const updatedStatus = getCloudBackupStatus();

    return NextResponse.json({
      success: true,
      message: `Backup em nuvem sincronizado com sucesso!`,
      result,
      status: updatedStatus,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Falha ao salvar cópia de backup" }, { status: 500 });
  }
}
