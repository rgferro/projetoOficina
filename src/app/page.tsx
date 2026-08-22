"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Zap,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Droplets,
  Wrench,
  ShoppingCart,
  MessageSquare,
  Sparkles,
  Check,
  X,
  BarChart3,
  Flame,
  Award,
  ChevronDown,
  TrendingUp,
} from "lucide-react";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"oficina" | "lavajato" | "gestao">("oficina");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showFloatingCta, setShowFloatingCta] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== "undefined") {
        setShowFloatingCta(window.scrollY > 600);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="space-y-24 pb-20 font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* 🚀 1. HERO SECTION & PROPOSTA DE VALOR */}
      <section className="relative pt-6 sm:pt-12 pb-8 text-center max-w-5xl mx-auto space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-700 text-xs font-extrabold shadow-sm animate-pulse">
          <Flame className="w-4 h-4 text-amber-500 fill-current" />
          <span>O ERP Automotivo Mais Moderno do Brasil • 100% na Nuvem</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.15]">
          Transforme sua Oficina Mecânica ou Lava-Jato em um Negócio{" "}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 bg-clip-text text-transparent">
            Organizado e Altamente Lucrativo
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Controle ordens de serviço com fotos de avarias, gerencie o pátio em Kanban e envie{" "}
          <strong className="text-slate-900 font-bold">avisos automáticos no WhatsApp</strong> do cliente. Sem instalação, sem complexidade e sem precisar de cartão de crédito.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            href="/cadastro"
            className="w-full sm:w-auto px-9 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-base shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 active:scale-95"
          >
            <Sparkles className="w-5 h-5 text-amber-300 fill-current" />
            <span>Criar Conta Grátis</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="#como-funciona"
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-sm border border-slate-300 shadow-sm flex items-center justify-center gap-2 transition-all hover:border-slate-400"
          >
            <span>Ver Como Funciona</span>
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 pt-2 text-xs font-bold text-slate-600">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Configuração em 2 minutos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Conexão SSL 256-bit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-purple-600" />
            <span>Backups em Nuvem (Google Drive)</span>
          </div>
        </div>

        {/* MOCKUP INTERATIVO */}
        <div className="pt-6">
          <div className="relative mx-auto max-w-5xl rounded-3xl bg-slate-900 p-2 sm:p-4 shadow-2xl ring-1 ring-slate-900/10">
            <div className="rounded-2xl bg-slate-950 p-4 sm:p-6 text-left border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs text-slate-400 font-mono ml-2">
                    app.torquerp.com.br/dashboard
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  WhatsApp Conectado
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Coluna 1: Lava-Jato */}
                <div className="bg-slate-900/90 rounded-2xl p-4 border border-cyan-900/40 space-y-3">
                  <div className="flex items-center justify-between font-bold text-cyan-400">
                    <span className="flex items-center gap-1.5">
                      <Droplets className="w-4 h-4" /> Lava-Jato • Pátio
                    </span>
                    <span className="bg-cyan-500/20 px-2 py-0.5 rounded-full text-[10px]">
                      3 Carros
                    </span>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-1.5">
                    <div className="flex justify-between font-bold text-white">
                      <span>Honda Civic • BRA2E19</span>
                      <span className="text-emerald-400">Pronto</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Lavagem Completa + Cera</p>
                    <div className="text-[10px] text-emerald-300 font-mono bg-emerald-950/80 p-1.5 rounded-lg border border-emerald-800 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Aviso enviado no WhatsApp do Cliente!
                    </div>
                  </div>
                </div>

                {/* Coluna 2: Oficina Mecânica */}
                <div className="bg-slate-900/90 rounded-2xl p-4 border border-amber-900/40 space-y-3">
                  <div className="flex items-center justify-between font-bold text-amber-400">
                    <span className="flex items-center gap-1.5">
                      <Wrench className="w-4 h-4" /> Oficina • Em Execução
                    </span>
                    <span className="bg-amber-500/20 px-2 py-0.5 rounded-full text-[10px]">
                      4 OS Ativas
                    </span>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-1.5">
                    <div className="flex justify-between font-bold text-white">
                      <span>Toyota Corolla • OS #1042</span>
                      <span className="text-amber-400">R$ 1.450,00</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Troca de Pastilhas & Discos (4 Fotos Anexadas)</p>
                    <div className="text-[10px] text-blue-300 font-mono bg-blue-950/80 p-1.5 rounded-lg border border-blue-800">
                      Mecânico: Carlos Silva (Comissão: 10%)
                    </div>
                  </div>
                </div>

                {/* Coluna 3: Caixa & Financeiro */}
                <div className="bg-slate-900/90 rounded-2xl p-4 border border-emerald-900/40 space-y-3">
                  <div className="flex items-center justify-between font-bold text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4" /> Caixa de Hoje
                    </span>
                    <span className="text-emerald-400 font-mono font-bold">+18.4%</span>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-2">
                    <div className="text-2xl font-black text-emerald-400 font-mono">
                      R$ 4.890,00
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400">
                      <div>PIX: R$ 3.200,00</div>
                      <div>Cartão: R$ 1.690,00</div>
                    </div>
                    <div className="text-[10px] text-slate-300 bg-slate-700/60 p-1 rounded text-center">
                      Caixa Aberto • Turno Manhã
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 2. DIFERENCIAIS DA PLATAFORMA */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-lg max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          <div className="space-y-1">
            <div className="text-xl sm:text-2xl font-black text-blue-600 flex items-center justify-center gap-1.5">
              <Zap className="w-5 h-5" /> 100% Web
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              Sem instalação, acesse no celular ou PC
            </div>
          </div>

          <div className="space-y-1 pt-4 sm:pt-0">
            <div className="text-xl sm:text-2xl font-black text-emerald-600 flex items-center justify-center gap-1.5">
              <MessageSquare className="w-5 h-5" /> WhatsApp
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              Avisos automáticos de status e orçamento
            </div>
          </div>

          <div className="space-y-1 pt-4 sm:pt-0">
            <div className="text-xl sm:text-2xl font-black text-amber-500 flex items-center justify-center gap-1.5">
              <Sparkles className="w-5 h-5 fill-current" /> Grátis
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              Plano Starter Grátis sem cartão
            </div>
          </div>

          <div className="space-y-1 pt-4 sm:pt-0">
            <div className="text-xl sm:text-2xl font-black text-indigo-600 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-5 h-5" /> Seguro
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              Dados protegidos e backups diários
            </div>
          </div>
        </div>
      </section>

      {/* 🛠️ COMO FUNCIONA EM 3 PASSOS */}
      <section id="como-funciona" className="max-w-5xl mx-auto space-y-8 scroll-mt-24">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-[11px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200">
            Simplicidade & Velocidade
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Como funciona em 3 passos simples
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Sem treinamentos chatos ou sistemas complicados. Você e sua equipe começam a usar no primeiro minuto.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4 relative">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900">Cadastre sua oficina em menos de 2 minutos</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Crie sua conta 100% grátis no Plano Starter, sem pedir cartão de crédito. Acesse imediatamente pelo celular, tablet ou PC.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4 relative">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-indigo-500/20">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900">Abra ordens de serviço e fotos pelo celular</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Fotografe avarias do veículo na recepção, selecione os serviços e peças com 1 toque e acompanhe o pátio em tempo real.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4 relative">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-emerald-500/20">
              3
            </div>
            <h3 className="text-base font-bold text-slate-900">Envie avisos automáticos no WhatsApp</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Seu cliente recebe o orçamento em PDF e atualizações instantâneas de "Veículo Pronto" direto no WhatsApp.
            </p>
          </div>
        </div>
      </section>

      {/* ⚖️ 3. SEÇÃO ANTES VS. DEPOIS */}
      <section className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Você ainda perde tempo e dinheiro no papel?
          </h2>
          <p className="text-sm text-slate-600">
            Veja a diferença de gerenciar sua oficina com métodos antigos versus o Torque ERP:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-rose-50/70 rounded-3xl p-6 sm:p-8 border border-rose-200 space-y-4">
            <div className="flex items-center gap-2 text-rose-700 font-black text-base uppercase tracking-wide">
              <X className="w-6 h-6 bg-rose-200 text-rose-800 rounded-full p-1" />
              <span>Sem o Torque ERP (Modo Antigo)</span>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-rose-950 font-medium">
              <li className="flex items-start gap-2.5">
                <span className="text-rose-500 font-bold text-base">✕</span>
                <span>Papéis e ordens de serviço perdidas no balcão ou molhadas no pátio.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-500 font-bold text-base">✕</span>
                <span>Clientes ligando e mandando mensagem o tempo todo perguntando se o carro está pronto.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-500 font-bold text-base">✕</span>
                <span>Falta de controle de peças e desvios no estoque sem você perceber.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-500 font-bold text-base">✕</span>
                <span>Caixa que não fecha no fim do dia e comissões calculadas na mão com erros.</span>
              </li>
            </ul>
          </div>

          <div className="bg-emerald-50/70 rounded-3xl p-6 sm:p-8 border-2 border-emerald-300 shadow-md space-y-4">
            <div className="flex items-center gap-2 text-emerald-800 font-black text-base uppercase tracking-wide">
              <Check className="w-6 h-6 bg-emerald-200 text-emerald-800 rounded-full p-1" />
              <span>Com o Torque ERP (Profissional)</span>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-emerald-950 font-semibold">
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-bold text-base">✓</span>
                <span>Tudo centralizado na nuvem, acessível do celular, tablet ou computador.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-bold text-base">✓</span>
                <span><strong>WhatsApp Automático:</strong> o cliente recebe mensagem sozinho quando o carro fica pronto.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-bold text-base">✓</span>
                <span>Checklist de entrada com fotos de avarias para evitar reclamações indevidas.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-bold text-base">✓</span>
                <span>Fechamento de caixa em 1 clique e comissões da equipe calculadas na hora.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 🛠️ 4. RECURSOS POR CASO DE USO COM ABAS */}
      <section id="recursos" className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-black uppercase tracking-widest text-blue-600">
            Funcionalidades Completas
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Projetado exatamente para a sua rotina
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Selecione seu tipo de operação e veja como o Torque ERP resolve seus gargalos:
          </p>
        </div>

        <div className="flex items-center justify-center p-1.5 bg-slate-200/70 rounded-2xl max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab("oficina")}
            className={`flex-1 py-3 text-xs sm:text-sm font-extrabold rounded-xl transition-all ${
              activeTab === "oficina"
                ? "bg-white text-blue-700 shadow-md"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🔧 Para Oficinas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("lavajato")}
            className={`flex-1 py-3 text-xs sm:text-sm font-extrabold rounded-xl transition-all ${
              activeTab === "lavajato"
                ? "bg-white text-cyan-700 shadow-md"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🧼 Lava-Jatos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("gestao")}
            className={`flex-1 py-3 text-xs sm:text-sm font-extrabold rounded-xl transition-all ${
              activeTab === "gestao"
                ? "bg-white text-emerald-700 shadow-md"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            📊 Gestão & Caixa
          </button>
        </div>

        {activeTab === "oficina" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 hover:border-blue-300 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Checklist com Fotos de Avarias</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tire fotos de riscos e amassados na entrada do veículo direto pelo celular. O cliente assina digitalmente e você fica 100% protegido.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 hover:border-blue-300 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Garantia de 90 Dias & Termos</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Emita termos de garantia legais em PDF prontos para impressão ou envio no WhatsApp com histórico de peças e serviços aplicados.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 hover:border-blue-300 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Comissão de Mecânicos Automática</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Defina comissão individual por mecânico ou por tipo de serviço. O sistema rateia os valores automaticamente no fechamento da OS.
              </p>
            </div>
          </div>
        )}

        {activeTab === "lavajato" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 hover:border-cyan-300 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                <Droplets className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Pátio Kanban Visual</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Acompanhe as colunas *Fila de Espera*, *Em Lavagem*, *Secagem* e *Prontos para Retirada* com controle de horários de entrada.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 hover:border-cyan-300 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Disparo WhatsApp "Carro Pronto"</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Assim que você move o carro para "Pronto", o Torque ERP dispara uma mensagem personalizada no WhatsApp do cliente para vir retirar.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 hover:border-cyan-300 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Tabela de Serviços & Categorias</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Preços diferenciados para Carros Pequenos, SUVs, Caminhonetes e Motos (Ducha, Completa, Polimento, Higienização).
              </p>
            </div>
          </div>
        )}

        {activeTab === "gestao" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 hover:border-emerald-300 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">PDV Balcão de Peças & Leitor</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Venda óleos, filtros e palhetas rapidamente com leitor de código de barras, controle de estoque mínimo e baixa automática.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 hover:border-emerald-300 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">CRM de Troca de Óleo a cada 6 Meses</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                O sistema avisa os clientes sumidos no WhatsApp lembrando da próxima revisão ou troca de óleo, enchendo sua oficina de clientes recorrentes.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 hover:border-emerald-300 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Controle de Turnos & Fechamento</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Abertura e fechamento de caixa por operador com cálculo de troco, separação de PIX, Cartão e Dinheiro sem furos no fim do dia.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 💰 5. TABELA DE PREÇOS & ANCORAGEM PSICOLÓGICA */}
      <section id="planos" className="bg-slate-950 text-white p-6 sm:p-12 rounded-3xl shadow-2xl space-y-10 relative overflow-hidden border border-slate-800">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-black uppercase tracking-widest text-amber-400">
            Planos Transparentes • Sem Letras Miúdas
          </span>
          <h2 className="text-3xl sm:text-4xl font-black">
            Quanto custa transformar sua oficina?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Comece 100% grátis hoje e só faça upgrade quando sua equipe crescer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* Starter */}
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Plano Starter
              </div>
              <div className="text-3xl font-black text-white">
                R$ 0,00 <span className="text-xs font-normal text-slate-400">/mês</span>
              </div>
              <p className="text-xs text-slate-300">
                Ideal para mecânicos solo, oficinas e lava-jatos começando agora.
              </p>
              <div className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 p-2 rounded-xl border border-emerald-800">
                ✓ 1 Usuário único (Dono / Proprietário)
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">✓ Até 30 Ordens de Serviço/mês</li>
                <li className="flex items-center gap-2">✓ <strong>Lava-Jato (Até 50 Lavagens/mês)</strong></li>
                <li className="flex items-center gap-2">✓ <strong>Caixa Diário &amp; Financeiro</strong></li>
                <li className="flex items-center gap-2">✓ Oficina &amp; Ordens de Serviço</li>
                <li className="flex items-center gap-2">✓ Cadastro de Clientes &amp; Veículos</li>
                <li className="flex items-center gap-2">✓ Tabela de Serviços</li>
                <li className="flex items-center gap-2 opacity-40 line-through">✗ PDV Balcão de Peças (Plano Pro)</li>
              </ul>
            </div>
            <Link
              href="/cadastro"
              className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center transition-colors shadow-sm"
            >
              Começar Grátis Agora
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-gradient-to-b from-blue-900/90 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 border-2 border-amber-400 shadow-2xl space-y-6 flex flex-col justify-between relative transform md:-translate-y-2">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 text-[11px] font-black uppercase px-4 py-1 rounded-full shadow-md tracking-wider">
              ⭐ Mais Escolhido pelas Oficinas
            </div>

            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Plano Oficina Pro
              </div>
              <div className="text-4xl font-black text-white">
                R$ 69,90 <span className="text-xs font-normal text-slate-300">/mês</span>
              </div>
              <div className="text-xs text-amber-300 font-bold bg-amber-950/60 p-2 rounded-xl border border-amber-800">
                🔥 Apenas R$ 2,33/dia (Menos que 1 cafezinho!)
              </div>
              <p className="text-xs text-slate-200">
                Até 4 Usuários com controle de permissões por perfil.
              </p>
              <ul className="space-y-2.5 text-xs text-white pt-2 border-t border-blue-700/60">
                <li className="flex items-center gap-2">✓ <strong>OS e Lavagens ILIMITADAS</strong></li>
                <li className="flex items-center gap-2">✓ <strong>Avisos Automáticos no WhatsApp</strong></li>
                <li className="flex items-center gap-2">✓ PDV Balcão &amp; Controle de Estoque</li>
                <li className="flex items-center gap-2">✓ Fotos de Avarias &amp; Checklist Digital</li>
                <li className="flex items-center gap-2">✓ CRM Lembretes de Troca de Óleo</li>
                <li className="flex items-center gap-2">✓ Importador de Notas NF-e XML</li>
              </ul>
            </div>

            <Link
              href="/cadastro"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black text-sm text-center shadow-xl shadow-amber-500/20 transition-all active:scale-95"
            >
              Assinar Plano Pro
            </Link>
          </div>

          {/* Elite */}
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Plano Oficina Elite
              </div>
              <div className="text-3xl font-black text-white">
                R$ 129,90 <span className="text-xs font-normal text-slate-400">/mês</span>
              </div>
              <p className="text-xs text-slate-300">
                Para centros automotivos e grandes frotas.
              </p>
              <div className="text-[11px] font-semibold text-purple-300 bg-purple-950/60 p-2 rounded-xl border border-purple-800">
                ✓ Até 10 Usuários Inclusos
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">✓ Tudo do Plano Pro Ilimitado</li>
                <li className="flex items-center gap-2">✓ Múltiplos Caixas & Múltiplos Turnos</li>
                <li className="flex items-center gap-2">✓ Relatórios Avançados de DRE e BI</li>
                <li className="flex items-center gap-2">✓ Suporte VIP Prioritário no WhatsApp</li>
              </ul>
            </div>
            <Link
              href="/cadastro"
              className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs text-center transition-colors shadow-sm"
            >
              Assinar Plano Elite
            </Link>
          </div>
        </div>

        <div className="pt-4 text-center max-w-xl mx-auto flex items-center justify-center gap-3 text-xs text-slate-400 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
          <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>
            <strong>Garantia de Satisfação Total:</strong> Cancele a qualquer momento com 1 clique direto no painel, sem multa e sem contratos de fidelidade.
          </span>
        </div>
      </section>

      {/* ❓ 6. QUEBRA DE OBJEÇÕES (FAQ INTERATIVO) */}
      <section className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-blue-600">
            Tire Suas Dúvidas
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Perguntas Frequentes
          </h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: "Preciso instalar algum programa no meu computador?",
              a: "Não! O Torque ERP é 100% na nuvem. Você pode acessar de qualquer computador, notebook, tablet ou celular (Android e iPhone) pelo navegador de internet com total segurança.",
            },
            {
              q: "Como funciona o plano grátis?",
              a: "Você pode criar sua conta imediatamente sem precisar cadastrar cartão de crédito. O Plano Starter é 100% gratuito e permite 1 Usuário único (o próprio Dono ou Proprietário) com acesso à Lava-Jato (até 50 lavagens/mês), Caixa & Financeiro, Oficina & OS (até 30 OS/mês), Clientes, Veículos e Serviços — ideal para organizar seu negócio do zero sem custo.",
            },
            {
              q: "Como funciona o envio de mensagens no WhatsApp do cliente?",
              a: "O Torque ERP possui integração nativa com o WhatsApp. Ao cadastrar uma ordem de serviço ou finalizar uma lavagem, o sistema gera o link pronto com mensagem personalizada para você enviar em 1 clique ou disparar automaticamente.",
            },
            {
              q: "Posso cancelar minha assinatura quando quiser?",
              a: "Sim! Não temos contrato de fidelidade ou taxa de cancelamento. Você pode cancelar sua assinatura com 1 clique diretamente no menu do sistema a qualquer momento.",
            },
            {
              q: "Meus dados e histórico de clientes ficam seguros?",
              a: "Sim! Utilizamos banco de dados criptografado e servidores de alta performance com backups automáticos diários. Seus dados são 100% privativos da sua oficina conforme a LGPD.",
            },
          ].map((faq, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all shadow-sm"
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 sm:p-5 text-left font-bold text-xs sm:text-sm flex items-center justify-between gap-4 text-slate-900 hover:text-blue-600"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    openFaq === idx ? "rotate-180 text-blue-600" : ""
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 animate-fadeIn">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 🚀 7. CTA FINAL DE ALTA CONVERSÃO */}
      <section className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white rounded-3xl p-8 sm:p-14 text-center max-w-5xl mx-auto space-y-6 shadow-2xl relative overflow-hidden">
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
          Pronto para dobrar a produtividade <br className="hidden sm:inline" /> da sua oficina?
        </h2>
        <p className="text-sm sm:text-base text-blue-100 max-w-2xl mx-auto">
          Organize o pátio, as ordens de serviço e o fluxo de caixa da sua oficina com agilidade e clareza.
        </p>
        <div className="pt-2">
          <Link
            href="/cadastro"
            className="inline-flex items-center gap-2.5 px-9 py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-base shadow-xl shadow-amber-400/30 transition-all transform hover:scale-105 active:scale-95"
          >
            <Sparkles className="w-5 h-5 fill-current" />
            <span>Criar Minha Conta Grátis Agora</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
        <p className="text-xs text-blue-200 font-semibold">
          ✓ Sem cartão de crédito • ✓ Cadastro em menos de 2 minutos
        </p>
      </section>

      {/* 📌 8. FLOATING BOTTOM CTA */}
      {showFloatingCta && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-8 z-50 animate-fadeIn">
          <div className="bg-slate-950/95 backdrop-blur-md text-white p-3 sm:px-6 sm:py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between gap-4">
            <div className="hidden sm:block">
              <div className="text-xs font-black text-white">Torque ERP • Gestão Automotiva</div>
              <div className="text-[10px] text-emerald-400 font-bold">Comece Grátis • Sem Cartão</div>
            </div>
            <Link
              href="/cadastro"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Começar Grátis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* 🏛️ 9. RODAPÉ INSTITUCIONAL & LGPD */}
      <footer className="pt-12 border-t border-slate-200 text-xs text-slate-500 space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-sm">Torque ERP</span>
              <span className="block text-[10px] text-slate-400">Sistema Especializado para Oficinas & Lava-Jatos</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 font-semibold text-slate-600">
            <Link href="/sobre" className="hover:text-blue-600 transition-colors">Sobre Nós</Link>
            <Link href="/contato" className="hover:text-blue-600 transition-colors">Fale Conosco</Link>
            <Link href="/termos" className="hover:text-blue-600 transition-colors">Termos de Uso</Link>
            <Link href="/privacidade" className="hover:text-blue-600 transition-colors">Privacidade (LGPD)</Link>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-slate-100 text-[11px] text-slate-400">
          <span>© 2026 Torque ERP • Todos os direitos reservados.</span>
          <span>Hospedado na Nuvem com Criptografia SSL e Segurança Avançada.</span>
        </div>
      </footer>
    </div>
  );
}
