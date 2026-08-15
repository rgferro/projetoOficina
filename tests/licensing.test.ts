import { describe, it, expect } from "vitest";
import { getFormattedHardwareId, PROJECT_PREFIX } from "@/lib/hardwareId";
import {
  computeLicenseKey,
  verifyLicenseKey,
  PROJECT_ID,
  PROJECT_SECRET,
} from "@/lib/licensing";

describe("Módulo de Licenciamento Criptográfico por Hardware ID (100% Offline)", () => {
  it("deve gerar um Hardware ID válido e formatado para a máquina atual", () => {
    const hwid = getFormattedHardwareId();
    expect(hwid).toBeDefined();
    expect(hwid).toMatch(new RegExp(`^${PROJECT_PREFIX}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$`));
  });

  it("deve gerar uma Chave de Licença válida no padrão LIC-OFC-XXXX-XXXX-XXXX-XXXX", () => {
    const hwid = "OFC-8821-49F2-C091";
    const key = computeLicenseKey(hwid, PROJECT_ID, PROJECT_SECRET);

    expect(key).toBeDefined();
    expect(key).toMatch(/^LIC-OFC-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it("deve validar com sucesso a chave quando o Hardware ID e Segredo forem correspondentes", () => {
    const hwid = "OFC-8821-49F2-C091";
    const key = computeLicenseKey(hwid, PROJECT_ID, PROJECT_SECRET);

    const isValid = verifyLicenseKey(key, hwid, PROJECT_ID, PROJECT_SECRET);
    expect(isValid).toBe(true);
  });

  it("deve REJEITAR a chave se ela for usada em outro Hardware ID (outro computador)", () => {
    const hwidPC1 = "OFC-1111-2222-3333";
    const hwidPC2 = "OFC-9999-8888-7777";

    const keyForPC1 = computeLicenseKey(hwidPC1, PROJECT_ID, PROJECT_SECRET);

    const isValidOnPC2 = verifyLicenseKey(keyForPC1, hwidPC2, PROJECT_ID, PROJECT_SECRET);
    expect(isValidOnPC2).toBe(false);
  });

  it("deve REJEITAR a chave se o projeto ou segredo forem diferentes (isolamento por projeto)", () => {
    const hwid = "OFC-8821-49F2-C091";

    const keyOficina = computeLicenseKey(hwid, "AUTOGESTAO_OFICINA", "SECRET_OFICINA");
    const isValidOnSalao = verifyLicenseKey(keyOficina, hwid, "AUTOGESTAO_SALAO", "SECRET_SALAO");

    expect(isValidOnSalao).toBe(false);
  });

  it("deve ser insensível a espaços em branco acidentais e maiúsculas/minúsculas", () => {
    const hwid = "OFC-8821-49F2-C091";
    const key = computeLicenseKey(hwid, PROJECT_ID, PROJECT_SECRET);

    const validCaseInsensitive = verifyLicenseKey(`  ${key.toLowerCase()}  `, hwid);
    expect(validCaseInsensitive).toBe(true);
  });
});
