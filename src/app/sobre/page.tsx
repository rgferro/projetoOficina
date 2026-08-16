import React from "react";
import Link from "next/link";
import { ShieldCheck, Zap, Award, Users, Car, CheckCircle2, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre Nós | Torque ERP - Sistema para Oficinas Mecânicas e Lava-Jato",
  description:
    "Conheça o Torque ERP, a plataforma SaaS líder em gestão automotiva, controle de ordens de serviço, pátio kanban, PDV e automação de marketing para oficinas e lava-jatos em todo o Brasil.",
};

export default function SobrePage() {
  return (
    <div className="max-w-5xl mx-auto space-y-12 py-8 px-4 sm:px-6">
      {/* Header Institucional */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-200">
          Sobre o Torque ERP
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          A Potência Tecnológica que Move o Mercado Automotivo Brasileiro
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Nossa missão é descomplicar a rotina de oficinas mecânicas, autocenters e lava-jatos, entregando ferramentas de alto nível com facilidade de uso e custo acessível.
        </p>
      </div>

      {/* Grid de Pilares */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-slate-900">Agilidade Operacional</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Eliminamos planilhas confusas e formulários de papel. Do check-in do veículo com fotos de avarias até o pagamento no PIX ou Cartão, tudo é feito em segundos.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-slate-900">Segurança & Confiabilidade</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Dados protegidos em nuvem de alta disponibilidade, controle de permissões por funcionário e conformidade total com as normas da LGPD.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-slate-900">Fidelização de Clientes</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            CRM inteligente com avisos automáticos no WhatsApp para revisão preventiva de óleo a cada 6 meses e cupons de desconto para aniversariantes do mês.
          </p>
        </div>
      </div>

      {/* Seção de Compromisso */}
      <div className="bg-slate-900 rounded-3xl p-8 sm:p-10 text-white space-y-6">
        <h2 className="text-2xl font-bold">Nosso Compromisso com a Sua Oficina</h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          O Torque ERP nasceu com a proposta de ser 100% web, intuitivo e acessível para qualquer porte de negócio automotivo: desde o mecânico autônomo com um ajudante até grandes autocenters multi-boxes. Desenvolvido no Brasil e feito para as necessidades reais do mercado nacional.
        </p>

        <div className="pt-4 flex flex-wrap gap-4">
          <Link
            href="/assinatura"
            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all"
          >
            Conhecer Nossos Planos
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/contato"
            className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all"
          >
            Fale com Nossa Equipe
          </Link>
        </div>
      </div>
    </div>
  );
}
