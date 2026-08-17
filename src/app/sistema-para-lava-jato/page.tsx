import React from "react";
import Link from "next/link";
import {
  Car,
  CheckCircle2,
  Smartphone,
  MessageSquare,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  Layers,
  Award,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sistema para Lava-Jato e Estética Automotiva • Torque ERP",
  description:
    "O melhor software para gestão de lava-jato e estética automotiva. Controle de fila e pátio em Kanban visual, aviso automático no WhatsApp quando o carro fica pronto e controle de caixa rápido.",
  keywords: [
    "sistema para lava jato",
    "software para lava rapido",
    "programa para estetica automotiva",
    "gestao de lava jato",
    "kanban lava jato",
  ],
};

export default function SistemaLavaJatoPage() {
  return (
    <div className="space-y-16 pb-20 font-sans text-slate-900">
      {/* Hero Section Lava-Jato */}
      <section className="relative overflow-hidden bg-slate-950 text-white rounded-3xl p-8 sm:p-16 border border-slate-800 shadow-2xl">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold">
            <Car className="w-3.5 h-3.5" />
            Software Especializado para Lava-Jato & Estética Automotiva
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Controle seu <span className="text-cyan-400">Lava-Jato</span> com Fila Kanban e Aviso no WhatsApp
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Diga adeus às filas desorganizadas e fichas de papel molhadas. Controle os veículos no pátio por etapas (Fila, Lavando, Secagem, Pronto) e avise o cliente automaticamente no WhatsApp assim que o carro estiver limpo!
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <Link
              href="/cadastro"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-black text-sm text-center shadow-xl shadow-cyan-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Começar Grátis no Lava-Jato
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/#como-funciona"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-sm text-center border border-slate-700 transition-colors"
            >
              Ver Demonstração
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-4 text-xs text-slate-400 border-t border-slate-800">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" /> Plano Starter 100% Gratuito
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" /> Sem Instalações Pesadas
            </span>
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-blue-400" /> Opera em Qualquer Celular
            </span>
          </div>
        </div>
      </section>

      {/* Pilares do Lava-Jato */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-100 text-cyan-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Pátio Kanban Visual</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Arraste os carros entre as colunas conforme o serviço avança: Na Fila ➔ Lavando ➔ Secando ➔ Pronto para Entrega.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Aviso Automático: Carro Pronto!</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Ao arrastar para "Pronto", o sistema envia uma mensagem personalizada no WhatsApp do dono para vir retirar o veículo.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Comissão de Lavadores por Carro</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Fechamento de comissões por diária ou por veículo lavado com total clareza para a sua equipe.
          </p>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-gradient-to-r from-cyan-600 to-blue-700 rounded-3xl p-8 sm:p-12 text-white text-center space-y-6 shadow-xl">
        <h2 className="text-2xl sm:text-3xl font-black">
          Pronto para acelerar a produtividade do seu lava-jato?
        </h2>
        <p className="text-xs sm:text-sm text-cyan-100 max-w-xl mx-auto">
          Crie sua conta em menos de 2 minutos e comece a controlar o pátio hoje mesmo.
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
