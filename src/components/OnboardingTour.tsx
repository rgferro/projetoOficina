"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Building,
  Smartphone,
  Wrench,
  Users,
  Package,
  FileText,
  Droplets,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export interface TourStep {
  id: string;
  title: string;
  category: string;
  description: string;
  tip?: string;
  route: string;
  icon: any;
  actionText: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "config_empresa",
    category: "1. Identidade da Empresa",
    title: "Verifique os Dados da sua Oficina",
    description:
      "Confira a Razão Social/Nome Fantasia, CNPJ/CPF, WhatsApp oficial e Endereço Completo da oficina. Esses dados são emitidos no topo das Ordens de Serviço (OS) e recibos impressos.",
    tip: "Os dados preenchidos no cadastro já estão sincronizados aqui.",
    route: "/configuracoes",
    icon: Building,
    actionText: "Acessar Ajustes da Oficina",
  },
  {
    id: "config_whatsapp",
    category: "2. Comunicação Automática",
    title: "Conecte o WhatsApp Oficial (QR Code)",
    description:
      "Aponte a câmera do seu celular para escanear o QR Code oficial. Com o aparelho conectado, o sistema dispara avisos de 'Carro Pronto', 'Orçamento Aprovado' e 'Troca de Óleo' de forma 100% silenciosa e em segundo plano.",
    tip: "Apenas 1 aparelho precisa ser pareado para atender toda a oficina.",
    route: "/configuracoes",
    icon: Smartphone,
    actionText: "Ir para Conexão WhatsApp",
  },
  {
    id: "tabela_servicos",
    category: "3. Catálogo & Mão de Obra",
    title: "Cadastre sua Tabela de Serviços",
    description:
      "Defina os serviços padronizados da sua oficina e do lava-jato (ex: Troca de Óleo + Filtro, Alinhamento & Balanceamento, Lavagem Completa + Cera) com valores sugeridos e tempo estimado.",
    tip: "Esses serviços agilizam a abertura de OS e vendas no PDV em 1 clique.",
    route: "/servicos-padrao",
    icon: Wrench,
    actionText: "Abrir Tabela de Serviços",
  },
  {
    id: "equipe_usuarios",
    category: "4. Equipe & Permissões",
    title: "Convide Mecânicos, Lavadores & Atendentes",
    description:
      "Cadastre os membros da sua equipe informando Nome, Cargo e E-mail. Cada colaborador receberá um convite por e-mail para definir sua própria senha com controle de permissões por perfil.",
    tip: "O dono não precisa criar senhas para terceiros, o fluxo é 100% seguro.",
    route: "/equipe",
    icon: Users,
    actionText: "Gerenciar Equipe",
  },
  {
    id: "estoque_pecas",
    category: "5. Estoque & Compras",
    title: "Cadastre Peças ou Importe XML da NF-e",
    description:
      "Cadastre filtros, óleos, pastilhas e insumos com preço de custo, margem de lucro e estoque mínimo. Você também pode importar a nota fiscal em XML do fornecedor para dar entrada automática em lote.",
    tip: "O sistema avisa automaticamente quando um item atinge o estoque crítico.",
    route: "/estoque",
    icon: Package,
    actionText: "Acessar Estoque & XML",
  },
  {
    id: "oficina_os",
    category: "6. Mecânica & Funilaria",
    title: "Abra Ordens de Serviço (OS) com Checklist",
    description:
      "Crie ordens de serviço digitais com registro de placa, fotos de avarias no veículo, checklist de entrada, peças utilizadas e atribuição direta ao mecânico responsável.",
    tip: "Ao aprovar o orçamento, envie o resumo pelo WhatsApp ao cliente.",
    route: "/oficina",
    icon: FileText,
    actionText: "Acessar Módulo Oficina & OS",
  },
  {
    id: "lavajato_patio",
    category: "7. Estética & Lava-Jato",
    title: "Controle a Esteira de Lavagens do Pátio",
    description:
      "Monitore o quadro Kanban de veículos [Aguardando ➔ Em Lavagem ➔ Pronto]. Ao concluir a lavagem, clique em 'Avisar no WhatsApp' para notificar o cliente na mesma hora.",
    tip: "Entrada rápida com placa avulsa para clientes de passagem.",
    route: "/lavajato",
    icon: Droplets,
    actionText: "Acessar Quadro de Pátio",
  },
  {
    id: "pdv_caixa",
    category: "8. Financeiro & Vendas",
    title: "PDV Balcão, Fechamento de Caixa & DRE",
    description:
      "Realize vendas rápidas de balcão, receba pagamentos por PIX (com QR Code copia e cola), Cartão ou Dinheiro e acompanhe o fluxo de caixa diário e relatórios de lucratividade.",
    tip: "O caixa controla sangrias, suprimentos e comissões por colaborador.",
    route: "/pdv",
    icon: CreditCard,
    actionText: "Acessar PDV & Caixa",
  },
];

export default function OnboardingTour() {
  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    // Verifica se o usuário já viu o tour ou se solicitou a reabertura
    const hasSeenTour = localStorage.getItem("torque_onboarding_completed");
    if (!hasSeenTour) {
      // Abre automaticamente na primeira visita ao painel (se não estiver na landing page ou auth)
      if (pathname !== "/" && pathname !== "/login" && pathname !== "/cadastro" && pathname !== "/convite") {
        setIsOpen(true);
      }
    }

    // Listener para reabrir o tour quando solicitado pelo botão do cabeçalho
    const handleOpenTour = () => {
      setCurrentStepIndex(0);
      setIsOpen(true);
    };

    window.addEventListener("torque:open-onboarding-tour", handleOpenTour);
    return () => {
      window.removeEventListener("torque:open-onboarding-tour", handleOpenTour);
    };
  }, [pathname]);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const StepIcon = currentStep.icon;
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  const handleClose = () => {
    localStorage.setItem("torque_onboarding_completed", "true");
    setIsOpen(false);
  };

  const handleNext = () => {
    if (isLast) {
      handleClose();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleNavigateToStep = () => {
    if (pathname !== currentStep.route) {
      router.push(currentStep.route);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      {/* Container do Tooltip estilo Onboarding Card */}
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden relative transform transition-all duration-300 scale-100">
        
        {/* Barra de Progresso Superior */}
        <div className="w-full bg-slate-100 h-1.5 flex">
          {TOUR_STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-full flex-1 transition-all duration-300 ${
                idx <= currentStepIndex ? "bg-blue-600" : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        {/* Top Header do Card */}
        <div className="p-6 pb-4 flex items-start justify-between gap-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm flex-shrink-0">
              <StepIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 inline-block mb-1">
                {currentStep.category}
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {currentStep.title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors flex-shrink-0"
            title="Fechar Tutorial"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conteúdo Explicativo */}
        <div className="p-6 space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {currentStep.description}
          </p>

          {currentStep.tip && (
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
              <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Dica de Ouro:</strong> {currentStep.tip}
              </span>
            </div>
          )}

          {/* Botão de Ação Direta para a Tela */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleNavigateToStep}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
            >
              <span>{currentStep.actionText}</span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
            </button>
          </div>
        </div>

        {/* Rodapé com Navegação (Anterior, Contador, Próximo) */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-500">
            Passo <strong className="text-slate-900">{currentStepIndex + 1}</strong> de {TOUR_STEPS.length}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={isFirst}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                isLast
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20"
              }`}
            >
              <span>{isLast ? "Concluir Guia" : "Próximo"}</span>
              {isLast ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
