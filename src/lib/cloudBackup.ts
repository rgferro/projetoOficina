import fs from "fs";
import path from "path";
import os from "os";

export interface CloudDetectionResult {
  detected: boolean;
  provider: "Google Drive" | "OneDrive" | "Dropbox" | "Pasta Segura Local";
  folderPath: string;
  lastBackupDate: string | null;
  totalBackups: number;
}

// Procura automaticamente pastas do Google Drive, OneDrive ou Dropbox no Windows do usuário
export function detectCloudFolder(): { provider: "Google Drive" | "OneDrive" | "Dropbox" | "Pasta Segura Local"; folderPath: string } {
  const userHome = os.homedir();

  // 1. Google Drive para Desktop (Unidade G: ou H: ou pasta de usuário)
  const gDriveDrives = ["G:\\Meu Drive", "G:\\My Drive", "H:\\Meu Drive", "H:\\My Drive"];
  for (const drive of gDriveDrives) {
    if (fs.existsSync(drive)) {
      const target = path.join(drive, "AutoGestao_Backups_Oficina");
      return { provider: "Google Drive", folderPath: target };
    }
  }

  const gDriveUserFolder = path.join(userHome, "Google Drive");
  if (fs.existsSync(gDriveUserFolder)) {
    const target = path.join(gDriveUserFolder, "AutoGestao_Backups_Oficina");
    return { provider: "Google Drive", folderPath: target };
  }

  // 2. Microsoft OneDrive (Nativo no Windows 10 e 11)
  const oneDriveEnv = process.env.OneDrive || process.env.OneDriveConsumer;
  if (oneDriveEnv && fs.existsSync(oneDriveEnv)) {
    const target = path.join(oneDriveEnv, "Documentos", "AutoGestao_Backups_Oficina");
    return { provider: "OneDrive", folderPath: target };
  }

  const oneDriveUserFolder = path.join(userHome, "OneDrive");
  if (fs.existsSync(oneDriveUserFolder)) {
    const target = path.join(oneDriveUserFolder, "Documentos", "AutoGestao_Backups_Oficina");
    return { provider: "OneDrive", folderPath: target };
  }

  // 3. Dropbox
  const dropboxFolder = path.join(userHome, "Dropbox");
  if (fs.existsSync(dropboxFolder)) {
    const target = path.join(dropboxFolder, "AutoGestao_Backups_Oficina");
    return { provider: "Dropbox", folderPath: target };
  }

  // 4. Fallback Local Seguro na pasta Documentos
  const localDocs = path.join(userHome, "Documents", "AutoGestao_Backups_Oficina");
  return { provider: "Pasta Segura Local", folderPath: localDocs };
}

// Executa cópia automática em segundo plano
export function performAutoCloudBackup(): { success: boolean; savedPath: string; provider: string } {
  const { provider, folderPath } = detectCloudFolder();
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");

  if (!fs.existsSync(dbPath)) {
    throw new Error("Arquivo de banco de dados SQLite não encontrado");
  }

  // Cria pasta se não existir
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const now = new Date();
  const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const destinationPath = path.join(folderPath, `backup_oficina_${dateStr}.db`);
  const liveSyncPath = path.join(folderPath, `backup_oficina_tempo_real.db`);

  // Copia arquivo diário e arquivo tempo real
  fs.copyFileSync(dbPath, destinationPath);
  fs.copyFileSync(dbPath, liveSyncPath);

  // Limpeza de retenção: mantém os últimos 30 backups diários
  try {
    const files = fs.readdirSync(folderPath).filter((f) => f.startsWith("backup_oficina_") && f.endsWith(".db"));
    if (files.length > 30) {
      files.sort();
      const toDelete = files.slice(0, files.length - 30);
      for (const file of toDelete) {
        fs.unlinkSync(path.join(folderPath, file));
      }
    }
  } catch (err) {
    console.error("Erro na limpeza de retenção de backups:", err);
  }

  return {
    success: true,
    savedPath: destinationPath,
    provider,
  };
}

// Obtém status atual do backup em nuvem
export function getCloudBackupStatus(): CloudDetectionResult {
  const { provider, folderPath } = detectCloudFolder();

  let lastBackupDate: string | null = null;
  let totalBackups = 0;

  if (fs.existsSync(folderPath)) {
    const files = fs.readdirSync(folderPath).filter((f) => f.endsWith(".db"));
    totalBackups = files.length;

    if (files.length > 0) {
      const livePath = path.join(folderPath, "backup_oficina_tempo_real.db");
      if (fs.existsSync(livePath)) {
        const stats = fs.statSync(livePath);
        lastBackupDate = stats.mtime.toISOString();
      } else {
        const latest = files.sort().reverse()[0];
        const stats = fs.statSync(path.join(folderPath, latest));
        lastBackupDate = stats.mtime.toISOString();
      }
    }
  }

  return {
    detected: true,
    provider,
    folderPath,
    lastBackupDate,
    totalBackups,
  };
}
