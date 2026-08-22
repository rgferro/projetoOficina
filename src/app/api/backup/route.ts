import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant";
import fs from "fs";
import path from "path";
import {
  generateFullBackupData,
  getGoogleDriveStatus,
  createAndUploadGoogleDriveBackup,
  saveGoogleClientCredentials,
} from "@/lib/cloudBackup";
import { encryptBackupData } from "@/lib/cryptoBackup";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format"); // "status", "enc", "json", "db"
    const passphrase = searchParams.get("passphrase") || "";

    const { tenantId } = await getTenantContext(request);

    // 1. Status da Integração Google Drive & Backup
    if (format === "status") {
      const gdriveStatus = await getGoogleDriveStatus(tenantId);
      return NextResponse.json(gdriveStatus);
    }

    const dateStr = new Date().toISOString().replace(/:/g, "-").split(".")[0];

    // 2. Download do Arquivo Criptografado AES-256-GCM (.enc)
    if (format === "enc") {
      const dump = await generateFullBackupData(tenantId);
      const effectivePassphrase =
        passphrase || process.env.BACKUP_ENCRYPTION_KEY || `AUTOGESTAO_${tenantId}_SECURE_KEY`;
      const { jsonString } = encryptBackupData(dump, effectivePassphrase);

      return new NextResponse(jsonString, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="backup_oficina_criptografado_${dateStr}.enc"`,
        },
      });
    }

    // 3. Exportação JSON Padrão (Download direto para o navegador)
    if (format === "json") {
      const dump = await generateFullBackupData(tenantId);

      return new NextResponse(JSON.stringify(dump, null, 2), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="backup_oficina_${dateStr}.json"`,
        },
      });
    }

    // 4. Download direto do arquivo SQLite .db
    const dbPath = path.join(process.cwd(), "prisma", "dev.db");
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: "Arquivo de banco dev.db não encontrado" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(dbPath);

    return new NextResponse(new Uint8Array(fileBuffer), {
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

// POST: Executa envio imediato para o Google Drive ou Salva Credenciais Personalizadas
export async function POST(request: Request) {
  try {
    const { tenantId } = await getTenantContext(request);
    const body = await request.json().catch(() => ({}));

    // Se o payload for para salvar credenciais OAuth customizadas
    if (body.action === "save_credentials") {
      const { clientId, clientSecret } = body;
      await saveGoogleClientCredentials(tenantId, clientId || "", clientSecret || "");
      const updated = await getGoogleDriveStatus(tenantId);
      return NextResponse.json({
        success: true,
        message: "Credenciais do Google salvas com sucesso!",
        status: updated,
      });
    }

    // Se for para gerar e enviar backup criptografado para o Google Drive
    const result = await createAndUploadGoogleDriveBackup(tenantId, body.passphrase);
    const updatedStatus = await getGoogleDriveStatus(tenantId);

    return NextResponse.json({
      success: true,
      message: "Backup criptografado com AES-256-GCM e salvo no seu Google Drive com sucesso!",
      result,
      status: updatedStatus,
    });
  } catch (error: any) {
    console.error("Erro no processamento do backup:", error);
    return NextResponse.json({ error: error.message || "Falha ao processar backup" }, { status: 400 });
  }
}
