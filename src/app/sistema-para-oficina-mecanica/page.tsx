import React from "react";
import Link from "next/link";
import {
  Wrench,
  CheckCircle2,
  Smartphone,
  MessageSquare,
  ShieldCheck,
  Zap,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Camera,
  Layers,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sistema para Oficina Mecânica e Auto Center • Torque ERP",
  description:
    "O melhor software de gestão para oficinas mecânicas. Abertura de OS rápida pelo celular, checklist com fotos de avarias, controle de estoque de peças, comissão de mecânicos e CRM WhatsApp.",
  keywords: [
    "sistema para oficina mecanica",
    "software para mecanica",
    "programa de ordem de servico",
    "gestao de oficina",
    "checklist automotivo digital",
  ],
};

export default function SistemaOficinaMecanicaPage() {
  return (
    <div className="space-y-16 pb-20 font-sans text-slate-900">
      {/* Hero Section Nichado */}
      <section className="relative overflow-hidden bg-slate-950 text-white rounded-3xl p-8 sm:p-16 border border-slate-800 shadow-2xl">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold">
            <Wrench className="w-3.5 h-3.5" />
            Software Especializado para Oficinas Mecânicas & Auto Centers
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            O Sistema que Organiza sua <span className="text-blue-400">Oficina Mecânica</span> do Pátio ao Caixa
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Elimine pranchetas de papel. Abra ordens de serviço em segundos pelo celular, anexe fotos de avarias no checklist digital e envie orçamentos com 1 clique no WhatsApp do cliente.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <Link
              href="/cadastro"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black text-sm text-center shadow-xl shadow-blue-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Criar Conta Grátis na Oficina
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/#como-funciona"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-sm text-center border border-slate-700 transition-colors"
            >
              Ver Recursos da Mecânica
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-4 text-xs text-slate-400 border-t border-slate-800">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" /> 100% Grátis no Plano Starter
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-400" /> Sem Cartão de Crédito
            </span>
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-purple-400" /> Funciona no Celular
            </span>
          </div>
        </div>
      </section>

      {/* Pilares da Oficina Mecânica */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
            <Camera className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Checklist com Fotos de Avarias</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Fotografe riscos e peças desgastadas na recepção do veículo. Evite contestações e transmita 100% de confiança ao cliente.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">CRM de Óleo & WhatsApp</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            O sistema calcula a data prevista da próxima troca de óleo e envia lembrete no WhatsApp trazendo o cliente de volta.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Comissão de Mecânicos Automática</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Atribua os mecânicos em cada serviço executado e calcule comissões em tempo real com relatórios transparentes.
          </p>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-12 text-white text-center space-y-6 shadow-xl">
        <h2 className="text-2xl sm:text-3xl font-black">
          Pronto para modernizar sua oficina mecânica hoje?
        </h2>
        <p className="text-xs sm:text-sm text-blue-100 max-w-xl mx-auto">
          Comece agora gratuitamente. Leva menos de 2 minutos para cadastrar sua oficina e emitir sua primeira ordem de serviço.
        </p>
        <Link
          href="/cadastro"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-black text-sm shadow-xl transition-all active:scale-95"
        >
          Começar Grátis Agora
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
