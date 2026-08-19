import { NextRequest } from "next/server";
import { prisma } from "./prisma";

/**
 * Extrai o endereço IP real do cliente a partir dos headers padrão de proxy/CDN e conexão direta.
 */
export function getClientIp(req: NextRequest | Request): string {
  try {
    const headers = req.headers;
    
    // 1. Cloudflare
    const cfIp = headers.get("cf-connecting-ip");
    if (cfIp) return cfIp.split(",")[0].trim();

    // 2. Standard X-Forwarded-For
    const xForwardedFor = headers.get("x-forwarded-for");
    if (xForwardedFor) return xForwardedFor.split(",")[0].trim();

    // 3. Nginx / Outros proxies reversos
    const xRealIp = headers.get("x-real-ip");
    if (xRealIp) return xRealIp.split(",")[0].trim();

    // 4. Fallback Localhost
    return "127.0.0.1";
  } catch {
    return "127.0.0.1";
  }
}

/**
 * Extrai o User-Agent (navegador/dispositivo) do cliente
 */
export function getUserAgent(req: NextRequest | Request): string {
  try {
    return req.headers.get("user-agent") || "Unknown";
  } catch {
    return "Unknown";
  }
}

export interface LogAuditParams {
  action: string;
  req: NextRequest | Request;
  tenantId?: string | null;
  userEmail?: string | null;
  details?: any;
}

/**
 * Registra um evento de auditoria e conformidade legal (Marco Civil da Internet Art. 15 e LGPD Art. 7º IX e X)
 */
export async function logAuditEvent({
  action,
  req,
  tenantId,
  userEmail,
  details,
}: LogAuditParams) {
  try {
    const ip = getClientIp(req);
    const userAgent = getUserAgent(req);
    const serializedDetails = details
      ? typeof details === "string"
        ? details
        : JSON.stringify(details)
      : null;

    return await prisma.auditLog.create({
      data: {
        action,
        ip,
        userAgent,
        tenantId: tenantId || null,
        userEmail: userEmail || null,
        details: serializedDetails,
      },
    });
  } catch (err) {
    console.error("[AuditLog Error]", err);
    return null;
  }
}

/**
 * Validação Antifraude por IP:
 * Verifica quantas oficinas foram criadas pelo mesmo IP nas últimas 24 horas.
 * Se mais de 2 oficinas foram criadas no mesmo IP em 24h, bloqueia ou exige verificação extra para evitar criação em massa de contas gratuitas.
 */
export async function checkIpRegistrationAbuse(ip: string): Promise<{
  allowed: boolean;
  count: number;
  reason?: string;
}> {
  // Ignora localhost e IPs locais para desenvolvimento
  if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost") {
    return { allowed: true, count: 0 };
  }

  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  // Conta quantas oficinas foram criadas por esse IP nas últimas 24h
  const count = await prisma.tenant.count({
    where: {
      registrationIp: ip,
      createdAt: { gte: twentyFourHoursAgo },
    },
  });

  // Limite razoável: no máximo 2 oficinas por dia no mesmo IP público
  if (count >= 2) {
    return {
      allowed: false,
      count,
      reason: "Limite de criação de oficinas para este endereço de rede atingido nas últimas 24 horas (máx 2 por rede). Entre em contato com o suporte caso precise de auxílio.",
    };
  }

  return { allowed: true, count };
}

/**
 * Verifica limites de cota mensal do Plano Starter (30 OSs ou 50 Lavagens)
 * Retorna se está permitido ou excedido.
 */
export async function checkTenantMonthlyQuota(
  tenantId: string,
  type: "OS" | "WASH"
): Promise<{
  allowed: boolean;
  plan: string;
  currentCount: number;
  limit: number;
  message?: string;
}> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      plan: true,
      subscriptionStatus: true,
    },
  });

  // Se não encontrar ou for plano pago (PRO, ELITE), cota é ilimitada
  if (!tenant) {
    return { allowed: true, plan: "STARTER", currentCount: 0, limit: 999999 };
  }

  const isStarter = tenant.plan === "STARTER" || tenant.subscriptionStatus !== "active";
  if (!isStarter) {
    return { allowed: true, plan: tenant.plan, currentCount: 0, limit: 999999 };
  }

  // Define o 1º dia do mês corrente (00:00:00)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

  if (type === "OS") {
    const limit = 30; // 30 OSs / mês no plano Starter
    const currentCount = await prisma.serviceOrder.count({
      where: {
        createdAt: { gte: startOfMonth },
      },
    });

    if (currentCount >= limit) {
      return {
        allowed: false,
        plan: tenant.plan,
        currentCount,
        limit,
        message: `Limite mensal atingido (${currentCount}/${limit} Ordens de Serviço neste mês). Faça upgrade para o Plano Pro para criar Ordens de Serviço ilimitadas!`,
      };
    }

    return { allowed: true, plan: tenant.plan, currentCount, limit };
  }

  if (type === "WASH") {
    const limit = 50; // 50 Lavagens / mês no plano Starter
    const currentCount = await prisma.washTicket.count({
      where: {
        createdAt: { gte: startOfMonth },
      },
    });

    if (currentCount >= limit) {
      return {
        allowed: false,
        plan: tenant.plan,
        currentCount,
        limit,
        message: `Limite mensal atingido (${currentCount}/${limit} Lavagens neste mês). Faça upgrade para o Plano Pro para registrar Lavagens ilimitadas!`,
      };
    }

    return { allowed: true, plan: tenant.plan, currentCount, limit };
  }

  return { allowed: true, plan: tenant.plan, currentCount: 0, limit: 999999 };
}
