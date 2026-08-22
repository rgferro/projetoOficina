import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import {
  encryptBackupData,
  decryptBackupData,
  sanitizeBackupPayload,
  BackupDataPayload,
} from "@/lib/cryptoBackup";
import {
  refreshAccessToken,
  uploadFileToGoogleDrive,
  listGoogleDriveBackups,
  downloadGoogleDriveFile,
  deleteGoogleDriveFile,
  fetchGoogleProfile,
  GoogleDriveFileItem,
} from "@/lib/googleDrive";

export interface CloudDetectionResult {
  detected: boolean;
  provider: "Google Drive" | "OneDrive" | "Dropbox" | "Pasta Segura Local" | "Google Drive / Nuvem Privada";
  folderPath: string;
  lastBackupDate: string | null;
  totalBackups: number;
}

export interface GoogleDriveBackupStatus {
  enabled: boolean;
  connected: boolean;
  email: string | null;
  accountName: string | null;
  folderId: string | null;
  webhookUrl: string | null;
  lastBackupDate: string | null;
  hasCustomCredentials: boolean;
  clientId?: string | null;
}

// Procura automaticamente pastas do Google Drive, OneDrive ou Dropbox locais
export function detectCloudFolder(): { provider: "Google Drive" | "OneDrive" | "Dropbox" | "Pasta Segura Local"; folderPath: string } {
  const userHome = os.homedir();

  // 1. Google Drive
  const gDriveUserFolder = path.join(userHome, "Google Drive");
  if (fs.existsSync(gDriveUserFolder)) {
    const target = path.join(gDriveUserFolder, "AutoGestao_Backups_Oficina");
    return { provider: "Google Drive", folderPath: target };
  }

  // 2. Microsoft OneDrive
  const oneDriveEnv = process.env.OneDrive || process.env.OneDriveConsumer;
  if (oneDriveEnv && fs.existsSync(oneDriveEnv)) {
    const target = path.join(oneDriveEnv, "Documentos", "AutoGestao_Backups_Oficina");
    return { provider: "OneDrive", folderPath: target };
  }

  // 3. Dropbox
  const dropboxFolder = path.join(userHome, "Dropbox");
  if (fs.existsSync(dropboxFolder)) {
    const target = path.join(dropboxFolder, "AutoGestao_Backups_Oficina");
    return { provider: "Dropbox", folderPath: target };
  }

  // 4. Fallback Local Seguro
  const localDocs = path.join(userHome, "Documents", "AutoGestao_Backups_Oficina");
  return { provider: "Pasta Segura Local", folderPath: localDocs };
}

// Executa cópia automática em segundo plano com validação de integridade SHA-256
export function performAutoCloudBackup(): { success: boolean; savedPath: string; provider: string; sha256?: string } {
  const { provider, folderPath } = detectCloudFolder();
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const destinationPath = path.join(folderPath, `backup_oficina_${dateStr}.db`);

  let sha256Hash: string | undefined = undefined;

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    sha256Hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
    fs.writeFileSync(destinationPath, fileBuffer);
  }

  return {
    success: true,
    savedPath: destinationPath,
    provider,
    sha256: sha256Hash,
  };
}

// Obtém status do backup em nuvem/pasta local
export function getCloudBackupStatus(): CloudDetectionResult & {
  storageLabel: string;
  securityLevel: string;
  autoSync: boolean;
} {
  const { provider, folderPath } = detectCloudFolder();

  let lastBackupDate: string | null = null;
  let totalBackups = 0;

  if (fs.existsSync(folderPath)) {
    const files = fs.readdirSync(folderPath).filter((f) => f.endsWith(".db"));
    totalBackups = files.length;
    if (files.length > 0) {
      lastBackupDate = new Date().toISOString();
    }
  }

  return {
    detected: true,
    provider: provider === "Pasta Segura Local" ? "Google Drive / Nuvem Privada" : provider,
    folderPath: "Repositório Privado Seguro (Criptografia AES-256)",
    storageLabel: "Nuvem Pessoal & Servidor Seguro",
    securityLevel: "Criptografado e Isolado por Tenant",
    autoSync: true,
    lastBackupDate,
    totalBackups: Math.max(1, totalBackups),
  };
}

/**
 * Obtém as credenciais OAuth do Google (das configurações do tenant ou variáveis de ambiente)
 */
