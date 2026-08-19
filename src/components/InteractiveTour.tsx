"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Play,
  CheckCircle2,
  Car,
  ShoppingCart,
  Droplets,
  Wrench,
  Package,
  CircleDollarSign,
  MessageSquare,
  Shield,
  Cloud,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

export interface TourStep {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  badge: string;
  badgeColor: string;
  content: string;
  tips: string[];
  route: string;
  actionLabel?: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "dashboard",
    title: "1. Dashboard & Visão Gerencial",
    subtitle: "Controle em tempo real de faturamento e produção",
    icon: Car,
    badge: "Visão Geral",
    badgeColor: "bg-blue-100 text-blue-700 border-blue-300",
    route: "/",
    content:
      "O Dashboard consolida os principais indicadores da sua oficina e lava-jato: faturamento diário, ordens de serviço em andamento, veículos no pátio de lavagem, alertas de estoque baixo e contas a pagar do dia.",
    tips: [
      "Monitore o faturamento consolidado entre PDV, Lava-Jato e Oficina.",
      "Acesse atalhos rápidos no topo para abrir novas Ordens de Serviço ou registrar lavagens.",
    ],
    actionLabel: "Explorar Dashboard",
  },
  {
    id: "pdv",
    title: "2. PDV Balcão (Venda Rápida de Peças)",
    subtitle: "Agilidade para venda de peças, óleos e acessórios",
    icon: ShoppingCart,
    badge: "Balcão & Vendas",
    badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-300",
    route: "/pdv",
    content:
      "Desenvolvido para atendimento de balcão ultra-rápido: busca inteligente por nome, SKU ou leitura de código de barras. Permite pagamentos em Dinheiro, Cartão ou PIX com cálculo automático de troco e impressão de comprovante térmico.",
    tips: [
      "Use leitor de código de barras para adicionar produtos instantaneamente.",
      "O estoque e o livro caixa são atualizados automaticamente na finalização da venda.",
    ],
    actionLabel: "Abrir PDV Balcão",
  },
  {
    id: "lavajato",
    title: "3. Lava-Jato & Pátio Kanban",
    subtitle: "Gestão visual de filas e lavagens de veículos",
    icon: Droplets,
    badge: "Pátio & Lavagens",
    badgeColor: "bg-cyan-100 text-cyan-700 border-cyan-300",
    route: "/lavajato",
    content:
      "Controle total dos veículos no pátio através de cartões Kanban: 'Na Fila', 'Lavando', 'Pronto para Retirada' e 'Entregue'. Ao marcar como 'Pronto', o sistema pode disparar uma mensagem silenciosa no WhatsApp do cliente avisando que o carro pode ser retirado!",
    tips: [
      "Arraste ou clique nos botões para mudar o status do veículo.",
      "Clique no botão WhatsApp para enviar avisos manuais ou automáticos com valor e placa.",
    ],
    actionLabel: "Ver Pátio Lava-Jato",
  },
  {
    id: "oficina",
    title: "4. Oficina Mecânica & Ordens de Serviço",
    subtitle: "Orçamentos, diagnóstico, fotos de avarias e execução",
    icon: Wrench,
    badge: "Oficina & Mecânica",
    badgeColor: "bg-amber-100 text-amber-700 border-amber-300",
    route: "/oficina",
    content:
      "Fluxo completo de oficina: cadastro de checklist de entrada, diagnóstico técnico, registro de fotos de avarias pré-existentes, adição de serviços e peças, aprovação do orçamento e impressão da OS formatada com termos de garantia.",
    tips: [
      "Gere termos de garantia de 90 dias com assinatura do cliente.",
      "Vincule o mecânico responsável para comissão automática de mão de obra.",
    ],
    actionLabel: "Acessar Ordens de Serviço",
  },
  {
    id: "estoque",
    title: "5. Estoque de Peças & Importador XML",
    subtitle: "Margem de lucro, alerta de estoque mínimo e notas fiscais",
    icon: Package,
    badge: "Gestão de Estoque",
    badgeColor: "bg-purple-100 text-purple-700 border-purple-300",
    route: "/estoque",
    content:
      "Controle rigoroso de peças de reposição, óleos e filtros. Calcule margem de lucro sugerida e importe Notas Fiscais Eletrônicas em arquivo XML (.xml) dos seus fornecedores para cadastrar dezenas de peças de uma só vez com preços atualizados.",
    tips: [
      "Arraste arquivos XML de NF-e para alimentar o estoque automaticamente em 1 segundo.",
      "Monitore produtos abaixo do estoque mínimo para reposição rápida.",
    ],
    actionLabel: "Ver Estoque de Peças",
  },
  {
    id: "financeiro",
    title: "6. Caixa Diário & Gestão Financeira",
    subtitle: "Abertura de caixa, sangrias, contas a pagar e a receber",
    icon: CircleDollarSign,
    badge: "Financeiro & Caixa",
    badgeColor: "bg-indigo-100 text-indigo-700 border-indigo-300",
    route: "/financeiro",
    content:
      "Livro caixa completo: abertura de turno com fundo de troco, registro de sangrias (retiradas) e suprimentos (entradas extras), controle de Contas a Pagar a fornecedores, Contas a Receber a prazo e fechamento cego de caixa.",
    tips: [
      "Feche o caixa no fim do expediente com relatório impresso de conferência.",
      "Acompanhe o saldo líquido em tempo real de todas as operações.",
    ],
    actionLabel: "Acessar Financeiro",
  },
  {
    id: "crm",
    title: "7. CRM & WhatsApp Marketing Automático",
    subtitle: "Fidelização e retorno recorrente de clientes",
    icon: MessageSquare,
    badge: "CRM & Fidelização",
    badgeColor: "bg-rose-100 text-rose-700 border-rose-300",
    route: "/crm",
    content:
      "Aumente o faturamento trazendo os clientes de volta: disparo de lembrete de troca preventiva de óleo (a cada 6 meses), lembrete de lavagem para clientes sumidos e cupons promocionais de aniversário via WhatsApp oficial em segundo plano.",
    tips: [
      "Conecte seu WhatsApp lendo o QR Code nas Configurações.",
      "Envie mensagens em 1 clique sem abrir abas extras no navegador.",
    ],
    actionLabel: "Explorar CRM WhatsApp",
  },
  {
    id: "equipe",
    title: "8. Controle de Login, Usuários & Permissões",
    subtitle: "Bloqueio de menus e matriz de acessos por cargo",
    icon: Shield,
    badge: "Segurança & Perfis",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
    route: "/equipe",
    content:
      "Defina exatamente o que cada colaborador pode ver: o Administrador tem acesso total, enquanto Operadores de Lavagem e Mecânicos só visualizam os seus respectivos módulos de trabalho, mantendo o Caixa e Relatórios 100% protegidos.",
    tips: [
      "Alterne de operador rapidamente no topo direito da tela.",
      "Personalize quais módulos cada cargo pode acessar na aba 'Configurar Permissões'.",
    ],
    actionLabel: "Gerenciar Equipe & Permissões",
  },
  {
    id: "backup",
    title: "9. Backup Automático em Nuvem & Licença",
    subtitle: "Segurança máxima dos dados e operação 100% offline",
    icon: Cloud,
    badge: "Proteção & Ajustes",
    badgeColor: "bg-sky-100 text-sky-700 border-sky-300",
    route: "/configuracoes",
    content:
      "O sistema funciona 100% offline no seu computador e possui backup automático em 1 clique que sincroniza seu banco de dados com pastas do Google Drive, OneDrive ou Dropbox locais. Seus dados estão sempre seguros e sob seu controle.",
    tips: [
      "Gere backups manuais ou ative a sincronização diária em nuvem.",
      "Veja o status da sua licença vitalícia e configurações da oficina.",
    ],
    actionLabel: "Ir para Configurações & Backup",
  },
];

