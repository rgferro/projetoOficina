export interface ParsedNFeProduct {
  sku: string;
  barcode: string;
  name: string;
  unit: string;
  quantity: number;
  costPrice: number;
  totalPrice: number;
  ncm: string;
}

export interface ParsedNFe {
  invoiceNumber: string;
  issueDate: string;
  supplier: {
    cnpj: string;
    name: string;
    tradeName: string;
    phone?: string;
    city?: string;
    state?: string;
  };
  products: ParsedNFeProduct[];
  totalInvoiceAmount: number;
}

function extractTagValue(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : "";
}

function extractAllTags(xml: string, tagName: string): string[] {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "gi");
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

export function parseNFeXML(xmlContent: string): ParsedNFe {
  // Dados da Nota
  const invoiceNumber = extractTagValue(xmlContent, "nNF") || "000000";
  const issueDate = extractTagValue(xmlContent, "dhEmi") || new Date().toISOString();

  // Dados do Emitente / Fornecedor
  const emitBlock = extractTagValue(xmlContent, "emit");
  const supplierCnpj = extractTagValue(emitBlock, "CNPJ") || extractTagValue(emitBlock, "CPF");
  const supplierName = extractTagValue(emitBlock, "xNome") || "Fornecedor da NF-e";
  const supplierTradeName = extractTagValue(emitBlock, "xFant") || supplierName;
  
  const enderEmit = extractTagValue(emitBlock, "enderEmit");
  const supplierCity = extractTagValue(enderEmit, "xMun");
  const supplierState = extractTagValue(enderEmit, "UF");
  const supplierPhone = extractTagValue(enderEmit, "fone");

  // Itens de Produtos (<det>)
  const detBlocks = extractAllTags(xmlContent, "det");
  const products: ParsedNFeProduct[] = [];
  let totalInvoiceAmount = 0;

  for (const det of detBlocks) {
    const prodBlock = extractTagValue(det, "prod");
    if (!prodBlock) continue;

    const sku = extractTagValue(prodBlock, "cProd") || "";
    let barcode = extractTagValue(prodBlock, "cEAN") || "";
    if (barcode === "SEM GTIN" || barcode === "SEM_GTIN") barcode = "";

    const name = extractTagValue(prodBlock, "xProd") || "Produto";
    const unit = extractTagValue(prodBlock, "uCom") || "UN";
    const quantity = parseFloat(extractTagValue(prodBlock, "qCom")) || 1;
    const costPrice = parseFloat(extractTagValue(prodBlock, "vUnCom")) || 0;
    const totalPrice = parseFloat(extractTagValue(prodBlock, "vProd")) || quantity * costPrice;
    const ncm = extractTagValue(prodBlock, "NCM") || "";

    totalInvoiceAmount += totalPrice;

    products.push({
      sku,
      barcode,
      name,
      unit: unit.toUpperCase(),
      quantity,
      costPrice,
      totalPrice,
      ncm,
    });
  }

  return {
    invoiceNumber,
    issueDate,
    supplier: {
      cnpj: supplierCnpj,
      name: supplierName,
      tradeName: supplierTradeName,
      phone: supplierPhone,
      city: supplierCity,
      state: supplierState,
    },
    products,
    totalInvoiceAmount,
  };
}
