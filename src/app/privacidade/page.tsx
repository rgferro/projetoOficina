import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade | Torque ERP",
  description: "Política de Privacidade e Proteção de Dados (LGPD) do Torque ERP.",
};

export default function PrivacidadePage() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 space-y-8 text-slate-700 text-xs sm:text-sm leading-relaxed">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Política de Privacidade</h1>
        <p className="text-xs text-slate-500 mt-1">Conformidade com a Lei Geral de Proteção de Dados (LGPD • Lei nº 13.709/2018)</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">1. Coleta e Uso de Informações</h2>
        <p>
          O <strong>Torque ERP</strong> coleta apenas as informações estritamente necessárias para a prestação dos serviços de gestão automotiva, incluindo dados cadastrais da oficina (Razão Social, CNPJ/CPF, E-mail do Administrador) e dados operacionais de clientes e veículos cadastrados pelo próprio usuário.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">2. Segurança e Armazenamento</h2>
        <p>
          Empregamos protocolos de criptografia e proteção de alto padrão para salvaguardar os dados contra acessos não autorizados, perdas ou alterações. Seus dados nunca são vendidos ou compartilhados com parceiros para fins publicitários.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">3. Processamento de Pagamentos</h2>
        <p>
          As transações financeiras referentes às assinaturas dos planos são processadas diretamente pelo gateway de pagamentos <strong>Mercado Pago</strong>. O Torque ERP não armazena dados confidenciais de cartões de crédito em seus servidores.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">4. Cookies e Google AdSense</h2>
        <p>
          Nosso site pode utilizar cookies para melhorar a experiência do usuário, navegação e medição de tráfego. Terceiros, incluindo o Google (Google AdSense e Google Analytics), podem usar cookies para veicular anúncios e métricas baseadas em visitas anteriores.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">5. Direitos do Titular dos Dados</h2>
        <p>
          Em cumprimento à LGPD, você possui o direito de solicitar a confirmação da existência de tratamento, o acesso, a correção de dados incompletos ou a exclusão de seus dados através do nosso canal de <a href="/contato" className="text-blue-600 font-bold hover:underline">Fale Conosco</a>.
        </p>
      </section>
    </div>
  );
}
