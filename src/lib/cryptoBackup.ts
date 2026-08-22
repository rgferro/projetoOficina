import crypto from "crypto";

export interface EncryptedBackupEnvelope {
  format: "AUTOGESTAO_ENCRYPTED_BACKUP_V1";
  cipher: "aes-256-gcm";
  kdf: "pbkdf2-sha512";
  iterations: number;
  salt: string; // hex
  iv: string; // hex
  authTag: string; // hex
  ciphertext: string; // base64
  metadata: {
    appName: string;
    version: string;
    createdAt: string;
    tenantId?: string;
    totalRecords: number;
    checksumSha256: string;
  };
}

export interface BackupDataPayload {
  exportedAt: string;
  version: string;
  appName: string;
  tenantId?: string;
  data: {
    settings?: any[];
    employees?: any[];
    customers?: any[];
    suppliers?: any[];
    products?: any[];
    standardServices?: any[];
    washTickets?: any[];
    serviceOrders?: any[];
    sales?: any[];
    transactions?: any[];
    accountsPayable?: any[];
    accountsReceivable?: any[];
    [key: string]: any;
  };
}

const DEFAULT_ITERATIONS = 100000;
const KEY_LEN = 32; // 256 bits
const IV_LEN = 12; // 96 bits for AES-GCM
const SALT_LEN = 32;

/**
 * Deriva uma chave criptográfica de 256 bits usando PBKDF2 + SHA-512
 */
export function deriveKey(passphrase: string, salt: Buffer, iterations = DEFAULT_ITERATIONS): Buffer {
  return crypto.pbkdf2Sync(passphrase, salt, iterations, KEY_LEN, "sha512");
}

/**
 * Criptografa o dump de dados completo com AES-256-GCM
 */
