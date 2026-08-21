"use client";

import React, { useState, useEffect } from "react";
import {
  formatCurrency,
  formatPlate,
  formatPhone,
  formatDocument,
  formatDateTime,
} from "@/lib/formatters";
import { Printer, ArrowLeft, Wrench, FileText, CheckSquare } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";

export default function ImprimirOSPage() {
  const routeParams = useParams();
  const id = typeof routeParams?.id === "string" ? routeParams.id : Array.isArray(routeParams?.id) ? routeParams.id[0] : "";
  const { currentEmployee } = useAuth();
  const isMechanicOrWasher =
    currentEmployee?.accessLevel === "MECANICO" ||
    currentEmployee?.accessLevel === "LAVADOR";

  // Se for mecânico, o padrão e único modo permitido é a "Via da Oficina / Mecânico"
  const [printMode, setPrintMode] = useState<"MECANICO" | "CLIENTE">(
    isMechanicOrWasher ? "MECANICO" : "MECANICO" // Padrão seguro
  );

  const [order, setOrder] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isMechanicOrWasher) {
      setPrintMode("MECANICO");
    }
  }, [isMechanicOrWasher]);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/oficina/${id}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        }

        const setRes = await fetch("/api/configuracoes");
        if (setRes.ok) {
          const setData = await setRes.json();
          setSettings(setData);
        }
      } catch (err) {
        console.error("Erro ao carregar dados de impressão da OS:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 text-slate-500 font-bold text-sm">
        Carregando comprovante da Ordem de Serviço...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Ordem de Serviço não encontrada.</h2>
        <Link href="/oficina" className="text-blue-600 underline text-xs font-bold">
          ← Voltar para a Oficina
        </Link>
      </div>
    );
  }

  const showFinancials = printMode === "CLIENTE" && !isMechanicOrWasher;
  const remainingBalance = Math.max(0, (order.grandTotal || 0) - (order.paidAmount || 0));

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 print:bg-white print:p-0">
      {/* Barra de Controles na tela (Ocultada na Impressão) */}
      <div className="max-w-4xl mx-auto mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 no-print">
        <Link
          href={`/oficina/${order.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Edição da OS
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Alternador de Via (Apenas para Gerente / Admin / Atendente) */}
          {!isMechanicOrWasher && (
            <div className="flex items-center p-1 bg-slate-200 rounded-xl">
              <button
                type="button"
                onClick={() => setPrintMode("MECANICO")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  printMode === "MECANICO"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Wrench className="w-3.5 h-3.5 text-amber-600" />
                <span>Via do Mecânico (Sem Valores)</span>
              </button>

              <button
                type="button"
                onClick={() => setPrintMode("CLIENTE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  printMode === "CLIENTE"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Via do Cliente (Com Valores)</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Printer className="w-4 h-4" />
            Imprimir / Salvar em PDF
          </button>
        </div>
      </div>

      {/* Documento Formatado (Folha A4 / OS) */}
      <div className="max-w-4xl mx-auto bg-white border border-slate-300 rounded-2xl p-8 shadow-md print:shadow-none print:border-none print:p-0 text-slate-900 font-sans">
        {/* Cabeçalho da Empresa */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
              {settings?.workshopName || "Oficina Mecânica & Auto Center"}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              CNPJ/CPF: {settings?.cnpj || "12.345.678/0001-90"} • WhatsApp: {settings?.phone || "(11) 98765-4321"}
            </p>
            <p className="text-xs text-slate-600">{settings?.address || "Av. Central dos Motores, 1500"}</p>
          </div>

          <div className="text-right">
            <div className="inline-block bg-slate-900 text-white font-mono font-black text-sm px-3 py-1.5 rounded">
              ORDEM DE SERVIÇO Nº {order.osNumber}
            </div>
            <div className="mt-1">
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                showFinancials ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-900"
              }`}>
                {showFinancials ? "VIA DO CLIENTE" : "VIA DE PRODUÇÃO / MECÂNICO"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
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
            <p className="font-bold text-slate-900 text-sm">{order.customer?.name}</p>
            <p className="text-slate-700">
              WhatsApp: <strong>{formatPhone(order.customer?.phone)}</strong>
            </p>
            {order.customer?.document && (
              <p className="text-slate-600">CPF/CNPJ: {formatDocument(order.customer.document)}</p>
            )}
            {order.customer?.address && (
              <p className="text-slate-600 truncate">End.: {order.customer.address}</p>
            )}
          </div>

          <div className="space-y-1">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">
              Dados do Veículo
            </span>
            <p className="font-bold text-slate-900 text-sm">
              {order.vehicle?.brand} {order.vehicle?.model} {order.vehicle?.year ? `(${order.vehicle.year})` : ""}
            </p>
            <p className="text-slate-700">
              Placa: <strong className="font-mono font-black">{formatPlate(order.vehicle?.plate)}</strong>
              {order.entryKm ? ` • KM Entrada: ${order.entryKm.toLocaleString()} km` : ""}
            </p>
            <p className="text-slate-600">
              Mecânico Responsável: <strong>{order.employee?.name || "Equipe Técnica"}</strong>
            </p>
          </div>
        </div>

        {/* Defeito Reclamado x Constatado */}
        {(order.defectClaimed || order.defectFound || order.problemDescription || order.technicalReport) && (
          <div className="py-3 border-b border-slate-200 text-xs grid grid-cols-2 gap-4 bg-slate-50/50 p-2 rounded-xl my-2">
            <div>
              <strong className="text-slate-600 uppercase text-[10px] block">Defeito Reclamado (Cliente):</strong>
              <p className="text-slate-800 italic mt-0.5">
                {order.defectClaimed || order.problemDescription || "Não informado"}
              </p>
            </div>
            <div>
              <strong className="text-slate-600 uppercase text-[10px] block">Laudo Técnico do Mecânico:</strong>
              <p className="text-slate-800 mt-0.5 font-medium">
                {order.defectFound || order.technicalReport || "Em diagnóstico"}
              </p>
            </div>
          </div>
        )}

        {/* Tabela de Itens (Peças e Serviços) */}
        <div className="py-4 space-y-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-800 text-slate-700 font-bold uppercase text-[10px]">
                <th className="py-1.5 w-16">Tipo</th>
                <th className="py-1.5">Descrição do Item / Peça / Mão de Obra</th>
                <th className="py-1.5 text-center w-16">Qtd.</th>
                {showFinancials ? (
                  <>
                    <th className="py-1.5 text-right w-24">Unit. (R$)</th>
                    <th className="py-1.5 text-right w-24">Total (R$)</th>
                  </>
                ) : (
                  <th className="py-1.5 text-center w-32">Checklist / Execução</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {order.items?.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-2.5 text-[11px] font-semibold text-slate-500">
                    {item.type === "PECA" ? "Peça" : "Serviço"}
                  </td>
                  <td className="py-2.5 font-semibold text-slate-900">{item.name}</td>
                  <td className="py-2.5 text-center font-mono font-bold">{item.quantity}</td>
                  {showFinancials ? (
                    <>
                      <td className="py-2.5 text-right font-mono text-slate-700">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(item.totalPrice)}
                      </td>
                    </>
                  ) : (
                    <td className="py-2.5 text-center">
                      <div className="inline-flex items-center gap-1.5 font-mono text-slate-400 text-xs">
                        <span className="w-4 h-4 border-2 border-slate-400 rounded inline-block"></span>
                        <span className="text-[10px] text-slate-500 font-sans">Concluído</span>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Quadro de Totais e Pagamentos (Apenas na Via do Cliente) */}
          {showFinancials && (
            <div className="flex justify-between items-start pt-3 border-t border-slate-200">
              <div className="text-xs space-y-1">
                {order.payments?.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-600 text-[10px] uppercase block">
                      Pagamentos Registrados:
                    </span>
                    {order.payments.map((p: any) => (
                      <div key={p.id} className="text-[11px] text-slate-600">
                        ✓ {formatCurrency(p.amount)} ({p.paymentMethod}) em {formatDateTime(p.date)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Peças:</span>
                  <span className="font-mono font-semibold">{formatCurrency(order.totalParts)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Serviços:</span>
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
                {remainingBalance > 0 && (
                  <div className="flex justify-between font-bold text-red-700 text-xs">
                    <span>SALDO RESTANTE:</span>
                    <span className="font-mono">{formatCurrency(remainingBalance)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Fotos Anexadas */}
        {order.photos?.length > 0 && (
          <div className="py-3 border-t border-slate-200">
            <span className="font-bold text-slate-600 text-[10px] uppercase block mb-2">
              Registro Fotográfico das Avarias / Peças:
            </span>
            <div className="grid grid-cols-4 gap-2">
              {order.photos.slice(0, 4).map((p: any) => (
                <div key={p.id} className="border border-slate-300 rounded p-1 text-center">
                  <img src={p.imageUrl} alt={p.caption || "Foto"} className="w-full h-16 object-cover rounded" />
                  <span className="text-[9px] text-slate-600 block mt-0.5 truncate">{p.caption || p.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Termos de Garantia e Assinaturas */}
        <div className="pt-6 mt-4 border-t border-slate-200 text-[10px] text-slate-500 space-y-6">
          <div>
            <p className="font-bold text-slate-700 uppercase tracking-wider mb-1">
              Termo de Garantia & Condições:
            </p>
            <p>
              Serviços executados e peças aplicadas possuem garantia legal de {settings?.warrantyDays || 90} dias contra defeitos de fabricação ou montagem (Lei 8.078/90). Veículo testado e entregue em perfeitas condições de uso.
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
                {order.customer?.name} (Assinatura do Cliente)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
