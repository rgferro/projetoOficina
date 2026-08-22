import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant";
import {
  listBackupsFromDrive,
  downloadAndDecryptDriveBackup,
  getValidGoogleAccessToken,
} from "@/lib/cloudBackup";
import { deleteGoogleDriveFile, downloadGoogleDriveFile } from "@/lib/googleDrive";

export const dynamic = "force-dynamic";

// GET: Lista arquivos de backup salvos no Google Drive do usuário
export async function GET(request: Request) {
  try {
    const { tenantId } = await getTenantContext(request);
    const files = await listBackupsFromDrive(tenantId);
    return NextResponse.json({ success: true, files });
  } catch (error: any) {
    console.error("Erro ao listar arquivos do Google Drive:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao consultar arquivos no Google Drive" },
      { status: 500 }
    );
  }
}

// POST: Ações específicas sobre um arquivo do Drive (Download Direto, Preview ou Exclusão)
export async function POST(request: Request) {
  try {
    const { tenantId } = await getTenantContext(request);
    const body = await request.json().catch(() => ({}));
    const { fileId, action, passphrase } = body;

    if (!fileId) {
      return NextResponse.json({ error: "fileId é obrigatório" }, { status: 400 });
    }

    // 1. Download do arquivo criptografado bruto (.enc) para o navegador
    if (action === "download_raw") {
      const accessToken = await getValidGoogleAccessToken(tenantId);
      const fileBuffer = await downloadGoogleDriveFile({ accessToken, fileId });

      return new NextResponse(new Uint8Array(fileBuffer), {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="backup_drive_${fileId}.enc"`,
        },
      });
    }

    // 2. Exclusão do arquivo do Google Drive
    if (action === "delete") {
      const accessToken = await getValidGoogleAccessToken(tenantId);
      await deleteGoogleDriveFile({ accessToken, fileId });
      return NextResponse.json({ success: true, message: "Backup removido do Google Drive." });
    }

    // 3. Obtenção e Decodificação do Conteúdo para Inspeção/Restauração
    const result = await downloadAndDecryptDriveBackup(tenantId, fileId, passphrase);

    return NextResponse.json({
      success: true,
      isEncrypted: result.isEncrypted,
      payload: result.payload,
      exportedAt: result.payload?.exportedAt,
      appName: result.payload?.appName,
      counts: {
        customers: result.payload?.data?.customers?.length || 0,
        vehicles:
          result.payload?.data?.customers?.reduce(
            (acc: number, c: any) => acc + (c.vehicles?.length || 0),
            0
          ) || 0,
        employees: result.payload?.data?.employees?.length || 0,
        suppliers: result.payload?.data?.suppliers?.length || 0,
        products: result.payload?.data?.products?.length || 0,
        services: result.payload?.data?.standardServices?.length || 0,
        washTickets: result.payload?.data?.washTickets?.length || 0,
        serviceOrders: result.payload?.data?.serviceOrders?.length || 0,
        sales: result.payload?.data?.sales?.length || 0,
        transactions: result.payload?.data?.transactions?.length || 0,
      },
    });
  } catch (error: any) {
    console.error("Erro na operação de arquivo do Google Drive:", error);
    return NextResponse.json(
      { error: error.message || "Falha ao processar arquivo do Google Drive" },
      { status: 400 }
    );
  }
}
