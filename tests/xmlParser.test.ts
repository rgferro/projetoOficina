import { describe, it, expect } from "vitest";
import { parseNFeXML } from "@/lib/xmlParser";

const sampleNFeXML = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35260811222333000144550010000089211000089218">
      <ide>
        <nNF>8921</nNF>
        <dhEmi>2026-08-14T10:00:00-03:00</dhEmi>
      </ide>
      <emit>
        <CNPJ>11222333000144</CNPJ>
        <xNome>DISTRIBUIDORA DE PECAS BRASIL LTDA</xNome>
        <xFant>PECAS BRASIL</xFant>
        <enderEmit>
          <xMun>SAO PAULO</xMun>
          <UF>SP</UF>
          <fone>11977771111</fone>
        </enderEmit>
      </emit>
      <det nItem="1">
        <prod>
          <cProd>PST-FRAS-042</cProd>
          <cEAN>7891234560035</cEAN>
          <xProd>JOGO DE PASTILHAS DE FREIO DIANTEIRA GOL</xProd>
          <NCM>87083090</NCM>
          <uCom>JG</uCom>
          <qCom>4.0000</qCom>
          <vUnCom>95.0000</vUnCom>
          <vProd>380.00</vProd>
        </prod>
      </det>
      <det nItem="2">
        <prod>
          <cProd>OLEO-5W30-MOT</cProd>
          <cEAN>SEM GTIN</cEAN>
          <xProd>OLEO 5W30 SINTETICO MOBIL SUPER 1L</xProd>
          <NCM>27101932</NCM>
          <uCom>L</uCom>
          <qCom>12.0000</qCom>
          <vUnCom>28.5000</vUnCom>
          <vProd>342.00</vProd>
        </prod>
      </det>
    </infNFe>
  </NFe>
</nfeProc>`;

describe("XML NF-e Parser Tests", () => {
  it("deve extrair o número da nota fiscal e dados do fornecedor", () => {
    const parsed = parseNFeXML(sampleNFeXML);

    expect(parsed.invoiceNumber).toBe("8921");
    expect(parsed.supplier.cnpj).toBe("11222333000144");
    expect(parsed.supplier.name).toBe("DISTRIBUIDORA DE PECAS BRASIL LTDA");
    expect(parsed.supplier.tradeName).toBe("PECAS BRASIL");
    expect(parsed.supplier.city).toBe("SAO PAULO");
    expect(parsed.supplier.state).toBe("SP");
    expect(parsed.supplier.phone).toBe("11977771111");
  });

  it("deve extrair todos os itens da nota com quantidade, custo e código de barras", () => {
    const parsed = parseNFeXML(sampleNFeXML);

    expect(parsed.products.length).toBe(2);

    const pastilha = parsed.products[0];
    expect(pastilha.sku).toBe("PST-FRAS-042");
    expect(pastilha.barcode).toBe("7891234560035");
    expect(pastilha.name).toBe("JOGO DE PASTILHAS DE FREIO DIANTEIRA GOL");
    expect(pastilha.unit).toBe("JG");
    expect(pastilha.quantity).toBe(4);
    expect(pastilha.costPrice).toBe(95);
    expect(pastilha.totalPrice).toBe(380);

    const oleo = parsed.products[1];
    expect(oleo.sku).toBe("OLEO-5W30-MOT");
    // "SEM GTIN" deve ser tratado para vazio
    expect(oleo.barcode).toBe("");
    expect(oleo.unit).toBe("L");
    expect(oleo.quantity).toBe(12);
    expect(oleo.costPrice).toBe(28.5);
    expect(oleo.totalPrice).toBe(342);
  });

  it("deve calcular corretamente o total da nota fiscal", () => {
    const parsed = parseNFeXML(sampleNFeXML);
    expect(parsed.totalInvoiceAmount).toBe(722); // 380 + 342
  });
});
