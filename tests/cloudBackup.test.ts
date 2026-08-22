import { describe, it, expect } from "vitest";
import {
  encryptBackupData,
  decryptBackupData,
  sanitizeBackupPayload,
  deriveKey,
  BackupDataPayload,
} from "@/lib/cryptoBackup";
import { buildGoogleAuthUrl, GOOGLE_DRIVE_SCOPES } from "@/lib/googleDrive";

describe("Segurança & Criptografia AES-256-GCM de Backups", () => {
  const samplePayload: BackupDataPayload = {
    exportedAt: new Date().toISOString(),
    version: "3.3.0",
    appName: "AutoGestão ERP Oficina",
    tenantId: "tenant_test_123",
    data: {
      customers: [
        {
          id: "cust_1",
          name: "João da Silva",
          type: "PF",
          phone: "11988887777",
          email: "joao@email.com",
          vehicles: [
            {
              id: "veh_1",
              plate: "ABC1D23",
              brand: "Volkswagen",
              model: "Gol 1.6",
              currentKm: 45000,
            },
          ],
        },
      ],
      serviceOrders: [
        {
          id: "so_1",
          orderNumber: 101,
          status: "FINALIZADO",
          totalAmount: 350.0,
          items: [
            {
              id: "item_1",
              description: "Troca de Óleo",
              quantity: 1,
              unitPrice: 150.0,
              totalPrice: 150.0,
            },
          ],
        },
      ],
    },
  };

  const secretPassphrase = "SenhaSuperSeguraOficina!#2026";

  it("deve derivar uma chave de 256 bits (32 bytes) com PBKDF2 e SHA-512", () => {
    const salt = Buffer.from("0123456789abcdef0123456789abcdef", "hex");
    const key = deriveKey("minhaSenha123", salt, 1000);
    expect(key).toBeInstanceOf(Buffer);
    expect(key.length).toBe(32);
  });

  it("deve criptografar os dados com AES-256-GCM gerando envelope válido", () => {
    const { envelope, jsonString } = encryptBackupData(samplePayload, secretPassphrase);

    expect(envelope.format).toBe("AUTOGESTAO_ENCRYPTED_BACKUP_V1");
    expect(envelope.cipher).toBe("aes-256-gcm");
    expect(envelope.kdf).toBe("pbkdf2-sha512");
    expect(envelope.iterations).toBe(100000);
    expect(envelope.salt).toBeDefined();
    expect(envelope.iv).toBeDefined();
    expect(envelope.authTag).toBeDefined();
    expect(envelope.ciphertext).toBeDefined();
    expect(envelope.metadata.totalRecords).toBe(2);
    expect(envelope.metadata.checksumSha256).toBeDefined();

    // Garante que o payload cifrado não contém texto em claro
    expect(jsonString).not.toContain("João da Silva");
    expect(jsonString).not.toContain("ABC1D23");
  });

  it("deve descriptografar os dados com sucesso quando a senha estiver correta", () => {
    const { envelope } = encryptBackupData(samplePayload, secretPassphrase);
    const decrypted = decryptBackupData(envelope, secretPassphrase);

    expect(decrypted.appName).toBe("AutoGestão ERP Oficina");
    expect(decrypted.data.customers).toHaveLength(1);
    expect(decrypted.data.customers![0].name).toBe("João da Silva");
    expect(decrypted.data.customers![0].vehicles[0].plate).toBe("ABC1D23");
    expect(decrypted.data.serviceOrders![0].totalAmount).toBe(350.0);
  });

  it("deve falhar e rejeitar descriptografia se a senha for incorreta (Anti-Tampering)", () => {
    const { envelope } = encryptBackupData(samplePayload, secretPassphrase);

    expect(() => {
      decryptBackupData(envelope, "SenhaIncorretaErrada123");
    }).toThrow(/Senha ou chave de descriptografia incorreta/);
  });

  it("deve falhar se o ciphertext ou authTag forem adulterados", () => {
    const { envelope } = encryptBackupData(samplePayload, secretPassphrase);

    // Modifica 1 caractere da authTag simulando corrupção ou ataque
    const tamperedAuthTag =
      envelope.authTag[0] === "a" ? "b" + envelope.authTag.slice(1) : "a" + envelope.authTag.slice(1);
    const tamperedEnvelope = { ...envelope, authTag: tamperedAuthTag };

    expect(() => {
      decryptBackupData(tamperedEnvelope, secretPassphrase);
    }).toThrow();
  });
});