export function InteractiveTourModal({
  isOpen,
  onClose,
  initialStep = 0,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialStep?: number;
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStep);

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(initialStep);
    }
  }, [isOpen, initialStep]);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStepIndex];
  const Icon = step.icon;
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;
  const progressPercent = ((currentStepIndex + 1) / TOUR_STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp">
        {/* Top Header com Barra de Progresso */}
        <div className="bg-slate-900 p-4 sm:p-6 text-white relative flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 flex-shrink-0">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-black tracking-widest text-blue-400 block truncate">
                  Tour Interativo do Sistema
                </span>
                <h2 className="text-sm sm:text-lg font-bold truncate">{step.title}</h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-400 mt-1 pl-11 sm:pl-13 line-clamp-1">{step.subtitle}</p>

          {/* Barra de Progresso */}
          <div className="mt-3 sm:mt-4 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Corpo do Tutorial (Rolagem suave no celular) */}
        <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-[11px] sm:text-xs font-black px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border ${step.badgeColor}`}
            >
              {step.badge}
            </span>
            <span className="text-xs font-bold text-slate-400">
              Passo {currentStepIndex + 1} de {TOUR_STEPS.length}
            </span>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-white border border-slate-200 text-blue-600 shadow-sm flex-shrink-0">
              <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pt-0.5">
              {step.content}
            </p>
          </div>

          {/* Dicas Práticas de Uso */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              Dicas Práticas de Operação:
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {step.tips.map((tip, idx) => (
                <div
                  key={idx}
                  className="p-2.5 sm:p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs text-slate-700 flex items-start gap-2"
                >
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">
                    ✓
                  </span>
                  <span className="leading-relaxed">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer com Navegação Responsiva */}
        <div className="p-3 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
              disabled={isFirst}
              className="px-3 sm:px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold disabled:opacity-40 transition-all flex items-center gap-1 shadow-sm"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>

            <Link
              href="/manual"
              onClick={onClose}
              className="hidden md:flex items-center gap-1 px-2 py-2 text-xs font-bold text-blue-600 hover:underline"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Manual
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={step.route}
              onClick={onClose}
              className="px-3 sm:px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-all whitespace-nowrap"
            >
              {step.actionLabel || "Abrir Módulo"}
            </Link>

            {isLast ? (
              <button
                onClick={onClose}
                className="px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md shadow-emerald-500/20 transition-all whitespace-nowrap"
              >
                Concluir Tour ✓
              </button>
            ) : (
              <button
                onClick={() =>
                  setCurrentStepIndex((prev) =>
                    Math.min(TOUR_STEPS.length - 1, prev + 1)
                  )
                }
                className="px-4 sm:px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1 whitespace-nowrap"
              >
                <span>Próximo</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
