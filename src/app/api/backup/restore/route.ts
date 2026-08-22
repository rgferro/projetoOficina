import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant";
import {
  restoreBackupIntoDatabase,
  downloadAndDecryptDriveBackup,
} from "@/lib/cloudBackup";
import { decryptBackupData, sanitizeBackupPayload } from "@/lib/cryptoBackup";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { tenantId } = await getTenantContext(request);
    const contentType = request.headers.get("content-type") || "";

    let backupData: any = null;
    let passphrase = "";

    // Caso 1: Envio como Multipart FormData (Upload de arquivo local .enc ou .json)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      passphrase = (formData.get("passphrase") as string) || "";

      if (!file) {
        return NextResponse.json({ error: "Nenhum arquivo enviado para restauração." }, { status: 400 });
      }

      const fileArrayBuffer = await file.arrayBuffer();
      const fileBuffer = Buffer.from(fileArrayBuffer);
      const fileContentStr = fileBuffer.toString("utf8");

      // Tenta interpretar como arquivo criptografado .enc (AES-256-GCM)
      try {
        const parsedJson = JSON.parse(fileContentStr);
        if (parsedJson.format === "AUTOGESTAO_ENCRYPTED_BACKUP_V1") {
          const effectivePassphrase =
            passphrase || process.env.BACKUP_ENCRYPTION_KEY || `AUTOGESTAO_${tenantId}_SECURE_KEY`;
          backupData = decryptBackupData(parsedJson, effectivePassphrase);
        } else if (parsedJson.data) {
          // JSON de backup convencional não criptografado
          backupData = parsedJson;
        } else {
          throw new Error("Formato de backup inválido.");
        }
      } catch (err: any) {
        return NextResponse.json(
          {
            error:
              err.message ||
              "Não foi possível ler o arquivo de backup. Verifique a senha informada.",
          },
          { status: 400 }
        );
      }
    } else {
      // Caso 2: Envio como JSON (Via Google Drive fileId ou Payload já decodificado)
      const body = await request.json().catch(() => ({}));
      passphrase = body.passphrase || "";

      if (body.source === "google_drive" && body.fileId) {
        const driveResult = await downloadAndDecryptDriveBackup(
          tenantId,
          body.fileId,
          passphrase
        );
        backupData = driveResult.payload;
      } else if (body.payload) {
        backupData = body.payload;
      } else if (body.envelope) {
        const effectivePassphrase =
          passphrase || process.env.BACKUP_ENCRYPTION_KEY || `AUTOGESTAO_${tenantId}_SECURE_KEY`;
        backupData = decryptBackupData(body.envelope, effectivePassphrase);
      }
    }

    if (!backupData || !backupData.data) {
      return NextResponse.json(
        { error: "Dados de backup não encontrados ou estrutura inválida." },
        { status: 400 }
      );
    }

    // Executa restauração atômica no banco de dados
    const result = await restoreBackupIntoDatabase(backupData, tenantId);

    return NextResponse.json({
      success: true,
      message: "Restauração de backup realizada com sucesso!",
      restoredAt: new Date().toISOString(),
      counts: result.restoredCounts,
    });
  } catch (error: any) {
    console.error("Erro na restauração do backup:", error);
    return NextResponse.json(
      { error: error.message || "Erro crítico ao restaurar dados" },
      { status: 500 }
    );
  }
}
