/**
 * Cliente REST Nativo para Google Drive API v3 (OAuth 2.0 com Princípio do Menor Privilégio)
 * Sem dependências pesadas, 100% nativo com suporte a renovação de tokens e uploads multipart.
 */

export const GOOGLE_DRIVE_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.appdata",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
].join(" ");

export interface GoogleDriveTokens {
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
  email?: string | null;
  name?: string | null;
}

export interface GoogleDriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  createdTime: string;
  modifiedTime: string;
  description?: string;
}

/**
 * Monta a URL de autorização OAuth 2.0 para consentimento do usuário
 */
export function buildGoogleAuthUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_DRIVE_SCOPES);
  url.searchParams.set("access_type", "offline"); // Exige refresh token para renovação automática
  url.searchParams.set("prompt", "consent"); // Força geração de refresh token
  url.searchParams.set("state", params.state);
  return url.toString();
}

/**
 * Troca o código de autorização pelos tokens de acesso e refresh
 */
export async function exchangeCodeForTokens(params: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  expiresAt: Date;
  idToken?: string;
}> {
  const tokenUrl = "https://oauth2.googleapis.com/token";

  const body = new URLSearchParams({
    code: params.code,
    client_id: params.clientId,
    client_secret: params.clientSecret,
    redirect_uri: params.redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Falha ao trocar código de autorização Google: ${errText}`);
  }

  const data = await response.json();
  const expiresIn = data.expires_in || 3600;
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn,
    expiresAt,
    idToken: data.id_token,
  };
}

/**
 * Renova o access_token utilizando o refresh_token salvo
 */
export async function refreshAccessToken(params: {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}): Promise<{ accessToken: string; expiresIn: number; expiresAt: Date }> {
  const tokenUrl = "https://oauth2.googleapis.com/token";

  const body = new URLSearchParams({
    client_id: params.clientId,
    client_secret: params.clientSecret,
    refresh_token: params.refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Falha ao renovar token do Google Drive: ${errText}`);
  }

  const data = await response.json();
  const expiresIn = data.expires_in || 3600;
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  return {
    accessToken: data.access_token,
    expiresIn,
    expiresAt,
  };
}

/**
 * Obtém dados básicos do perfil do usuário autenticado (email, nome)
 */
export async function fetchGoogleProfile(accessToken: string): Promise<{ email: string; name: string }> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    return { email: "", name: "" };
  }

  const data = await res.json();
  return {
    email: data.email || "",
    name: data.name || data.email || "",
  };
}

/**
 * Envia um arquivo criptografado diretamente para o Google Drive via Multipart Upload
 */
export async function uploadFileToGoogleDrive(params: {
  accessToken: string;
  filename: string;
  fileBuffer: Buffer;
  mimeType?: string;
  description?: string;
  folderId?: string;
}): Promise<GoogleDriveFileItem> {
  const boundary = `-------314159265358979323846_${Date.now()}`;
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const mimeType = params.mimeType || "application/octet-stream";

  const metadata: any = {
    name: params.filename,
    mimeType: mimeType,
    description: params.description || "Backup Criptografado AutoGestão ERP",
  };

  if (params.folderId) {
    metadata.parents = [params.folderId];
  }

  const multipartBody = Buffer.concat([
    Buffer.from(
      delimiter +
        "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${mimeType}\r\n` +
        "Content-Transfer-Encoding: base64\r\n\r\n"
    ),
    Buffer.from(params.fileBuffer.toString("base64")),
    Buffer.from(closeDelimiter),
  ]);

  const uploadUrl = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
      "Content-Length": String(multipartBody.length),
    },
    body: multipartBody,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Erro ao enviar arquivo para o Google Drive (${response.status}): ${errText}`);
  }

  const result = await response.json();
  return {
    id: result.id,
    name: result.name,
    mimeType: result.mimeType,
    createdTime: result.createdTime || new Date().toISOString(),
    modifiedTime: result.modifiedTime || new Date().toISOString(),
    description: result.description,
  };
}

/**
 * Lista todos os arquivos de backup gerados no Google Drive
 */
export async function listGoogleDriveBackups(params: {
  accessToken: string;
  pageSize?: number;
}): Promise<GoogleDriveFileItem[]> {
  const url = new URL("https://www.googleapis.com/drive/v3/files");
  url.searchParams.set("pageSize", String(params.pageSize || 30));
  url.searchParams.set(
    "fields",
    "files(id, name, mimeType, size, createdTime, modifiedTime, description)"
  );
  url.searchParams.set("orderBy", "createdTime desc");
  // Filtra por arquivos não excluídos que tenham nome com backup ou extensão .enc/.json/.db
  url.searchParams.set(
    "q",
    "trashed = false and (name contains 'backup' or name contains 'autogestao' or mimeType = 'application/json' or mimeType = 'application/octet-stream')"
  );

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${params.accessToken}` },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Erro ao listar backups do Google Drive (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    size: f.size ? parseInt(f.size, 10) : undefined,
    createdTime: f.createdTime,
    modifiedTime: f.modifiedTime,
    description: f.description,
  }));
}

/**
 * Baixa o conteúdo bruto de um arquivo salvo no Google Drive
 */
export async function downloadGoogleDriveFile(params: {
  accessToken: string;
  fileId: string;
}): Promise<Buffer> {
  const downloadUrl = `https://www.googleapis.com/drive/v3/files/${params.fileId}?alt=media`;

  const response = await fetch(downloadUrl, {
    headers: { Authorization: `Bearer ${params.accessToken}` },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Erro ao baixar arquivo do Google Drive (${response.status}): ${errText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Exclui um arquivo de backup do Google Drive
 */
export async function deleteGoogleDriveFile(params: {
  accessToken: string;
  fileId: string;
}): Promise<boolean> {
  const deleteUrl = `https://www.googleapis.com/drive/v3/files/${params.fileId}`;

  const response = await fetch(deleteUrl, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${params.accessToken}` },
  });

  if (!response.ok && response.status !== 404) {
    const errText = await response.text();
    throw new Error(`Erro ao remover arquivo do Google Drive: ${errText}`);
  }

  return true;
}
