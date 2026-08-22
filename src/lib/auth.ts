import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "TORQUE_ERP_SECURE_JWT_SECRET_2026_AUTOMOTIVE";

/**
 * Cria hash seguro de senha usando PBKDF2 com Salt criptográfico
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Valida a senha comparando com o hash salvo
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, originalHash] = storedHash.split(":");
  const hash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");
  return hash === originalHash;
}

export interface UserSessionPayload {
  userId: string;
  tenantId: string;
  name: string;
  email: string;
  role: string;
  accessLevel: "ADMIN" | "GERENTE" | "ATENDENTE" | "MECANICO" | "LAVADOR";
  isMaster: boolean;
  workshopName: string;
  plan: string;
  isOwner?: boolean;
  isImpersonating?: boolean;
  impersonatedBy?: string; // E-mail do Master Admin operador
  impersonationExpiresAt?: string; // ISO string de expiração
  impersonationSessionId?: string; // ID da sessão de suporte
}

/**
 * Cria token de sessão assinado padrão (1 ano)
 */
export function createSessionToken(payload: UserSessionPayload): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365; // 365 dias
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");

  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");

  return `${header}.${body}.${signature}`;
}

/**
 * Cria token secundário de curta duração estrita para suporte/personificação (máximo 1 hora)
 */
export function createImpersonationToken(
  payload: UserSessionPayload,
  durationSeconds: number = 3600
): { token: string; expiresAt: Date } {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const now = Date.now();
  const expDate = new Date(now + durationSeconds * 1000);
  const exp = Math.floor(expDate.getTime() / 1000);

  const impersonationPayload: UserSessionPayload = {
    ...payload,
    isImpersonating: true,
    impersonationExpiresAt: expDate.toISOString(),
  };

  const body = Buffer.from(JSON.stringify({ ...impersonationPayload, exp })).toString("base64url");

  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");

  return {
    token: `${header}.${body}.${signature}`,
    expiresAt: expDate,
  };
}

/**
 * Valida e decodifica o token de sessão
 */
export function verifySessionToken(token: string): UserSessionPayload | null {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${body}`)
      .digest("base64url");

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Token expirado
    }

    return payload;
  } catch (err) {
    return null;
  }
}
