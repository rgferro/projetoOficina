import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseNFeXML } from "@/lib/xmlParser";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { xmlContent, defaultProfitMargin, generateAccountPayable } = body;

    if (!xmlContent || typeof xmlContent !== "string") {
      return NextResponse.json({ error: "Conteúdo XML da NF-e é obrigatório" }, { status: 400 });
    }

    const parsed = parseNFeXML(xmlContent);

    if (!parsed.products || parsed.products.length === 0) {
      return NextResponse.json(
        { error: "Nenhum produto válido encontrado no XML da NF-e fornecido." },
        { status: 400 }
      );
    }

    const margin = Number(defaultProfitMargin) || 50.0;

    // 1. Cadastra ou encontra o Fornecedor pelo CNPJ/Nome
    let supplier = null;
    if (parsed.supplier.cnpj || parsed.supplier.name) {
      supplier = await prisma.supplier.findFirst({
        where: parsed.supplier.cnpj
          ? { document: parsed.supplier.cnpj }
          : { name: parsed.supplier.name },
      });

      if (!supplier) {
        supplier = await prisma.supplier.create({
          data: {
            name: parsed.supplier.tradeName || parsed.supplier.name,
            document: parsed.supplier.cnpj || null,
            phone: parsed.supplier.phone || null,
            city: parsed.supplier.city || null,
            state: parsed.supplier.state || null,
            notes: `Cadastrado via importação de NF-e nº ${parsed.invoiceNumber}`,
          },
        });
      }
    }

    const importedResults = [];

    // 2. Itera sobre cada produto do XML
    for (const item of parsed.products) {
      // Tenta encontrar por Código de Barras (EAN) ou por SKU/Nome
      let existingProduct = null;

      if (item.barcode) {
        existingProduct = await prisma.product.findUnique({
          where: { barcode: item.barcode },
        });
      }

      if (!existingProduct && item.sku) {
        existingProduct = await prisma.product.findUnique({
          where: { sku: item.sku },
        });
      }

      if (!existingProduct) {
        existingProduct = await prisma.product.findFirst({
          where: { name: item.name },
        });
      }

      const salePrice = item.costPrice * (1 + margin / 100);

      if (existingProduct) {
        // Atualiza estoque somando a quantidade e atualiza custo
        const updated = await prisma.product.update({
          where: { id: existingProduct.id },
          data: {
            costPrice: item.costPrice,
            salePrice: existingProduct.salePrice || salePrice,
            currentStock: existingProduct.currentStock + item.quantity,
            supplierId: supplier ? supplier.id : existingProduct.supplierId,
            barcode: existingProduct.barcode || item.barcode || null,
            sku: existingProduct.sku || item.sku || null,
          },
        });

        await prisma.stockMovement.create({
          data: {
            productId: updated.id,
            type: "ENTRADA",
            quantity: item.quantity,
            unitCost: item.costPrice,
            description: `Entrada por NF-e nº ${parsed.invoiceNumber}`,
          },
        });

        importedResults.push({
          action: "ATUALIZADO",
          product: updated,
          importedQty: item.quantity,
        });
      } else {
        // Cria novo produto
        const created = await prisma.product.create({
          data: {
            name: item.name,
            sku: item.sku || null,
            barcode: item.barcode || null,
            unit: item.unit || "UN",
            costPrice: item.costPrice,
            profitMargin: margin,
            salePrice: salePrice,
            currentStock: item.quantity,
            minStock: 2,
            supplierId: supplier ? supplier.id : null,
            notes: `Importado via NF-e nº ${parsed.invoiceNumber}`,
            stockMovements: {
              create: [
                {
                  type: "ENTRADA",
                  quantity: item.quantity,
                  unitCost: item.costPrice,
                  description: `Entrada inicial por NF-e nº ${parsed.invoiceNumber}`,
                },
              ],
            },
          },
        });

        importedResults.push({
          action: "CRIADO",
          product: created,
          importedQty: item.quantity,
        });
      }
    }

    // 3. Se solicitado, gera conta a pagar da NF-e
    if (generateAccountPayable && parsed.totalInvoiceAmount > 0) {
      await prisma.accountPayable.create({
        data: {
          description: `Compra de Peças - NF-e nº ${parsed.invoiceNumber} (${parsed.supplier.tradeName || parsed.supplier.name})`,
          category: "PEÇAS",
          amount: parsed.totalInvoiceAmount,
          dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 28 dias padrão
          status: "PENDENTE",
          supplierId: supplier ? supplier.id : null,
          notes: `NF emitida em ${parsed.issueDate}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      invoiceNumber: parsed.invoiceNumber,
      supplierName: parsed.supplier.name,
      totalItemsImported: importedResults.length,
      totalInvoiceAmount: parsed.totalInvoiceAmount,
      results: importedResults,
    });
  } catch (error: any) {
    console.error("Erro na importação de XML:", error);
    return NextResponse.json(
      { error: error.message || "Falha ao processar arquivo XML da NF-e" },
      { status: 500 }
    );
  }
}
