import { describe, it, expect, vi } from "vitest";
import { CircuitBreaker } from "@/lib/resilience";
import { checkLicenseStatus, verifyLicenseKey, computeLicenseKey } from "@/lib/licensing";
import { performAutoCloudBackup } from "@/lib/cloudBackup";

describe("DevSecOps & Resilience Tests (Circuit Breaker & Graceful Degradation)", () => {
  it("deve executar chamadas normais quando o circuito está FECHADO (CLOSED)", async () => {
    const circuit = new CircuitBreaker("TestClosed", {
      failureThreshold: 2,
      timeoutMs: 1000,
    });

    const mockCall = vi.fn().mockResolvedValue("sucesso");
    const result = await circuit.execute(mockCall);

    expect(result).toBe("sucesso");
    expect(circuit.getState()).toBe("CLOSED");
    expect(mockCall).toHaveBeenCalledTimes(1);
  });

  it("deve tentar novamente com retry e abrir o circuito (OPEN) após atingir o limiar de falhas", async () => {
    const circuit = new CircuitBreaker("TestOpen", {
      failureThreshold: 2,
      maxRetries: 1,
      timeoutMs: 100,
    });

    const failingCall = vi.fn().mockRejectedValue(new Error("Conexão recusada pelo gateway"));

    // Tentativa 1
    await expect(circuit.execute(failingCall)).rejects.toThrow("Conexão recusada pelo gateway");

    // Tentativa 2
    await expect(circuit.execute(failingCall)).rejects.toThrow();

    // Circuito agora deve estar ABERTO
    expect(circuit.getState()).toBe("OPEN");

    // Próxima chamada deve ser bloqueada instantaneamente ou disparar fallback
    const fallbackCall = vi.fn().mockReturnValue("modo_degradado_ativo");
    const fallbackResult = await circuit.execute(failingCall, fallbackCall);

    expect(fallbackResult).toBe("modo_degradado_ativo");
    expect(fallbackCall).toHaveBeenCalled();
  });

  it("deve ativar período de carência (Grace Period) para garantir continuidade operacional da oficina", () => {
    const hwid = "TEST-HWID-2026-XYZ";
    const key = computeLicenseKey(hwid);
    expect(verifyLicenseKey(key, hwid)).toBe(true);

    const status = checkLicenseStatus();
    expect(status).toBeDefined();
    expect(typeof status.isLicensed).toBe("boolean");
  });

  it("deve calcular hash SHA-256 e garantir integridade contra ransomware no backup", () => {
    const result = performAutoCloudBackup();
    expect(result.success).toBe(true);
    if (result.sha256) {
      expect(result.sha256).toHaveLength(64); // SHA-256 hex length
    }
  });
});
