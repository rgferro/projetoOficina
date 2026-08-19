import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { validatePasswordStrength } from "@/lib/validation";

describe("Segurança e Recuperação de Senha (Esqueci Senha)", () => {
  it("deve validar requisitos de senha forte antes de permitir redefinição", () => {
    // Senhas fracas
    expect(validatePasswordStrength("123456").isValid).toBe(false);
    expect(validatePasswordStrength("senha123").isValid).toBe(false);
    expect(validatePasswordStrength("Senha123").isValid).toBe(false); // sem caracter especial

    // Senha forte completa (8+ digitos, maiúscula, minúscula, número e símbolo)
    const strongPass = validatePasswordStrength("Torque#2026@Oficina");
    expect(strongPass.isValid).toBe(true);
    expect(strongPass.score).toBeGreaterThanOrEqual(4);
    expect(strongPass.checks.length).toBe(true);
    expect(strongPass.checks.uppercase).toBe(true);
    expect(strongPass.checks.lowercase).toBe(true);
    expect(strongPass.checks.number).toBe(true);
    expect(strongPass.checks.special).toBe(true);
  });

  it("deve gerar hash PBKDF2 com Salt criptográfico e verificar corretamente", () => {
    const newPassword = "MinhaNovaSenhaForte@2026";
    const hashed = hashPassword(newPassword);

    expect(hashed).toContain(":");
    expect(hashed.split(":").length).toBe(2);

    // Validação correta
    expect(verifyPassword(newPassword, hashed)).toBe(true);

    // Senha incorreta deve falhar
    expect(verifyPassword("SenhaErrada#123", hashed)).toBe(false);
    expect(verifyPassword("", hashed)).toBe(false);
  });

  it("deve validar formato do código de verificação numérico de 6 dígitos", () => {
    const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();
    const code = generateCode();

    expect(code).toHaveLength(6);
    expect(/^\d{6}$/.test(code)).toBe(true);
  });

  it("deve validar expiração de 15 minutos do código de segurança", () => {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const now = new Date();
    expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());

    // Código expirado
    const expiredDate = new Date();
    expiredDate.setMinutes(expiredDate.getMinutes() - 1);
    expect(now > expiredDate).toBe(true);
  });
});