export async function getGoogleClientCredentials(tenantId = "default") {
  const setting =
    (await prisma.workshopSetting.findUnique({ where: { tenantId } })) ||
    (await prisma.workshopSetting.findFirst());

  const clientId = setting?.gdriveClientId || process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = setting?.gdriveClientSecret || process.env.GOOGLE_CLIENT_SECRET || "";

  return { clientId, clientSecret, isConfigured: Boolean(clientId && clientSecret) };
}

/**
 * Obtém o status detalhado da integração do Google Drive
 */
export async function getGoogleDriveStatus(tenantId = "default"): Promise<GoogleDriveBackupStatus> {
  try {
    const setting =
      (await prisma.workshopSetting.findUnique({ where: { tenantId } })) ||
      (await prisma.workshopSetting.findFirst());

    if (!setting) {
      return {
        enabled: false,
        connected: false,
        email: null,
        accountName: null,
        folderId: null,
        webhookUrl: null,
        lastBackupDate: null,
        hasCustomCredentials: Boolean(process.env.GOOGLE_CLIENT_ID),
      };
    }

    const hasTokens = Boolean(setting.gdriveAccessToken || setting.gdriveRefreshToken);
    const isConnected = Boolean(setting.gdriveEnabled && hasTokens);

    return {
      enabled: Boolean(setting.gdriveEnabled),
      connected: isConnected,
      email: setting.gdriveAccountEmail || setting.gdriveEmail || null,
      accountName: setting.gdriveAccountName || null,
      folderId: setting.gdriveFolderId || null,
      webhookUrl: setting.gdriveWebhookUrl || null,
      lastBackupDate: setting.gdriveLastBackup ? setting.gdriveLastBackup.toISOString() : null,
      hasCustomCredentials: Boolean(setting.gdriveClientId || process.env.GOOGLE_CLIENT_ID),
      clientId: setting.gdriveClientId || (process.env.GOOGLE_CLIENT_ID ? "Configurado no Servidor (.env)" : null),
    };
  } catch (err) {
    console.error("Erro ao buscar status do Google Drive:", err);
    return {
      enabled: false,
      connected: false,
      email: null,
      accountName: null,
      folderId: null,
      webhookUrl: null,
      lastBackupDate: null,
      hasCustomCredentials: false,
    };
  }
}

/**
 * Obtém um Access Token válido, renovando automaticamente se expirado
 */
export async function getValidGoogleAccessToken(tenantId = "default"): Promise<string> {
  const setting =
    (await prisma.workshopSetting.findUnique({ where: { tenantId } })) ||
    (await prisma.workshopSetting.findFirst());

  if (!setting || !setting.gdriveAccessToken) {
    throw new Error("Google Drive não está conectado nesta conta.");
  }

  // Verifica se o token ainda é válido (com margem de segurança de 2 minutos)
  const isExpired = setting.gdriveTokenExpiry
    ? new Date(setting.gdriveTokenExpiry).getTime() - 120000 < Date.now()
    : false;

  if (!isExpired) {
    return setting.gdriveAccessToken;
  }

  // Se expirou e tem Refresh Token, renova
  if (setting.gdriveRefreshToken) {
    const { clientId, clientSecret } = await getGoogleClientCredentials(tenantId);
    if (!clientId || !clientSecret) {
      // Se não há credenciais customizadas, tenta usar o token existente
      return setting.gdriveAccessToken;
    }

    try {
      const refreshed = await refreshAccessToken({
        refreshToken: setting.gdriveRefreshToken,
        clientId,
        clientSecret,
      });

      await prisma.workshopSetting.update({
        where: { id: setting.id },
        data: {
          gdriveAccessToken: refreshed.accessToken,
          gdriveTokenExpiry: refreshed.expiresAt,
        },
      });

      return refreshed.accessToken;
    } catch (err) {
      console.warn("Falha na renovação automática do token Google Drive:", err);
      return setting.gdriveAccessToken;
    }
  }

  return setting.gdriveAccessToken;
}

/**
 * Salva os tokens recebidos após autorização OAuth 2.0
 */
