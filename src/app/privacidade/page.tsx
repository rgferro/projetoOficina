import React from "react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade | Torque ERP",
  description: "Política de Privacidade e Proteção de Dados (LGPD) do Torque ERP.",
};

export default function PrivacidadePage() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 space-y-8 text-slate-700 text-xs sm:text-sm leading-relaxed">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Política de Privacidade & LGPD</h1>
        <p className="text-xs text-slate-500 mt-1">Conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">1. Controlador dos Dados</h2>
        <p>
          O responsável pelo tratamento dos dados pessoais na plataforma Torque ERP é <strong>Rafael Gielow</strong> (Pessoa Física, com dados de identificação formalizados nos Termos de Uso).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">2. Coleta e Finalidade do Tratamento</h2>
        <p>
          Coletamos estritamente os dados necessários para a execução dos serviços (cadastro do administrador, emissão de ordens de serviço e envio de notificações). Nenhum dado pessoal é comercializado com terceiros.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">3. Segurança das Informações</h2>
        <p>
          Adotamos boas práticas técnicas e administrativas para proteger as informações contra acessos não autorizados, incidentes de segurança ou qualquer forma de tratamento inadequado.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">4. Direitos do Titular (LGPD) & Canal de Atendimento</h2>
        <p>
          Para exercer seus direitos de confirmação, acesso, retificação, exclusão ou revogação de consentimento previstos no art. 18 da LGPD, utilize a nossa central oficial de atendimento na página de{" "}
          <Link href="/contato" className="text-blue-600 font-bold hover:underline">
            Fale Conosco
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
