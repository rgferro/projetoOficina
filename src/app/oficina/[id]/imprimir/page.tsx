import { prisma } from "@/lib/prisma";
import {
  formatCurrency,
  formatPlate,
  formatPhone,
  formatDocument,
  formatDateTime,
} from "@/lib/formatters";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ImprimirOSPage({
  params,
}: {
  params: { id: string };
}) {
  const order = await prisma.serviceOrder.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      vehicle: true,
      employee: true,
      items: true,
    },
  });

  if (!order) {
    notFound();
  }

  const settings = await prisma.workshopSetting.findUnique({
    where: { id: "default" },
  });

  const parts = order.items.filter((i) => i.type === "PECA");
  const services = order.items.filter((i) => i.type === "SERVICO");

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 print:bg-white print:p-0">
      {/* Botões de Ação na tela (escondidos na impressão) */}
      <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between no-print">
        <Link
          href={`/oficina/${order.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Edição
        </Link>

        {/* Script para acionar print window */}
        <button
          onClick={() => {}}
          className="print-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20"
        >
          <Printer className="w-4 h-4" />
          Imprimir / Salvar em PDF
        </button>
      </div>

      {/* Script cliente inline para disparar impressão automática ou com clique */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.querySelector('.print-btn')?.addEventListener('click', function() {
              window.print();
            });
          `,
        }}
      />

      {/* Documento Formatado (Folha A4 / OS) */}
      <div className="max-w-4xl mx-auto bg-white border border-slate-300 rounded-xl p-8 shadow-md print:shadow-none print:border-none print:p-0 print-page text-slate-900 font-sans">
        {/* Cabeçalho da Empresa */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
              {settings?.workshopName || "Oficina Mecânica & Auto Center"}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              CNPJ: {settings?.cnpj || "12.345.678/0001-90"} • WhatsApp: {settings?.phone || "(11) 98765-4321"}
            </p>
            <p className="text-xs text-slate-600">{settings?.address || "Av. Central dos Motores, 1500"}</p>
          </div>

          <div className="text-right">
            <div className="inline-block bg-slate-900 text-white font-mono font-black text-base px-3 py-1 rounded">
              OS Nº {order.osNumber}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Data: {formatDateTime(order.createdAt)}
            </p>
            <p className="text-[11px] font-bold text-blue-700 uppercase">
              Status: {order.status}
            </p>
          </div>
        </div>

        {/* Informações do Cliente e Veículo */}
        <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
          <div className="space-y-1">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">
              Dados do Cliente
            </span>
            <p className="font-bold text-slate-900 text-sm">{order.customer.name}</p>
            <p className="text-slate-700">
              WhatsApp: <strong>{formatPhone(order.customer.phone)}</strong>
            </p>
            {order.customer.document && (
              <p className="text-slate-600">CPF/CNPJ: {formatDocument(order.customer.document)}</p>
            )}
            {order.customer.address && (
              <p className="text-slate-600 truncate">End.: {order.customer.address}</p>
            )}
          </div>

          <div className="space-y-1">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">
              Dados do Veículo
            </span>
            <p className="font-bold text-slate-900 text-sm">
              {order.vehicle.brand} {order.vehicle.model} {order.vehicle.year ? `(${order.vehicle.year})` : ""}
            </p>
            <p className="text-slate-700">
              Placa: <strong className="font-mono">{formatPlate(order.vehicle.plate)}</strong>
              {order.entryKm ? ` • KM Entrada: ${order.entryKm.toLocaleString()} km` : ""}
            </p>
            <p className="text-slate-600">
              Mecânico Responsável: {order.employee?.name || "Oficina Central"}
            </p>
          </div>
        </div>

        {/* Descrição e Diagnóstico */}
        {(order.problemDescription || order.technicalReport) && (
          <div className="py-3 border-b border-slate-200 text-xs space-y-2">
            {order.problemDescription && (
              <div>
                <strong className="text-slate-600 uppercase text-[10px] block">Problema Relatado:</strong>
                <p className="text-slate-800 italic mt-0.5">{order.problemDescription}</p>
              </div>
            )}
            {order.technicalReport && (
              <div>
                <strong className="text-slate-600 uppercase text-[10px] block">Diagnóstico Técnico:</strong>
                <p className="text-slate-800 mt-0.5">{order.technicalReport}</p>
              </div>
            )}
          </div>
        )}

        {/* Tabela de Itens (Peças e Serviços) */}
        <div className="py-4 space-y-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-800 text-slate-700 font-bold uppercase text-[10px]">
                <th className="py-1.5 w-16">Tipo</th>
                <th className="py-1.5">Descrição do Item / Mão de Obra</th>
                <th className="py-1.5 text-center w-16">Qtd.</th>
                <th className="py-1.5 text-right w-24">Unit. (R$)</th>
                <th className="py-1.5 text-right w-24">Total (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-2 text-[11px] font-semibold text-slate-500">
                    {item.type === "PECA" ? "Peça" : "Serviço"}
                  </td>
                  <td className="py-2 font-medium text-slate-800">{item.name}</td>
                  <td className="py-2 text-center font-mono">{item.quantity}</td>
                  <td className="py-2 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-2 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(item.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Quadro de Totais */}
          <div className="flex justify-end pt-2">
            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Peças:</span>
                <span className="font-mono font-semibold">{formatCurrency(order.totalParts)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Mão de Obra:</span>
                <span className="font-mono font-semibold">{formatCurrency(order.totalServices)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-red-600 font-semibold">
                  <span>Desconto:</span>
                  <span className="font-mono">- {formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t-2 border-slate-900 pt-1.5 text-sm font-black text-slate-900">
                <span>VALOR TOTAL:</span>
                <span className="font-mono">{formatCurrency(order.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Termos de Garantia e Assinaturas */}
        <div className="pt-8 mt-4 border-t border-slate-200 text-[10px] text-slate-500 space-y-6">
          <div>
            <p className="font-bold text-slate-700 uppercase tracking-wider mb-1">
              Termo de Garantia & Condições:
            </p>
            <p>
              Serviços e peças aplicadas possuem garantia legal de {settings?.warrantyDays || 90} dias contra defeitos de fabricação ou montagem, conforme Código de Defesa do Consumidor (Lei 8.078/90). A garantia não cobre mau uso, sobrecarga, acidentes ou intervenção de terceiros.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12 pt-8 text-center text-xs font-semibold text-slate-700">
            <div>
              <div className="border-t border-slate-800 w-full pt-1.5">
                {settings?.workshopName || "Oficina Mecânica"} (Responsável Técnico)
              </div>
            </div>
            <div>
              <div className="border-t border-slate-800 w-full pt-1.5">
                {order.customer.name} (Assinatura do Cliente)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