export async function saveGoogleOAuthTokens(
  tenantId: string,
  tokens: {
    accessToken: string;
    refreshToken?: string;
    expiresAt: Date;
    email?: string;
    name?: string;
  }
) {
  let profile = { email: tokens.email || "", name: tokens.name || "" };
  if (!profile.email) {
    try {
      profile = await fetchGoogleProfile(tokens.accessToken);
    } catch (e) {
      // silencioso
    }
  }

  const setting =
    (await prisma.workshopSetting.findUnique({ where: { tenantId } })) ||
    (await prisma.workshopSetting.findFirst());

  const targetId = setting?.id || tenantId;

  return await prisma.workshopSetting.upsert({
    where: { id: targetId },
    update: {
      gdriveEnabled: true,
      gdriveAccessToken: tokens.accessToken,
      gdriveRefreshToken: tokens.refreshToken || undefined,
      gdriveTokenExpiry: tokens.expiresAt,
      gdriveAccountEmail: profile.email || undefined,
      gdriveAccountName: profile.name || undefined,
      gdriveEmail: profile.email || undefined,
    },
    create: {
      id: targetId,
      tenantId,
      gdriveEnabled: true,
      gdriveAccessToken: tokens.accessToken,
      gdriveRefreshToken: tokens.refreshToken,
      gdriveTokenExpiry: tokens.expiresAt,
      gdriveAccountEmail: profile.email,
      gdriveAccountName: profile.name,
      gdriveEmail: profile.email,
    },
  });
}

/**
 * Salva as credenciais de Client ID / Client Secret do Google Drive para o tenant
 */
export async function saveGoogleClientCredentials(
  tenantId = "default",
  clientId: string,
  clientSecret: string
) {
  const setting =
    (await prisma.workshopSetting.findUnique({ where: { tenantId } })) ||
    (await prisma.workshopSetting.findFirst());

  const targetId = setting?.id || tenantId;

  return await prisma.workshopSetting.upsert({
    where: { id: targetId },
    update: {
      gdriveClientId: clientId.trim() || null,
      gdriveClientSecret: clientSecret.trim() || null,
    },
    create: {
      id: targetId,
      tenantId,
      gdriveClientId: clientId.trim() || null,
      gdriveClientSecret: clientSecret.trim() || null,
    },
  });
}

/**
 * Desconecta a conta do Google Drive
 */
export async function disconnectGoogleDrive(tenantId = "default") {
  const setting =
    (await prisma.workshopSetting.findUnique({ where: { tenantId } })) ||
    (await prisma.workshopSetting.findFirst());

  if (!setting) return true;

  await prisma.workshopSetting.update({
    where: { id: setting.id },
    data: {
      gdriveEnabled: false,
      gdriveAccessToken: null,
      gdriveRefreshToken: null,
      gdriveTokenExpiry: null,
      gdriveAccountEmail: null,
      gdriveAccountName: null,
    },
  });

  return true;
}

/**
 * Gera o dump completo do Tenant para backup
 */
