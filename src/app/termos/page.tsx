import React from "react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Uso | Torque ERP",
  description: "Termos e condições de uso da plataforma SaaS Torque ERP (torquerp.com.br).",
};

export default function TermosPage() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 space-y-8 text-slate-700 text-xs sm:text-sm leading-relaxed">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Termos de Uso do Torque ERP</h1>
        <p className="text-xs text-slate-500 mt-1">Última atualização: 21 de Agosto de 2026</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">1. Identificação do Responsável e Prestação do Serviço</h2>
        <p>
          A plataforma <strong>Torque ERP</strong> (disponível em <code>torquerp.com.br</code>) é desenvolvida, mantida e operada por <strong>Rafael Gielow</strong>, Pessoa Física, inscrito no <strong>CPF sob o nº 116.658.727-48</strong>, com sede e foro de eleição na comarca de Juiz de Fora - MG.
        </p>
        <p>
          O software é fornecido na modalidade <em>"as is"</em> (no estado em que se encontra) como ferramenta de auxílio à gestão operacional e administrativa para oficinas mecânicas, autocenters e lava-jatos.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">2. Aceitação dos Termos</h2>
        <p>
          Ao criar uma conta ou utilizar a plataforma, você declara estar ciente e de pleno acordo com as cláusulas aqui dispostas, em conformidade com o Código de Defesa do Consumidor (CDC) e a legislação brasileira vigente.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">3. Cadastro, Contas e Segurança</h2>
        <p>
          O usuário titular é inteiramente responsável pela guarda e sigilo de suas credenciais de acesso, bem como pela legitimidade de todos os dados e informações de clientes inseridos em sua base de dados privada.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">4. Planos, Assinaturas e Pagamentos</h2>
        <p>
          Os planos de assinatura (mensal e anual) são processados via gateways de pagamento integrados (Mercado Pago). Em caso de cancelamento, o usuário manterá acesso até o término do ciclo já contratado.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">5. Atendimento, Suporte e Dúvidas</h2>
        <p>
          Todas as solicitações de suporte operacional, dúvidas sobre faturamento ou solicitações de titulares devem ser encaminhadas exclusivamente pelo nosso canal de{" "}
          <Link href="/contato" className="text-blue-600 font-bold hover:underline">
            Fale Conosco / Contato
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
