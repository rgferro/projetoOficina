import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "db"; // "db" ou "json"

    const dateStr = new Date().toISOString().replace(/:/g, "-").split(".")[0];

    if (format === "json") {
      const customers = await prisma.customer.findMany({ include: { vehicles: true } });
      const employees = await prisma.employee.findMany();
      const washTickets = await prisma.washTicket.findMany();
      const serviceOrders = await prisma.serviceOrder.findMany({ include: { items: true } });
      const transactions = await prisma.financialTransaction.findMany();
      const settings = await prisma.workshopSetting.findMany();

      const dump = {
        exportedAt: new Date().toISOString(),
        version: "1.0",
        data: {
          settings,
          employees,
          customers,
          washTickets,
          serviceOrders,
          transactions,
        },
      };

      return new NextResponse(JSON.stringify(dump, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="backup_oficina_${dateStr}.json"`,
        },
      });
    }

    // Retorna o arquivo SQLite bruto dev.db
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
    const body = await request.json();
    const targetFolder = body.targetFolder || path.join(process.cwd(), "backups");

    // Cria diretório se não existir
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const dbPath = path.join(process.cwd(), "prisma", "dev.db");
    const dateStr = new Date().toISOString().replace(/:/g, "-").split(".")[0];
    const destinationPath = path.join(targetFolder, `backup_auto_${dateStr}.db`);

    fs.copyFileSync(dbPath, destinationPath);

    return NextResponse.json({
      success: true,
      message: `Backup local copiado com sucesso!`,
      savedPath: destinationPath,
      createdAt: new Date(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Falha ao salvar cópia local" }, { status: 500 });
  }
}
