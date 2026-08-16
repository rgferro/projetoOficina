import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso | Torque ERP",
  description: "Termos e condições de uso da plataforma SaaS Torque ERP (torquerp.com.br).",
};

export default function TermosPage() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 space-y-8 text-slate-700 text-xs sm:text-sm leading-relaxed">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Termos de Uso do Torque ERP</h1>
        <p className="text-xs text-slate-500 mt-1">Última atualização: 16 de Agosto de 2026</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">1. Aceitação dos Termos</h2>
        <p>
          Ao acessar e utilizar a plataforma <strong>Torque ERP</strong> (disponível em <code>torquerp.com.br</code>), você concorda integralmente com os presentes Termos de Uso e com todas as leis e regulamentos aplicáveis no território brasileiro.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">2. Descrição dos Serviços</h2>
        <p>
          O Torque ERP é uma solução SaaS (Software as a Service) voltada à gestão operacional, controle de ordens de serviço, pátio de lavagem de veículos, controle de estoque de peças, ponto de venda (PDV) e relacionamento com clientes para oficinas mecânicas, autocenters e lava-jatos.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">3. Cadastro e Segurança de Contas</h2>
        <p>
          O usuário comprador (administrador) é responsável por manter a confidencialidade de suas credenciais de acesso, bem como pelo gerenciamento dos perfis e permissões atribuídas aos membros de sua equipe e colaboradores cadastrados.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">4. Planos, Pagamentos e Renovação</h2>
        <p>
          O acesso aos recursos da plataforma dá-se mediante o plano selecionado (Starter Grátis, Oficina Pro ou Oficina Elite). Os pagamentos processados via PIX ou Cartão de Crédito são intermediados de forma segura pelo <strong>Mercado Pago</strong>. A renovação dos planos pagos ocorre mensalmente.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">5. Propriedade Intelectual e Proteção de Dados</h2>
        <p>
          Todos os direitos autorais, código-fonte, layout, marcas e funcionalidades do Torque ERP pertencem aos seus desenvolvedores. Os dados inseridos pelas oficinas (clientes, veículos, valores de faturamento) são de propriedade exclusiva da oficina contratante.
        </p>
      </section>
    </div>
  );
}