export function encryptBackupData(
  payload: BackupDataPayload,
  passphrase: string
): { envelope: EncryptedBackupEnvelope; jsonString: string; rawBuffer: Buffer } {
  const jsonContent = JSON.stringify(payload);
  const checksumSha256 = crypto.createHash("sha256").update(jsonContent, "utf8").digest("hex");

  // Conta total de registros para os metadados
  let totalRecords = 0;
  if (payload.data) {
    for (const key of Object.keys(payload.data)) {
      if (Array.isArray(payload.data[key])) {
        totalRecords += payload.data[key].length;
      }
    }
  }

  // Gera salt e IV criptograficamente seguros
  const salt = crypto.randomBytes(SALT_LEN);
  const iv = crypto.randomBytes(IV_LEN);
  const key = deriveKey(passphrase, salt, DEFAULT_ITERATIONS);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertextBuffer = Buffer.concat([cipher.update(jsonContent, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const envelope: EncryptedBackupEnvelope = {
    format: "AUTOGESTAO_ENCRYPTED_BACKUP_V1",
    cipher: "aes-256-gcm",
    kdf: "pbkdf2-sha512",
    iterations: DEFAULT_ITERATIONS,
    salt: salt.toString("hex"),
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
    ciphertext: ciphertextBuffer.toString("base64"),
    metadata: {
      appName: payload.appName || "AutoGestão ERP Oficina",
      version: payload.version || "3.3.0",
      createdAt: new Date().toISOString(),
      tenantId: payload.tenantId,
      totalRecords,
      checksumSha256,
    },
  };

  const jsonString = JSON.stringify(envelope, null, 2);
  const rawBuffer = Buffer.from(jsonString, "utf8");

  return { envelope, jsonString, rawBuffer };
}

/**
 * Descriptografa um arquivo/envelope de backup e valida a integridade com GCM AuthTag e Checksum SHA-256
 */
export function decryptBackupData(
  envelopeOrString: string | Buffer | EncryptedBackupEnvelope,
  passphrase: string
): BackupDataPayload {
  let envelope: EncryptedBackupEnvelope;

  if (typeof envelopeOrString === "string") {
    try {
      envelope = JSON.parse(envelopeOrString);
    } catch {
      throw new Error("Arquivo de backup inválido: não é um JSON reconhecido.");
    }
  } else if (Buffer.isBuffer(envelopeOrString)) {
    try {
      envelope = JSON.parse(envelopeOrString.toString("utf8"));
    } catch {
      throw new Error("Arquivo de backup inválido: formato corrompido.");
    }
  } else {
    envelope = envelopeOrString;
  }

  if (envelope.format !== "AUTOGESTAO_ENCRYPTED_BACKUP_V1" || envelope.cipher !== "aes-256-gcm") {
    throw new Error("Formato de backup não suportado ou arquivo não compatível.");
  }

  const salt = Buffer.from(envelope.salt, "hex");
  const iv = Buffer.from(envelope.iv, "hex");
  const authTag = Buffer.from(envelope.authTag, "hex");
  const ciphertext = Buffer.from(envelope.ciphertext, "base64");

  const key = deriveKey(passphrase, salt, envelope.iterations || DEFAULT_ITERATIONS);

  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    const decryptedBuffer = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    const decryptedJson = decryptedBuffer.toString("utf8");

    // Validação de Checksum SHA-256
    const calculatedChecksum = crypto.createHash("sha256").update(decryptedJson, "utf8").digest("hex");
    if (envelope.metadata?.checksumSha256 && envelope.metadata.checksumSha256 !== calculatedChecksum) {
      throw new Error("Falha de integridade: o checksum do conteúdo descriptografado não confere.");
    }

    const payload: BackupDataPayload = JSON.parse(decryptedJson);
    return payload;
  } catch (err: any) {
    if (err.message?.includes("Unsupported state or unable to authenticate data") || err.code === "ERR_OSSL_EVP_BAD_DECRYPT") {
      throw new Error("Senha ou chave de descriptografia incorreta, ou o arquivo foi corrompido/adulterado.");
    }
    throw err;
  }
}

/**
 * Sanitiza e valida entidades do backup para impedir injection, campos inválidos ou dados maliciosos
 */
export function sanitizeBackupPayload(raw: any, targetTenantId: string): BackupDataPayload {
  if (!raw || typeof raw !== "object" || !raw.data) {
    throw new Error("Estrutura de dados do backup corrompida ou inválida.");
  }

  const sanitized: BackupDataPayload = {
    exportedAt: String(raw.exportedAt || new Date().toISOString()),
    version: String(raw.version || "3.3.0"),
    appName: String(raw.appName || "AutoGestão ERP"),
    tenantId: targetTenantId,
    data: {},
  };

  const sanitizeString = (val: any) => (val === null || val === undefined ? null : String(val).trim());
  const sanitizeNumber = (val: any, def = 0) => {
    const n = Number(val);
    return isNaN(n) ? def : n;
  };
  const sanitizeDate = (val: any) => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  // Clientes
  if (Array.isArray(raw.data.customers)) {
    sanitized.data.customers = raw.data.customers.map((c: any) => ({
      id: sanitizeString(c.id),
      name: sanitizeString(c.name) || "Cliente Sem Nome",
      type: c.type === "PJ" ? "PJ" : "PF",
      phone: sanitizeString(c.phone) || "",
      email: sanitizeString(c.email),
      document: sanitizeString(c.document),
      stateRegistration: sanitizeString(c.stateRegistration),
      birthDate: sanitizeDate(c.birthDate),
      address: sanitizeString(c.address),
      notes: sanitizeString(c.notes),
      tenantId: targetTenantId,
      createdAt: sanitizeDate(c.createdAt) || new Date(),
      updatedAt: sanitizeDate(c.updatedAt) || new Date(),
      vehicles: Array.isArray(c.vehicles)
        ? c.vehicles.map((v: any) => ({
            id: sanitizeString(v.id),
            plate: (sanitizeString(v.plate) || "").toUpperCase(),
            brand: sanitizeString(v.brand) || "",
            model: sanitizeString(v.model) || "",
            year: v.year ? parseInt(v.year) : null,
            color: sanitizeString(v.color),
            currentKm: sanitizeNumber(v.currentKm, 0),
            category: sanitizeString(v.category) || "Hatch / Sedan",
            notes: sanitizeString(v.notes),
            customerId: sanitizeString(c.id),
            tenantId: targetTenantId,
            createdAt: sanitizeDate(v.createdAt) || new Date(),
            updatedAt: sanitizeDate(v.updatedAt) || new Date(),
          }))
        : [],
    }));
  }

  // Funcionários
  if (Array.isArray(raw.data.employees)) {
    sanitized.data.employees = raw.data.employees.map((e: any) => ({
      id: sanitizeString(e.id),
      name: sanitizeString(e.name) || "Funcionário",
      role: sanitizeString(e.role) || "Mecânico",
      accessLevel: sanitizeString(e.accessLevel) || "MECANICO",
      pinCode: sanitizeString(e.pinCode) || "1234",
      email: sanitizeString(e.email),
      phone: sanitizeString(e.phone),
      commissionRate: sanitizeNumber(e.commissionRate, 0),
      active: e.active !== false,
      tenantId: targetTenantId,
      createdAt: sanitizeDate(e.createdAt) || new Date(),
      updatedAt: sanitizeDate(e.updatedAt) || new Date(),
    }));
  }

  // Fornecedores
  if (Array.isArray(raw.data.suppliers)) {
    sanitized.data.suppliers = raw.data.suppliers.map((s: any) => ({
      id: sanitizeString(s.id),
      name: sanitizeString(s.name) || "Fornecedor",
      document: sanitizeString(s.document),
      contactName: sanitizeString(s.contactName),
      phone: sanitizeString(s.phone),
      email: sanitizeString(s.email),
      city: sanitizeString(s.city),
      state: sanitizeString(s.state),
      pixKey: sanitizeString(s.pixKey),
      notes: sanitizeString(s.notes),
      tenantId: targetTenantId,
      createdAt: sanitizeDate(s.createdAt) || new Date(),
    }));
  }

  // Produtos e Estoque
  if (Array.isArray(raw.data.products)) {
    sanitized.data.products = raw.data.products.map((p: any) => ({
      id: sanitizeString(p.id),
      name: sanitizeString(p.name) || "Produto",
      sku: sanitizeString(p.sku),
      brand: sanitizeString(p.brand),
      category: sanitizeString(p.category) || "Geral",
      unit: sanitizeString(p.unit) || "UN",
      costPrice: sanitizeNumber(p.costPrice, 0),
      salePrice: sanitizeNumber(p.salePrice, 0),
      stockQuantity: sanitizeNumber(p.stockQuantity, 0),
      minStock: sanitizeNumber(p.minStock, 0),
      location: sanitizeString(p.location),
      supplierId: sanitizeString(p.supplierId),
      tenantId: targetTenantId,
      createdAt: sanitizeDate(p.createdAt) || new Date(),
      updatedAt: sanitizeDate(p.updatedAt) || new Date(),
    }));
  }

  // Serviços Padrão
  if (Array.isArray(raw.data.standardServices)) {
    sanitized.data.standardServices = raw.data.standardServices.map((s: any) => ({
      id: sanitizeString(s.id),
      name: sanitizeString(s.name) || "Serviço",
      category: sanitizeString(s.category) || "Mecânica Geral",
      defaultPrice: sanitizeNumber(s.defaultPrice, 0),
      estimatedMinutes: sanitizeNumber(s.estimatedMinutes, 30),
      description: sanitizeString(s.description),
      tenantId: targetTenantId,
    }));
  }

  // Ordens de Serviço
  if (Array.isArray(raw.data.serviceOrders)) {
    sanitized.data.serviceOrders = raw.data.serviceOrders.map((so: any) => ({
      id: sanitizeString(so.id),
      orderNumber: sanitizeNumber(so.orderNumber, 1),
      status: sanitizeString(so.status) || "FINALIZADO",
      priority: sanitizeString(so.priority) || "NORMAL",
      complaint: sanitizeString(so.complaint),
      diagnosis: sanitizeString(so.diagnosis),
      notes: sanitizeString(so.notes),
      fuelLevel: sanitizeString(so.fuelLevel),
      currentKm: sanitizeNumber(so.currentKm, 0),
      discount: sanitizeNumber(so.discount, 0),
      totalServices: sanitizeNumber(so.totalServices, 0),
      totalProducts: sanitizeNumber(so.totalProducts, 0),
      totalAmount: sanitizeNumber(so.totalAmount, 0),
      paymentMethod: sanitizeString(so.paymentMethod),
      paidAmount: sanitizeNumber(so.paidAmount, 0),
      isPaid: Boolean(so.isPaid),
      customerId: sanitizeString(so.customerId),
      vehicleId: sanitizeString(so.vehicleId),
      employeeId: sanitizeString(so.employeeId),
      tenantId: targetTenantId,
      createdAt: sanitizeDate(so.createdAt) || new Date(),
      updatedAt: sanitizeDate(so.updatedAt) || new Date(),
      finishedAt: sanitizeDate(so.finishedAt),
      items: Array.isArray(so.items)
        ? so.items.map((it: any) => ({
            id: sanitizeString(it.id),
            type: it.type === "PRODUCT" ? "PRODUCT" : "SERVICE",
            description: sanitizeString(it.description) || "",
            quantity: sanitizeNumber(it.quantity, 1),
            unitPrice: sanitizeNumber(it.unitPrice, 0),
            totalPrice: sanitizeNumber(it.totalPrice, 0),
            serviceId: sanitizeString(it.serviceId),
            productId: sanitizeString(it.productId),
            employeeId: sanitizeString(it.employeeId),
            serviceOrderId: sanitizeString(so.id),
          }))
        : [],
      payments: Array.isArray(so.payments)
        ? so.payments.map((pm: any) => ({
            id: sanitizeString(pm.id),
            method: sanitizeString(pm.method) || "PIX",
            amount: sanitizeNumber(pm.amount, 0),
            installments: sanitizeNumber(pm.installments, 1),
            paidAt: sanitizeDate(pm.paidAt) || new Date(),
            serviceOrderId: sanitizeString(so.id),
          }))
        : [],
    }));
  }

  // Tickets de Lava-Jato
  if (Array.isArray(raw.data.washTickets)) {
    sanitized.data.washTickets = raw.data.washTickets.map((wt: any) => ({
      id: sanitizeString(wt.id),
      ticketNumber: sanitizeNumber(wt.ticketNumber, 1),
      status: sanitizeString(wt.status) || "CONCLUIDO",
      washType: sanitizeString(wt.washType) || "COMPLETA",
      price: sanitizeNumber(wt.price, 0),
      paymentMethod: sanitizeString(wt.paymentMethod) || "PIX",
      isPaid: Boolean(wt.isPaid),
      notes: sanitizeString(wt.notes),
      vehiclePlate: sanitizeString(wt.vehiclePlate) || "",
      vehicleModel: sanitizeString(wt.vehicleModel) || "",
      clientName: sanitizeString(wt.clientName) || "",
      clientPhone: sanitizeString(wt.clientPhone) || "",
      customerId: sanitizeString(wt.customerId),
      vehicleId: sanitizeString(wt.vehicleId),
      employeeId: sanitizeString(wt.employeeId),
      tenantId: targetTenantId,
      createdAt: sanitizeDate(wt.createdAt) || new Date(),
      updatedAt: sanitizeDate(wt.updatedAt) || new Date(),
      finishedAt: sanitizeDate(wt.finishedAt),
    }));
  }

  // Vendas de Balcão
  if (Array.isArray(raw.data.sales)) {
    sanitized.data.sales = raw.data.sales.map((s: any) => ({
      id: sanitizeString(s.id),
      saleNumber: sanitizeNumber(s.saleNumber, 1),
      subtotal: sanitizeNumber(s.subtotal, 0),
      discount: sanitizeNumber(s.discount, 0),
      totalAmount: sanitizeNumber(s.totalAmount, 0),
      paymentMethod: sanitizeString(s.paymentMethod) || "PIX",
      status: sanitizeString(s.status) || "COMPLETED",
      notes: sanitizeString(s.notes),
      customerId: sanitizeString(s.customerId),
      employeeId: sanitizeString(s.employeeId),
      tenantId: targetTenantId,
      createdAt: sanitizeDate(s.createdAt) || new Date(),
      items: Array.isArray(s.items)
        ? s.items.map((it: any) => ({
            id: sanitizeString(it.id),
            description: sanitizeString(it.description) || "",
            quantity: sanitizeNumber(it.quantity, 1),
            unitPrice: sanitizeNumber(it.unitPrice, 0),
            totalPrice: sanitizeNumber(it.totalPrice, 0),
            productId: sanitizeString(it.productId),
            saleId: sanitizeString(s.id),
          }))
        : [],
    }));
  }

  // Transações Financeiras (Fluxo de Caixa)
  if (Array.isArray(raw.data.transactions)) {
    sanitized.data.transactions = raw.data.transactions.map((t: any) => ({
      id: sanitizeString(t.id),
      type: t.type === "EXPENSE" ? "EXPENSE" : "INCOME",
      category: sanitizeString(t.category) || "Outros",
      description: sanitizeString(t.description) || "",
      amount: sanitizeNumber(t.amount, 0),
      paymentMethod: sanitizeString(t.paymentMethod) || "DINHEIRO",
      status: sanitizeString(t.status) || "COMPLETED",
      dueDate: sanitizeDate(t.dueDate),
      paidDate: sanitizeDate(t.paidDate) || new Date(),
      serviceOrderId: sanitizeString(t.serviceOrderId),
      saleId: sanitizeString(t.saleId),
      washTicketId: sanitizeString(t.washTicketId),
      tenantId: targetTenantId,
      createdAt: sanitizeDate(t.createdAt) || new Date(),
    }));
  }

  return sanitized;
}
