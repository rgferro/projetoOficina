import { NextResponse } from "next/server";
import { exchangeCodeForTokens, fetchGoogleProfile } from "@/lib/googleDrive";
import { getGoogleClientCredentials, saveGoogleOAuthTokens } from "@/lib/cloudBackup";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const stateEncoded = searchParams.get("state");

  let tenantId = "default";
  let returnUrl = "/configuracoes";

  if (stateEncoded) {
    try {
      const decoded = JSON.parse(Buffer.from(stateEncoded, "base64").toString("utf8"));
      tenantId = decoded.tenantId || tenantId;
      returnUrl = decoded.returnUrl || returnUrl;
    } catch {
      // Ignora erro de parse
    }
  }

  if (error) {
    console.error("Google OAuth Error:", error);
    return NextResponse.redirect(`${origin}${returnUrl}?gdrive_error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}${returnUrl}?gdrive_error=missing_code`);
  }

  try {
    const redirectUri = `${origin}/api/backup/google/callback`;
    const { clientId, clientSecret } = await getGoogleClientCredentials(tenantId);

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        `${origin}${returnUrl}?gdrive_error=missing_credentials`
      );
    }

    const tokens = await exchangeCodeForTokens({
      code,
      clientId,
      clientSecret,
      redirectUri,
    });

    const profile = await fetchGoogleProfile(tokens.accessToken);

    await saveGoogleOAuthTokens(tenantId, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      email: profile.email,
      name: profile.name,
    });

    return NextResponse.redirect(`${origin}${returnUrl}?gdrive_status=connected&email=${encodeURIComponent(profile.email || "")}`);
  } catch (err: any) {
    console.error("Erro no callback OAuth do Google Drive:", err);
    return NextResponse.redirect(
      `${origin}${returnUrl}?gdrive_error=${encodeURIComponent(err.message || "auth_failed")}`
    );
  }
}
