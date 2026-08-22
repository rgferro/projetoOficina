import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant";
import { buildGoogleAuthUrl } from "@/lib/googleDrive";
import { getGoogleClientCredentials } from "@/lib/cloudBackup";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { tenantId } = await getTenantContext(request);
    const { searchParams, origin } = new URL(request.url);

    const customClientId = searchParams.get("clientId");
    const customClientSecret = searchParams.get("clientSecret");

    const credentials = await getGoogleClientCredentials(tenantId);
    const effectiveClientId = customClientId || credentials.clientId;

    if (!effectiveClientId) {
      return NextResponse.json(
        {
          error: "Google Client ID não configurado.",
          instructions:
            "Para conectar sua conta do Google Drive, configure o Client ID do Google Cloud Console ou informe suas credenciais na tela de configurações.",
        },
        { status: 400 }
      );
    }

    const redirectUri = `${origin}/api/backup/google/callback`;
    const state = JSON.stringify({ tenantId, returnUrl: "/configuracoes" });

    const authUrl = buildGoogleAuthUrl({
      clientId: effectiveClientId,
      redirectUri,
      state: Buffer.from(state).toString("base64"),
    });

    const isJsonRequested = request.headers.get("accept")?.includes("application/json");
    if (isJsonRequested) {
      return NextResponse.json({ authUrl, redirectUri });
    }

    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error("Erro ao gerar URL OAuth Google Drive:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