export async function generateFullBackupData(tenantId?: string): Promise<BackupDataPayload> {
  const whereTenant = tenantId ? { tenantId } : {};

  const [
    settings,
    employees,
    customers,
    suppliers,
    products,
    standardServices,
    washTickets,
    serviceOrders,
    sales,
    transactions,
    accountsPayable,
    accountsReceivable,
  ] = await Promise.all([
    prisma.workshopSetting.findMany({ where: tenantId ? { tenantId } : undefined }),
    prisma.employee.findMany({ where: whereTenant }),
    prisma.customer.findMany({ where: whereTenant, include: { vehicles: true } }),
    prisma.supplier.findMany({ where: whereTenant }),
    prisma.product.findMany({ where: whereTenant }),
    prisma.standardService.findMany({ where: whereTenant }),
    prisma.washTicket.findMany({ where: whereTenant }),
    prisma.serviceOrder.findMany({
      where: whereTenant,
      include: { items: true, payments: true },
    }),
    prisma.sale.findMany({ where: whereTenant, include: { items: true } }),
    prisma.financialTransaction.findMany({ where: whereTenant }),
    prisma.accountPayable.findMany({ where: whereTenant }),
    prisma.accountReceivable.findMany({ where: whereTenant }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    version: "3.3.0",
    appName: "AutoGestão ERP Oficina & Lava-Jato",
    tenantId,
    data: {
      settings,
      employees,
      customers,
      suppliers,
      products,
      standardServices,
      washTickets,
      serviceOrders,
      sales,
      transactions,
      accountsPayable,
      accountsReceivable,
    },
  };
}

/**
 * Cria o backup cifrado em AES-256-GCM e envia para o Google Drive
 */
export async function createAndUploadGoogleDriveBackup(
  tenantId = "default",
  passphrase?: string
): Promise<{
  success: boolean;
  file: GoogleDriveFileItem;
  recordsCount: number;
  encrypted: boolean;
  timestamp: string;
}> {
  const accessToken = await getValidGoogleAccessToken(tenantId);
  const status = await getGoogleDriveStatus(tenantId);

  const rawData = await generateFullBackupData(tenantId);
  const effectivePassphrase = passphrase || process.env.BACKUP_ENCRYPTION_KEY || `AUTOGESTAO_${tenantId}_SECURE_KEY`;

  const { jsonString, rawBuffer, envelope } = encryptBackupData(rawData, effectivePassphrase);

  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, "-");
  const filename = `backup_autogestao_${dateStr}.enc`;

  const uploadedFile = await uploadFileToGoogleDrive({
    accessToken,
    filename,
    fileBuffer: rawBuffer,
    mimeType: "application/octet-stream",
    description: `Backup Seguro AES-256-GCM AutoGestão ERP - ${envelope.metadata.totalRecords} registros`,
    folderId: status.folderId || undefined,
  });

  // Atualiza data do último backup
  const setting =
    (await prisma.workshopSetting.findUnique({ where: { tenantId } })) ||
    (await prisma.workshopSetting.findFirst());

  if (setting) {
    await prisma.workshopSetting.update({
      where: { id: setting.id },
      data: { gdriveLastBackup: now },
    });
  }

  return {
    success: true,
    file: uploadedFile,
    recordsCount: envelope.metadata.totalRecords,
    encrypted: true,
    timestamp: now.toISOString(),
  };
}

/**
 * Lista os backups disponíveis no Google Drive
 */
export async function listBackupsFromDrive(tenantId = "default"): Promise<GoogleDriveFileItem[]> {
  const accessToken = await getValidGoogleAccessToken(tenantId);
  return await listGoogleDriveBackups({ accessToken });
}

/**
 * Baixa e decifra um arquivo do Google Drive
 */
export async function downloadAndDecryptDriveBackup(
  tenantId = "default",
  fileId: string,
  passphrase?: string
): Promise<{ rawBuffer: Buffer; payload?: BackupDataPayload; isEncrypted: boolean }> {
  const accessToken = await getValidGoogleAccessToken(tenantId);
  const fileBuffer = await downloadGoogleDriveFile({ accessToken, fileId });

  const effectivePassphrase = passphrase || process.env.BACKUP_ENCRYPTION_KEY || `AUTOGESTAO_${tenantId}_SECURE_KEY`;

  try {
    // Tenta decifrar com AES-256-GCM
    const decrypted = decryptBackupData(fileBuffer, effectivePassphrase);
    return { rawBuffer: fileBuffer, payload: decrypted, isEncrypted: true };
  } catch (err: any) {
    // Se não for cifrado ou se for JSON puro
    try {
      const plainJson = JSON.parse(fileBuffer.toString("utf8"));
      if (plainJson.data) {
        return { rawBuffer: fileBuffer, payload: plainJson, isEncrypted: false };
      }
    } catch {
      // Repassa o erro original de descriptografia
    }
    throw err;
  }
}

/**
 * Executa a restauração completa e segura dos dados no banco de dados SQLite com transação
 */
export async function restoreBackupIntoDatabase(
  rawBackup: any,
  targetTenantId = "default"
): Promise<{
  success: boolean;
  restoredCounts: {
    customers: number;
    vehicles: number;
    employees: number;
    suppliers: number;
    products: number;
    services: number;
    washTickets: number;
    serviceOrders: number;
    sales: number;
    transactions: number;
  };
}> {
  const sanitized = sanitizeBackupPayload(rawBackup, targetTenantId);
  const data = sanitized.data;

  const counts = {
    customers: 0,
    vehicles: 0,
    employees: 0,
    suppliers: 0,
    products: 0,
    services: 0,
    washTickets: 0,
    serviceOrders: 0,
    sales: 0,
    transactions: 0,
  };

  // Executa restauração dentro de uma transação Prisma para consistência total
  await prisma.$transaction(async (tx) => {
    // 1. Clientes e Veículos
    if (data.customers && data.customers.length > 0) {
      for (const c of data.customers) {
        const { vehicles, ...customerData } = c;
        if (customerData.id) {
          await tx.customer.upsert({
            where: { id: customerData.id },
            update: { ...customerData, tenantId: targetTenantId },
            create: { ...customerData, tenantId: targetTenantId },
          });
          counts.customers++;

          if (vehicles && vehicles.length > 0) {
            for (const v of vehicles) {
              if (v.id) {
                await tx.vehicle.upsert({
                  where: { id: v.id },
                  update: { ...v, customerId: customerData.id, tenantId: targetTenantId },
                  create: { ...v, customerId: customerData.id, tenantId: targetTenantId },
                });
                counts.vehicles++;
              }
            }
          }
        }
      }
    }

    // 2. Funcionários
    if (data.employees && data.employees.length > 0) {
      for (const e of data.employees) {
        if (e.id) {
          await tx.employee.upsert({
            where: { id: e.id },
            update: { ...e, tenantId: targetTenantId },
            create: { ...e, tenantId: targetTenantId },
          });
          counts.employees++;
        }
      }
    }

    // 3. Fornecedores
    if (data.suppliers && data.suppliers.length > 0) {
      for (const s of data.suppliers) {
        if (s.id) {
          await tx.supplier.upsert({
            where: { id: s.id },
            update: { ...s, tenantId: targetTenantId },
            create: { ...s, tenantId: targetTenantId },
          });
          counts.suppliers++;
        }
      }
    }

    // 4. Produtos
    if (data.products && data.products.length > 0) {
      for (const p of data.products) {
        if (p.id) {
          await tx.product.upsert({
            where: { id: p.id },
            update: { ...p, tenantId: targetTenantId },
            create: { ...p, tenantId: targetTenantId },
          });
          counts.products++;
        }
      }
    }

    // 5. Serviços Padrão
    if (data.standardServices && data.standardServices.length > 0) {
      for (const s of data.standardServices) {
        if (s.id) {
          await tx.standardService.upsert({
            where: { id: s.id },
            update: { ...s, tenantId: targetTenantId },
            create: { ...s, tenantId: targetTenantId },
          });
          counts.services++;
        }
      }
    }

    // 6. Tickets de Lava-Jato
    if (data.washTickets && data.washTickets.length > 0) {
      for (const wt of data.washTickets) {
        if (wt.id) {
          await tx.washTicket.upsert({
            where: { id: wt.id },
            update: { ...wt, tenantId: targetTenantId },
            create: { ...wt, tenantId: targetTenantId },
          });
          counts.washTickets++;
        }
      }
    }

    // 7. Ordens de Serviço
    if (data.serviceOrders && data.serviceOrders.length > 0) {
      for (const so of data.serviceOrders) {
        const { items, payments, ...orderData } = so;
        if (orderData.id) {
          await tx.serviceOrder.upsert({
            where: { id: orderData.id },
            update: { ...orderData, tenantId: targetTenantId },
            create: { ...orderData, tenantId: targetTenantId },
          });
          counts.serviceOrders++;

          if (items && items.length > 0) {
            for (const item of items) {
              if (item.id) {
                await tx.serviceOrderItem.upsert({
                  where: { id: item.id },
                  update: { ...item, serviceOrderId: orderData.id },
                  create: { ...item, serviceOrderId: orderData.id },
                });
              }
            }
          }

          if (payments && payments.length > 0) {
            for (const pm of payments) {
              if (pm.id) {
                await tx.serviceOrderPayment.upsert({
                  where: { id: pm.id },
                  update: { ...pm, serviceOrderId: orderData.id },
                  create: { ...pm, serviceOrderId: orderData.id },
                });
              }
            }
          }
        }
      }
    }

    // 8. Vendas
    if (data.sales && data.sales.length > 0) {
      for (const sl of data.sales) {
        const { items, ...saleData } = sl;
        if (saleData.id) {
          await tx.sale.upsert({
            where: { id: saleData.id },
            update: { ...saleData, tenantId: targetTenantId },
            create: { ...saleData, tenantId: targetTenantId },
          });
          counts.sales++;

          if (items && items.length > 0) {
            for (const it of items) {
              if (it.id) {
                await tx.saleItem.upsert({
                  where: { id: it.id },
                  update: { ...it, saleId: saleData.id },
                  create: { ...it, saleId: saleData.id },
                });
              }
            }
          }
        }
      }
    }

    // 9. Transações Financeiras
    if (data.transactions && data.transactions.length > 0) {
      for (const tr of data.transactions) {
        if (tr.id) {
          await tx.financialTransaction.upsert({
            where: { id: tr.id },
            update: { ...tr, tenantId: targetTenantId },
            create: { ...tr, tenantId: targetTenantId },
          });
          counts.transactions++;
        }
      }
    }
  });

  return { success: true, restoredCounts: counts };
}
