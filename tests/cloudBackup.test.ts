import { describe, it, expect } from "vitest";
import { detectCloudFolder, performAutoCloudBackup, getCloudBackupStatus } from "@/lib/cloudBackup";

describe("Cloud Auto-Backup Engine Tests", () => {
  it("deve detectar um provedor de nuvem ou pasta segura local automaticamente", () => {
    const detected = detectCloudFolder();
    expect(detected).toBeDefined();
    expect(["Google Drive", "OneDrive", "Dropbox", "Pasta Segura Local"]).toContain(detected.provider);
    expect(detected.folderPath).toBeDefined();
    expect(typeof detected.folderPath).toBe("string");
  });

  it("deve obter o status da sincronização em nuvem sem erros", () => {
    const status = getCloudBackupStatus();
    expect(status.detected).toBe(true);
    expect(status.folderPath).toBeDefined();
    expect(typeof status.totalBackups).toBe("number");
  });

  it("deve executar cópia de backup com retenção de histórico", () => {
    const result = performAutoCloudBackup();
    expect(result.success).toBe(true);
    expect(result.savedPath).toBeDefined();
    expect(result.provider).toBeDefined();
  });
});
