"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Sparkles,
  Droplets,
  Wrench,
  ShoppingCart,
  MessageSquare,
  Package,
  CircleDollarSign,
  Shield,
  Cloud,
  Printer,
  ChevronRight,
  CheckCircle2,
  Users,
  KeyRound,
  FileText,
  Clock,
  Layers,
} from "lucide-react";
import { InteractiveTourModal } from "@/components/InteractiveTour";
import Image from "next/image";

export default function ManualPage() {
  const [activeSection, setActiveSection] = useState<
    "LAVAJATO" | "OFICINA" | "PDV" | "CRM" | "FINANCEIRO" | "PERMISSOES"
  >("LAVAJATO");
  const [isTourOpen, setIsTourOpen] = useState(false);

  const sections = [
    {
      id: "LAVAJATO",
      title: "1. Lava-Jato & Pátio Kanban",
      icon: Droplets,
      badge: "Operação Pátio",
      badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-300",
      image: "/manual/lavajato.jpg",
      summary:
        "Controle de entrada de veículos, filas de lavagem e disparo de notificação no WhatsApp quando o carro estiver limpo.",
      steps: [
        {
          num: "1",
          title: "Entrada do Veículo",
          desc: "Cadastre a placa, modelo e o telefone do cliente. Selecione o tipo de serviço (Lavagem Simples, Completa, Cera, Higienização).",
        },
        {
          num: "2",
          title: "Execução no Box de Lavagem",
          desc: "O operador visualiza o veículo no quadro Kanban e move para 'Lavando'. É possível atribuir o funcionário responsável para cálculo de comissão.",
        },
        {
          num: "3",
          title: "Inspeção de Qualidade",
          desc: "Após a secagem e acabamento, o operador move o cartão para 'Pronto para Retirada'.",
        },
        {
          num: "4",
          title: "Aviso Automático no WhatsApp & Entrega",
          desc: "Clique no ícone de WhatsApp para enviar a mensagem automática informando que o veículo está pronto com o valor do serviço!",
        },
      ],
    },
    {
      id: "OFICINA",
      title: "2. Oficina Mecânica & Ordens de Serviço (OS)",
      icon: Wrench,
      badge: "Mecânica & Manutenção",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      image: "/manual/oficina.jpg",
      summary:
        "Checklist de entrada com fotos de avarias, diagnóstico técnico, adição de peças/serviços, aprovação do orçamento e garantia.",
      steps: [
        {
          num: "1",
          title: "Recepção & Checklist de Entrada",
          desc: "Registre a quilometragem atual, nível de combustível e anexe fotos de eventuais arranhões pré-existentes para segurança jurídica.",
        },
        {
          num: "2",
          title: "Diagnóstico Técnico & Orçamento",
          desc: "Adicione os serviços necessários (ex: Troca de Pastilhas, Alinhamento) e as peças do estoque com preço de venda e margem.",
        },
        {
          num: "3",
          title: "Aprovação & Execução pelo Mecânico",
          desc: "Envie o orçamento em PDF ou mensagem no WhatsApp. Com a aprovação, o mecânico inicia a manutenção e o estoque é reservado.",
        },
        {
          num: "4",
          title: "Finalização, Pagamento & Termo de Garantia",
          desc: "Receba o pagamento (Dinheiro, PIX, Cartão ou Faturado) e imprima a Ordem de Serviço com o Termo de Garantia de 90 dias.",
        },
      ],
    },
    {
      id: "PDV",
      title: "3. PDV Balcão de Peças & Livro Caixa",
      icon: ShoppingCart,
      badge: "Vendas Rápidas",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      image: "/manual/pdv.jpg",
      summary:
        "Venda ágil de lubrificantes, filtros e acessórios com leitor de código de barras, cálculo de troco e impressão térmica.",
      steps: [
        {
          num: "1",
          title: "Bipar ou Buscar Peça",
          desc: "Utilize o leitor de código de barras USB ou busque por nome/código para adicionar os produtos à cesta instantaneamente.",
        },
        {
          num: "2",
          title: "Forma de Pagamento & Descontos",
          desc: "Escolha Dinheiro (com calculadora de troco), Cartão de Crédito/Débito ou PIX com QR Code dinâmico.",
        },
        {
          num: "3",
          title: "Baixa de Estoque & Comprovante",
          desc: "O sistema baixa a quantidade no estoque, registra a receita no caixa diário e imprime o cupom de venda de 80mm ou 58mm.",
        },
      ],
    },
    {
      id: "CRM",
      title: "4. CRM & WhatsApp Marketing Automático",
      icon: MessageSquare,
      badge: "Fidelização de Clientes",
      badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
      image: "/manual/crm.jpg",
      summary:
        "Disparo silencioso de mensagens de pós-venda, lembretes preventivos de troca de óleo e cupons de aniversário.",
      steps: [
        {
          num: "1",
          title: "Lembrete Preventivo de Óleo (6 meses)",
          desc: "O CRM filtra os clientes cuja última troca de óleo completou 180 dias e sugere o disparo de convite para revisão.",
        },
        {
          num: "2",
          title: "Lembrete de Lavagem para Clientes Sumidos",
          desc: "Identifica veículos que não retornam ao lava-jato há mais de 30 dias para atraí-los novamente com desconto.",
        },
        {
          num: "3",
          title: "Cupons de Aniversariantes do Mês",
          desc: "Dispara mensagens personalizadas de felicitações com cupom de 15% de desconto válido durante o mês de aniversário.",
        },
      ],
    },
    {
      id: "FINANCEIRO",
      title: "5. Caixa, Sangrias & Contas a Pagar/Receber",
      icon: CircleDollarSign,
      badge: "Gestão Financeira",
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300",
      image: "/manual/pdv.jpg",
      summary:
        "Abertura de turno, controle de sangrias, contas a pagar para fornecedores de autopeças e fechamento diário.",
      steps: [
        {
          num: "1",
          title: "Abertura de Caixa Diário",
          desc: "O atendente insere o fundo inicial de troco (ex: R$ 150,00) para iniciar as movimentações do dia.",
        },
        {
          num: "2",
          title: "Sangrias & Suprimentos",
          desc: "Registre retiradas para compras de emergência (sangria) ou entradas de troco extra (suprimento) com descrição e comprovante.",
        },
        {
          num: "3",
          title: "Fechamento de Caixa Cego",
          desc: "No fim do dia, o operador conta o dinheiro em espécie e o sistema gera o relatório consolidado com total de PIX, Cartão e Dinheiro.",
        },
      ],
    },
    {
      id: "PERMISSOES",
      title: "6. Controle de Login, Cargos & Permissões",
      icon: Shield,
      badge: "Segurança & Perfis",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
      image: "/manual/oficina.jpg",
      summary:
        "Proteção dos módulos por perfil (Admin, Gerente, Atendente, Mecânico e Lavador) com bloqueio automático de menus.",
      steps: [
        {
          num: "1",
          title: "Perfis Predefinidos",
          desc: "O Lavador só vê o Pátio; o Mecânico vê Ordens de Serviço; o Atendente vê Balcão e Caixa; o Admin acessa tudo.",
        },
        {
          num: "2",
          title: "Troca Rápida de Usuário no Topo",
          desc: "No topo direito da tela, qualquer operador pode clicar no seu nome para alternar de usuário com PIN de segurança.",
        },
        {
          num: "3",
          title: "Personalização de Permissões pelo Admin",
          desc: "Na tela de Equipe, o Administrador pode marcar ou desmarcar caixas para liberar módulos específicos a qualquer cargo.",
        },
      ],
    },
  ];

  const currentSection = sections.find((s) => s.id === activeSection) || sections[0];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="space-y-2 max-w-2xl relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold">
            <BookOpen className="w-3.5 h-3.5" />
            Manual de Operações & Guia de Treinamento
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Guia Completo do Sistema AutoGestão ERP
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Consulte o passo a passo de cada módulo da sua oficina e lava-jato, visualize os fluxogramas operacionais e reproduza o tour interativo a qualquer momento.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative">
          <button
            onClick={() => setIsTourOpen(true)}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-extrabold text-xs shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            ▶️ Iniciar Tour Interativo
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-2 transition-all no-print"
          >
            <Printer className="w-4 h-4" />
            Imprimir Manual
          </button>
        </div>
      </div>

      {/* Navegação por Abas dos Módulos */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-print">
        {sections.map((sec) => {
          const Icon = sec.icon;
          const isSelected = activeSection === sec.id;

          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id as any)}
              className={`px-4 py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2.5 ${
                isSelected
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-slate-500"}`} />
              <span>{sec.title}</span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo Principal do Módulo Selecionado */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-8">
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <span
              className={`text-[11px] font-black px-3 py-1 rounded-full border ${currentSection.badgeColor}`}
            >
              {currentSection.badge}
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-2">
              {currentSection.title}
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              {currentSection.summary}
            </p>
          </div>
        </div>

        {/* Imagem do Fluxograma Operacional */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Infográfico do Fluxo Operacional:
          </h3>

          <div className="rounded-2xl overflow-hidden border-2 border-slate-200 shadow-md bg-slate-950 flex items-center justify-center relative aspect-video max-h-[460px] w-full">
            <img
              src={currentSection.image}
              alt={currentSection.title}
              className="w-full h-full object-cover object-center hover:scale-[1.01] transition-transform duration-500"
            />
          </div>
        </div>

        {/* Passo a Passo Detalhado */}
        <div className="space-y-4 pt-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Procedimento Operacional Passo a Passo:
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentSection.steps.map((st, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 hover:border-blue-300 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                    {st.num}
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{st.title}</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-11">
                  {st.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Componente Modal do Tour */}
      <InteractiveTourModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />
    </div>
  );
}