describe("Sanitização de Dados e Proteção contra Injection", () => {
  it("deve sanitizar campos e atribuir o tenantId correto para todas as entidades", () => {
    const targetTenantId = "tenant_seguro_456";
    const maliciousRawPayload = {
      exportedAt: "2026-08-22T00:00:00.000Z",
      version: "3.3.0",
      appName: "AutoGestão",
      data: {
        customers: [
          {
            id: "cust_malicious",
            name: "  Cliente Teste <script>alert(1)</script>  ",
            type: "INVALID_TYPE",
            phone: "11999998888",
            tenantId: "tentativa_de_troca_de_tenant",
            vehicles: [
              {
                id: "veh_malicious",
                plate: "abc1d23",
                brand: "Fiat",
                model: "Uno",
                currentKm: "12500", // deve ser convertido para number
              },
            ],
          },
        ],
        products: [
          {
            id: "prod_1",
            name: "Óleo 5W30",
            costPrice: "45.50",
            salePrice: "75.00",
            stockQuantity: "20",
          },
        ],
      },
    };

    const sanitized = sanitizeBackupPayload(maliciousRawPayload, targetTenantId);

    expect(sanitized.tenantId).toBe(targetTenantId);
    expect(sanitized.data.customers![0].tenantId).toBe(targetTenantId);
    expect(sanitized.data.customers![0].type).toBe("PF"); // fallback seguro
    expect(sanitized.data.customers![0].vehicles[0].plate).toBe("ABC1D23"); // uppercase
    expect(sanitized.data.customers![0].vehicles[0].currentKm).toBe(12500); // number
    expect(sanitized.data.products![0].salePrice).toBe(75.0);
    expect(sanitized.data.products![0].stockQuantity).toBe(20);
  });
});

describe("Integração Google Drive OAuth 2.0 (Menor Privilégio)", () => {
  it("deve conter escopos restritos a arquivos do próprio app (drive.appdata e drive.file)", () => {
    expect(GOOGLE_DRIVE_SCOPES).toContain("https://www.googleapis.com/auth/drive.file");
    expect(GOOGLE_DRIVE_SCOPES).toContain("https://www.googleapis.com/auth/drive.appdata");
    // Não deve conter escopos de acesso total a arquivos privados de terceiros
    expect(GOOGLE_DRIVE_SCOPES).not.toContain("https://www.googleapis.com/auth/drive.readonly");
    expect(GOOGLE_DRIVE_SCOPES).not.toContain("https://www.googleapis.com/auth/drive ");
  });

  it("deve montar URL de autorização OAuth 2.0 com offline access e prompt consent", () => {
    const authUrl = buildGoogleAuthUrl({
      clientId: "test-client-id.apps.googleusercontent.com",
      redirectUri: "http://localhost:3000/api/backup/google/callback",
      state: "base64state",
    });

    const parsedUrl = new URL(authUrl);
    expect(parsedUrl.hostname).toBe("accounts.google.com");
    expect(parsedUrl.searchParams.get("client_id")).toBe("test-client-id.apps.googleusercontent.com");
    expect(parsedUrl.searchParams.get("access_type")).toBe("offline");
    expect(parsedUrl.searchParams.get("prompt")).toBe("consent");
    expect(parsedUrl.searchParams.get("response_type")).toBe("code");
  });
});
