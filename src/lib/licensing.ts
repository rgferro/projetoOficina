import crypto from "crypto";
import fs from "fs";
import path from "path";
import { getFormattedHardwareId, PROJECT_PREFIX } from "./hardwareId";

// Segredo Criptográfico exclusivo DESTE PROJETO (Oficina ERP)
export const PROJECT_ID = "AUTOGESTAO_OFICINA";
export const PROJECT_SECRET = process.env.PROJECT_SECRET || "OFICINA_SECRET_2026_AG_PROD_KEY_9981";

export interface LicenseFileContent {
  hardwareId: string;
  projectId: string;
  licenseKey: string;
  type: "LIFETIME" | "ANNUAL";
  issuedTo?: string;
  activatedAt: string;
  lastCheckedAt?: string;
  gracePeriodExpiresAt?: string;
  signature: string;
}

export interface LicenseStatus {
  isLicensed: boolean;
  hardwareId: string;
  projectId: string;
  licenseType?: "LIFETIME" | "ANNUAL";
  issuedTo?: string;
  activatedAt?: string;
  inGracePeriod?: boolean;
  gracePeriodDaysLeft?: number;
  reason?: string;
}

const LICENSE_FILE_PATH =
  process.env.LICENSE_FILE_PATH || path.join(process.cwd(), ".license");

const GRACE_PERIOD_DAYS = 7;

/**
 * Gera o hash de validação interna da chave a partir do HWID e Segredo do Projeto.
 */
export function computeLicenseKey(
  hardwareId: string,
  projectId: string = PROJECT_ID,
  secret: string = PROJECT_SECRET
): string {
  const cleanHwid = hardwareId.trim().toUpperCase();
  const payload = `${cleanHwid}|${projectId}|LIFETIME`;

  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex").toUpperCase();

  const p1 = hmac.substring(0, 4);
  const p2 = hmac.substring(4, 8);
  const p3 = hmac.substring(8, 12);
  const p4 = hmac.substring(12, 16);

  return `LIC-${PROJECT_PREFIX}-${p1}-${p2}-${p3}-${p4}`;
}

/**
 * Valida se uma Chave de Licença é matematicamente autêntica para o Hardware ID e Projeto.
 */
export function verifyLicenseKey(
  inputKey: string,
  hardwareId: string,
  projectId: string = PROJECT_ID,
  secret: string = PROJECT_SECRET
): boolean {
  if (!inputKey || !hardwareId) return false;

  const expectedKey = computeLicenseKey(hardwareId, projectId, secret);
  const cleanInput = inputKey.trim().toUpperCase().replace(/\s+/g, "");

  return cleanInput === expectedKey;
}

/**
 * Salva o arquivo de licença criptografado no disco local (.license).
 */
export function saveLicenseFile(licenseData: {
  hardwareId: string;
  licenseKey: string;
  issuedTo?: string;
}): void {
  const { hardwareId, licenseKey, issuedTo } = licenseData;

  const content: LicenseFileContent = {
    hardwareId,
    projectId: PROJECT_ID,
    licenseKey,
    type: "LIFETIME",
    issuedTo: issuedTo || "Cliente AutoGestão Oficina",
    activatedAt: new Date().toISOString(),
    signature: crypto
      .createHmac("sha256", PROJECT_SECRET)
      .update(`${hardwareId}:${licenseKey}:${PROJECT_ID}`)
      .digest("hex"),
  };

  fs.writeFileSync(LICENSE_FILE_PATH, JSON.stringify(content, null, 2), "utf8");
}

/**
 * Carrega e valida o arquivo de licença local (.license).
 */
