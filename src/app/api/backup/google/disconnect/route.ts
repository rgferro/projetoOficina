import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant";
import { disconnectGoogleDrive, getGoogleDriveStatus } from "@/lib/cloudBackup";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { tenantId } = await getTenantContext(request);
    await disconnectGoogleDrive(tenantId);

    const updated = await getGoogleDriveStatus(tenantId);

    return NextResponse.json({
      success: true,
      message: "Google Drive desconectado com sucesso.",
      status: updated,
    });
  } catch (error: any) {
    console.error("Erro ao desconectar Google Drive:", error);
    return NextResponse.json({ error: error.message || "Erro ao desconectar" }, { status: 500 });
  }
}
