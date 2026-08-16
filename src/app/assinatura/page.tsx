"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  QrCode,
  CheckCircle2,
  Sparkles,
  Zap,
  Users,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  Clock,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { SAAS_PLANS } from "@/lib/mercadopago";

export default function AssinaturaPage() {
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [extraSeats, setExtraSeats] = useState(1);

  const fetchSubscription = async () => {
    try {
      const res = await fetch("/api/subscription/status");
      const data = await res.json();
      if (data.success) {
        setTenantInfo(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handleGeneratePix = async (planId: string, seats: number = 0) => {
    setActionLoading(`pix_${planId}`);
    try {
      const res = await fetch("/api/subscription/create-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, seatsCount: seats }),
      });
      const data = await res.json();
      if (data.success) {
        setPixData(data);
        setIsPixModalOpen(true);
      } else {
        alert(data.error || "Erro ao gerar PIX");
      }
    } catch (e: any) {
      alert(e.message || "Erro de conexão ao gerar PIX");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCardSubscription = async (planId: string) => {
    setActionLoading(`card_${planId}`);
    try {
      const res = await fetch("/api/subscription/create-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.success && data.initPoint) {
        window.location.href = data.initPoint;
      } else {
        alert(data.error || "Erro ao iniciar checkout do cartão");
      }
    } catch (e: any) {
      alert(e.message || "Erro de conexão com Mercado Pago");
    } finally {
      setActionLoading(null);
    }
  };

  const copyPixCode = () => {
    if (!pixData?.qrCode) return;
    navigator.clipboard.writeText(pixData.qrCode);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  const tenant = tenantInfo?.tenant;
  const currentPlan = tenant?.plan || "STARTER";
  const maxUsers = tenant?.maxUsers || 2;
  const currentUsers = tenant?.currentUsersCount || 1;

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      {/* Top Banner de Status da Assinatura */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold">
            <Zap className="w-3.5 h-3.5" />
            Torque ERP • Gestão de Assinatura & Usuários
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Plano Atual: <span className="text-amber-400">{tenant?.planName || "Starter (Grátis)"}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Sua oficina está utilizando <strong className="text-white">{currentUsers} de {maxUsers} usuários</strong> permitidos. Faça upgrade para liberar ordens de serviço ilimitadas, CRM WhatsApp e mais acessos.
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl flex items-center gap-4 text-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-slate-400 font-medium">Assentos da Equipe:</div>
            <div className="text-base font-black text-white">
              {currentUsers} / {maxUsers} Ativos
            </div>
          </div>
        </div>
      </div>

      {/* Grade de Planos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Plano Starter */}
        <div
          className={`bg-white rounded-3xl p-6 sm:p-8 border-2 transition-all space-y-6 flex flex-col justify-between ${
            currentPlan === "STARTER"
              ? "border-emerald-500 shadow-lg shadow-emerald-500/10"
              : "border-slate-200"
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                Starter (Isca)
              </span>
              {currentPlan === "STARTER" && (
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                </span>
              )}
            </div>

            <div>
              <div className="text-3xl font-black text-slate-900">R$ 0,00</div>
              <p className="text-xs text-slate-500 mt-1">Gratuito para começar</p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Ideal para oficinas autônomas que desejam organizar as primeiras operações.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-700 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Até <strong>2 Usuários</strong> (Dono + 1 Operador)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Até 30 Ordens de Serviço/mês</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Até 50 Lavagens de Veículos/mês</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>PDV Balcão & Caixa Básico</span>
              </li>
            </ul>
          </div>

          <button
            disabled
            className="w-full py-3 rounded-2xl bg-slate-100 text-slate-500 text-xs font-bold cursor-default"
          >
            {currentPlan === "STARTER" ? "Plano em Uso" : "Incluído"}
          </button>
        </div>

        {/* Plano Oficina Pro (Recomendado) */}
        <div
          className={`bg-white rounded-3xl p-6 sm:p-8 border-2 transition-all space-y-6 flex flex-col justify-between relative shadow-xl ${
            currentPlan === "PRO"
              ? "border-blue-600 shadow-blue-500/20"
              : "border-blue-500 hover:border-blue-600"
          }`}
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] uppercase tracking-widest font-black px-4 py-1 rounded-full shadow-md">
            🔥 Mais Escolhido
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                Oficina Pro
              </span>
              {currentPlan === "PRO" && (
                <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                </span>
              )}
            </div>

            <div>
              <div className="text-3xl font-black text-slate-900">
                R$ 69,90 <span className="text-xs font-bold text-slate-500">/ mês</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Cobrança via PIX ou Cartão</p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              O pacote completo para pequenas e médias oficinas crescerem com velocidade.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-700 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>Até <strong>4 Usuários</strong> com controle de perfis</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span><strong>Ordens de Serviço Ilimitadas</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span><strong>Lava-Jato & Kanban Ilimitados</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>CRM WhatsApp Automático (Revisão de Óleo)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>Importação de Notas Fiscais XML (NF-e)</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => handleGeneratePix("PRO")}
              disabled={actionLoading === "pix_PRO"}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              {actionLoading === "pix_PRO" ? "Gerando..." : "Assinar com PIX (R$ 69,90)"}
            </button>

            <button
              onClick={() => handleCardSubscription("PRO")}
              disabled={actionLoading === "card_PRO"}
              className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-all"
            >
              <CreditCard className="w-4 h-4 text-slate-600" />
              Assinatura Recorrente no Cartão
            </button>
          </div>
        </div>

        {/* Plano Oficina Elite */}
        <div
          className={`bg-white rounded-3xl p-6 sm:p-8 border-2 transition-all space-y-6 flex flex-col justify-between ${
            currentPlan === "ELITE"
              ? "border-purple-600 shadow-purple-500/20"
              : "border-slate-200 hover:border-purple-300"
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black px-3 py-1 rounded-full bg-purple-100 text-purple-700">
                Oficina Elite
              </span>
              {currentPlan === "ELITE" && (
                <span className="text-[11px] font-bold text-purple-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                </span>
              )}
            </div>

            <div>
              <div className="text-3xl font-black text-slate-900">
                R$ 129,90 <span className="text-xs font-bold text-slate-500">/ mês</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Para grandes centros automotivos</p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Potência máxima para centros automotivos com equipe robusta e alto volume.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-700 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span>Até <strong>8 Usuários Inclusos</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span>Multi-Caixas e Múltiplos Turnos</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span>Relatórios Avançados de BI e Produtividade</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span>Suporte Prioritário VIP</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => handleGeneratePix("ELITE")}
              disabled={actionLoading === "pix_ELITE"}
              className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 transition-all active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              {actionLoading === "pix_ELITE" ? "Gerando..." : "Assinar com PIX (R$ 129,90)"}
            </button>

            <button
              onClick={() => handleCardSubscription("ELITE")}
              disabled={actionLoading === "card_ELITE"}
              className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-all"
            >
              <CreditCard className="w-4 h-4 text-slate-600" />
              Cartão Recorrente
            </button>
          </div>
        </div>
      </div>

      {/* Pacote de Usuários Adicionais */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Expansão de Equipe
          </span>
          <h3 className="text-xl font-bold text-slate-900">
            Precisa de mais usuários além do seu plano?
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Adicione assentos extras para mecânicos, atendentes ou lavadores por apenas <strong>R$ 14,90 / mês</strong> cada.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExtraSeats((prev) => Math.max(1, prev - 1))}
              className="w-8 h-8 rounded-xl bg-white border border-slate-300 font-bold text-sm text-slate-700 flex items-center justify-center hover:bg-slate-100"
            >
              -
            </button>
            <span className="w-8 text-center font-black text-sm text-slate-900">
              {extraSeats}
            </span>
            <button
              onClick={() => setExtraSeats((prev) => prev + 1)}
              className="w-8 h-8 rounded-xl bg-white border border-slate-300 font-bold text-sm text-slate-700 flex items-center justify-center hover:bg-slate-100"
            >
              +
            </button>
          </div>

          <button
            onClick={() => handleGeneratePix("EXTRA_SEAT", extraSeats)}
            disabled={actionLoading === "pix_EXTRA_SEAT"}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 whitespace-nowrap shadow-md transition-all"
          >
            <QrCode className="w-4 h-4 text-amber-400" />
            Adicionar por R$ {(extraSeats * 14.9).toFixed(2).replace(".", ",")}
          </button>
        </div>
      </div>

      {/* Modal PIX Dinâmico com QR Code */}
      {isPixModalOpen && pixData && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 text-center animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                Pagamento Instantâneo
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                Pague via PIX no Mercado Pago
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Valor: <strong className="text-slate-900">R$ {Number(pixData.amount).toFixed(2).replace(".", ",")}</strong> • {pixData.planName}
              </p>
            </div>

            {/* Imagem do QR Code */}
            {pixData.qrCodeBase64 && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 inline-block mx-auto shadow-inner">
                <img
                  src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                  alt="QR Code PIX Mercado Pago"
                  className="w-48 h-48 mx-auto"
                />
              </div>
            )}

            {/* Chave Copia e Cola */}
            <div className="space-y-2 text-left">
              <label className="text-[11px] font-bold text-slate-600">
                Chave PIX Copia e Cola:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={pixData.qrCode}
                  className="w-full text-xs font-mono bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-slate-700 select-all"
                />
                <button
                  type="button"
                  onClick={copyPixCode}
                  className="px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors flex-shrink-0"
                >
                  {pixCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {pixCopied ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-tight">
              ⚡ A aprovação é automática em segundos. Assim que o pagamento for confirmado, seu plano será atualizado na hora!
            </p>

            <button
              onClick={() => {
                setIsPixModalOpen(false);
                fetchSubscription();
              }}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