export function loadLicenseFile(): LicenseFileContent | null {
  try {
    if (!fs.existsSync(LICENSE_FILE_PATH)) {
      return null;
    }

    const raw = fs.readFileSync(LICENSE_FILE_PATH, "utf8");
    const data: LicenseFileContent = JSON.parse(raw);

    // Valida integridade do arquivo
    const expectedSignature = crypto
      .createHmac("sha256", PROJECT_SECRET)
      .update(`${data.hardwareId}:${data.licenseKey}:${data.projectId}`)
      .digest("hex");

    if (data.signature !== expectedSignature) {
      console.warn("⚠️ [Licença] Arquivo de licença corrompido ou adulterado.");
      return null;
    }

    return data;
  } catch (err) {
    console.error("Erro ao ler arquivo de licença:", err);
    return null;
  }
}

/**
 * Verifica o status de licenciamento da máquina atual de forma 100% offline.
 */
export function checkLicenseStatus(): LicenseStatus {
  const currentHardwareId = getFormattedHardwareId();
  const fileData = loadLicenseFile();

  if (!fileData) {
    return {
      isLicensed: false,
      hardwareId: currentHardwareId,
      projectId: PROJECT_ID,
      reason: "Nenhuma licença instalada.",
    };
  }

  // Verifica se o Hardware ID da licença bate com o Hardware ID da máquina física atual
  if (fileData.hardwareId !== currentHardwareId) {
    return {
      isLicensed: false,
      hardwareId: currentHardwareId,
      projectId: PROJECT_ID,
      reason: "Licença pertence a outro computador (Hardware ID diferente).",
    };
  }

  // Verifica se a chave é válida para este HWID e Projeto
  const isValid = verifyLicenseKey(
    fileData.licenseKey,
    currentHardwareId,
    fileData.projectId,
    PROJECT_SECRET
  );

  if (!isValid) {
    // Modo Graceful Degradation / Grace Period de 7 dias se a chave foi previamente ativada
    if (fileData.activatedAt) {
      const activatedDate = new Date(fileData.activatedAt);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - activatedDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays <= GRACE_PERIOD_DAYS) {
        const daysLeft = Math.max(1, GRACE_PERIOD_DAYS - diffDays);
        return {
          isLicensed: true,
          hardwareId: currentHardwareId,
          projectId: PROJECT_ID,
          licenseType: fileData.type,
          issuedTo: fileData.issuedTo,
          activatedAt: fileData.activatedAt,
          inGracePeriod: true,
          gracePeriodDaysLeft: daysLeft,
          reason: `Operando em Período de Carência (Grace Period). Restam ${daysLeft} dia(s).`,
        };
      }
    }

    return {
      isLicensed: false,
      hardwareId: currentHardwareId,
      projectId: PROJECT_ID,
      reason: "Chave de licença inválida ou período de carência expirado.",
    };
  }

  return {
    isLicensed: true,
    hardwareId: currentHardwareId,
    projectId: PROJECT_ID,
    licenseType: fileData.type,
    issuedTo: fileData.issuedTo,
    activatedAt: fileData.activatedAt,
  };
}

/**
 * Tenta ativar o sistema com uma chave informada pelo usuário.
 */
export function activateSystem(
  inputKey: string,
  issuedTo?: string
): { success: boolean; message: string; status: LicenseStatus } {
  const currentHardwareId = getFormattedHardwareId();
  const isValid = verifyLicenseKey(inputKey, currentHardwareId, PROJECT_ID, PROJECT_SECRET);

  if (!isValid) {
    return {
      success: false,
      message: "Chave de Licença inválida para este computador. Verifique os dígitos e tente novamente.",
      status: {
        isLicensed: false,
        hardwareId: currentHardwareId,
        projectId: PROJECT_ID,
      },
    };
  }

  saveLicenseFile({
    hardwareId: currentHardwareId,
    licenseKey: inputKey.trim().toUpperCase(),
    issuedTo,
  });

  return {
    success: true,
    message: "Sistema ativado com sucesso! Licença vitalícia registrada.",
    status: {
      isLicensed: true,
      hardwareId: currentHardwareId,
      projectId: PROJECT_ID,
      licenseType: "LIFETIME",
      issuedTo,
      activatedAt: new Date().toISOString(),
    },
  };
}
