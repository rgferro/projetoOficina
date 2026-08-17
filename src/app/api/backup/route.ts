import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import {
  generateFullBackupData,
  getGoogleDriveStatus,
  saveGoogleDriveConfig,
  syncBackupToGoogleDrive,
} from "@/lib/cloudBackup";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format"); // "db", "json" ou "status"

    // 1. Status da Integração Google Drive & Backup
    if (format === "status") {
      const gdriveStatus = await getGoogleDriveStatus();
      return NextResponse.json(gdriveStatus);
    }

    const dateStr = new Date().toISOString().replace(/:/g, "-").split(".")[0];

    // 2. Exportação JSON Completa (Download direto para o navegador)
    if (format === "json") {
      const dump = await generateFullBackupData();

      return new NextResponse(JSON.stringify(dump, null, 2), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="backup_oficina_${dateStr}.json"`,
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
        "Content-Disposition": `attachment; filename="autogestao_banco_${dateStr}.db"`,
      },
    });
  } catch (error: any) {
    console.error("Erro ao gerar backup:", error);
    return NextResponse.json({ error: error.message || "Erro no backup" }, { status: 500 });
  }
}

// POST: Executa envio para o Google Drive ou Salva Configurações do Google Drive
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    // Se o payload for para salvar configurações do Google Drive
    if (body.action === "save_config") {
      const { enabled, email, folderId, webhookUrl } = body;
      await saveGoogleDriveConfig("default", {
        enabled: Boolean(enabled),
        email,
        folderId,
        webhookUrl,
      });

      const updated = await getGoogleDriveStatus("default");
      return NextResponse.json({
        success: true,
        message: enabled ? "Google Drive configurado com sucesso!" : "Google Drive desconectado.",
        status: updated,
      });
    }

    // Se for para sincronizar/enviar cópia para o Google Drive
    const result = await syncBackupToGoogleDrive("default");
    const updatedStatus = await getGoogleDriveStatus("default");

    return NextResponse.json({
      success: true,
      message: `Backup enviado para o Google Drive com sucesso!`,
      result,
      status: updatedStatus,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Falha ao processar backup" }, { status: 400 });
  }
}
