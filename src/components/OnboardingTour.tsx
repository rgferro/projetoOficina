"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useAuth } from "@/lib/authContext";

export default function OnboardingTour() {
  const pathname = usePathname();
  const { currentEmployee } = useAuth();
  const driverObjRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTour = () => {
    // Destrói qualquer instância ativa do Driver.js antes de iniciar
    if (driverObjRef.current) {
      try {
        driverObjRef.current.destroy();
      } catch (e) {}
      driverObjRef.current = null;
    }

    const role = currentEmployee?.accessLevel || "ADMIN";
    let rawSteps: DriveStep[] = [];

    if (role === "MECANICO") {
      rawSteps = [
        {
          element: "#tour-nav-oficina",
          popover: {
            title: "1. Minhas Ordens de Serviço (OS)",
            description:
              "Aqui você gerencia os veículos em manutenção, preenche o checklist de avarias e fotos, e acompanha os serviços sob sua responsabilidade.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-nav-servicos",
          popover: {
            title: "2. Tabela de Mão de Obra",
            description:
              "Consulte o catálogo de serviços padronizados da oficina e tempo estimado de execução de cada tarefa.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-nav-estoque",
          popover: {
            title: "3. Consulta de Peças no Estoque",
            description:
              "Verifique rapidamente a disponibilidade de peças, filtros, óleos e insumos em estoque para aplicar nas ordens de serviço.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-nav-clientes",
          popover: {
            title: "4. Histórico de Veículos & Clientes",
            description:
              "Consulte os dados dos veículos atendidos e histórico de manutenções anteriores.",
            side: "right",
            align: "start",
          },
        },
      ];
    } else if (role === "LAVADOR") {
      rawSteps = [
        {
          element: "#tour-nav-lavajato",
          popover: {
            title: "1. Esteira do Lava-Jato no Pátio",
            description:
              "Seu painel principal de trabalho! Acompanhe os veículos em 4 colunas: [Aguardando ➔ Em Lavagem ➔ Pronto para Retirada ➔ Entregues].",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-nav-clientes",
          popover: {
            title: "2. Cadastro de Veículos & Clientes",
            description:
              "Localize veículos e placas atendidas no pátio para rápida conferência.",
            side: "right",
            align: "start",
          },
        },
      ];
    } else if (role === "ATENDENTE") {
      rawSteps = [
        {
          element: "#tour-nav-pdv",
          popover: {
            title: "1. PDV Balcão & Caixa Rápido",
            description:
              "Realize vendas de peças e serviços no balcão com leitor de código de barras e recebimento em PIX instantâneo ou Cartão.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-nav-lavajato",
          popover: {
            title: "2. Entrada Rápida no Lava-Jato",
            description:
              "Dê entrada em veículos de passagem usando o Modo Expresso com apenas placa e telefone do cliente.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-nav-oficina",
          popover: {
            title: "3. Recepção & Abertura de OS",
            description:
              "Abra ordens de serviço para a oficina mecânica e imprima o comprovante de entrada para o cliente.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-nav-crm",
          popover: {
            title: "4. CRM & Avisos no WhatsApp",
            description:
              "Dispare lembretes de revisão e acompanhe clientes que não visitam a oficina há mais de 60 dias.",
            side: "right",
            align: "start",
          },
        },
      ];
    } else {
      // ADMIN & GERENTE (Fluxo sequencial completo de todos os módulos)
      rawSteps = [
        {
          element: "#tour-nav-dashboard",
          popover: {
            title: "1. Dashboard & Faturamento Geral",
            description:
              "Visão geral dos números da oficina: faturamento do dia, lavagens ativas no pátio e ordens de serviço em andamento em tempo real.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-nav-pdv",
          popover: {
            title: "2. PDV Balcão & Venda Rápida",
            description:
              "Atendimento ágil de balcão para venda de peças e serviços com leitor de código de barras e pagamento em PIX Copia e Cola automático.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-nav-lavajato",
          popover: {
            title: "3. Estética Automotiva & Lava-Jato",
            description:
              "Acompanhe a esteira de lavagens do pátio em tempo real no Kanban [Aguardando ➔ Em Lavagem ➔ Pronto] e avise o cliente pelo WhatsApp com 1 clique.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-nav-oficina",
          popover: {
            title: "4. Oficina Mecânica & Ordens de Serviço (OS)",
            description:
              "Abra e gerencie ordens de serviço completas com checklist de avarias, fotos do veículo, peças utilizadas e atribuição direta aos mecânicos.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-nav-estoque",
          popover: {
            title: "5. Estoque & Importador XML NF-e",
            description:
              "Controle pastilhas, óleos e filtros. Importe arquivos XML das notas fiscais de autopeças para alimentar quantidades e preços em lote com 1 clique.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-nav-servicos",
          popover: {
            title: "6. Tabela de Serviços & Mão de Obra",
            description:
              "Cadastre serviços padronizados (Troca de Óleo, Alinhamento, Lavagens) com preços de tabela para puxar automaticamente nas OS e no PDV.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-nav-fornecedores",
          popover: {
            title: "7. Fornecedores & Distribuidores",
            description:
              "Cadastre distribuidoras de autopeças com dados de contato dos vendedores e chaves PIX salvas para agilizar pagamentos.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-nav-clientes",
          popover: {
            title: "8. Clientes & Veículos (Frota)",
            description:
              "Cadastro unificado com histórico completo de ordens de serviço anteriores, histórico de lavagens e múltiplos veículos por cliente.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-nav-equipe",
          popover: {
            title: "9. Equipe & Permissões por Cargo",
            description:
              "Cadastre mecânicos, atendentes e lavadores controlando níveis de acesso para proteger o caixa e relatórios financeiros.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-nav-financeiro",
          popover: {
            title: "10. Caixa Diário & Gestão Financeira",
            description:
              "Abertura de turno com fundo de troco, sangrias de despesas, suprimentos, contas a pagar a fornecedores e extrato detalhado de transações.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-nav-relatorios",
          popover: {
            title: "11. Relatórios Estratégicos & BI",
            description:
              "Curva ABC dos produtos mais lucrativos, apuração de comissões de mecânicos e lavadores e lembrete de aniversariantes do mês.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-nav-crm",
          popover: {
            title: "12. CRM & Retenção no WhatsApp",
            description:
              "Dispare lembretes preventivos de troca de óleo (6 meses) e convite de lavagem para clientes ausentes (+15 dias) em 1 clique.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-nav-assinatura",
          popover: {
            title: "13. Assinatura & Planos SaaS",
            description:
              "Gerencie seu plano (Starter Grátis, Pro ou Elite), adicione assentos de usuários e faça upgrades imediatos via PIX automático.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-nav-configuracoes",
          popover: {
            title: "14. Dados Oficiais da Oficina & WhatsApp",
            description:
              "Configure o nome, CNPJ e endereço da oficina para impressão em recibos térmicos, conecte o WhatsApp por QR Code e gere backups em nuvem.",
            side: "right",
            align: "start",
          },
        },
      ];
    }

    // Se estiver no mobile e os elementos do menu da sidebar não estiverem visíveis, tenta abrir o menu
    const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
    if (isMobile) {
      // Dispara evento para abrir o sidebar mobile caso esteja fechado
      window.dispatchEvent(new CustomEvent("torque:open-mobile-sidebar"));
    }

    // Aguarda um tick para garantir renderização dos elementos do menu
    setTimeout(() => {
      // Filtra apenas passos cujos elementos existem na tela
      const validSteps = rawSteps.filter((s) => {
        if (typeof s.element === "string") {
          return !!document.querySelector(s.element);
        }
        return true;
      });

      if (validSteps.length === 0) return;

      const driverInstance = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        overlayColor: "rgba(15, 23, 42, 0.75)",
        stagePadding: 6,
        stageRadius: 14,
        popoverClass: "torque-driver-popover",
        nextBtnText: "Próximo →",
        prevBtnText: "← Anterior",
        doneBtnText: "✓ Concluir Guia",
        steps: validSteps,
        onDestroyed: () => {
          driverObjRef.current = null;
          if (typeof window !== "undefined") {
            const userKey = currentEmployee?.id || "guest";
            localStorage.setItem(`torque_tour_seen_${userKey}`, "true");
          }
        },
      });

      driverObjRef.current = driverInstance;
      driverInstance.drive();
    }, isMobile ? 250 : 50);
  };

  useEffect(() => {
    // Cancela qualquer timer pendente anterior para evitar abertura duplicada
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (typeof window !== "undefined") {
      const userKey = currentEmployee?.id || "guest";
      const hasSeenTour = localStorage.getItem(`torque_tour_seen_${userKey}`);
      const publicRoutes = ["/", "/login", "/cadastro", "/convite", "/sobre", "/termos", "/privacidade"];

      // Auto-inicia apenas para administradores/gerentes no primeiro acesso após a tela carregar
      const isAdminOrManager = !currentEmployee || currentEmployee.accessLevel === "ADMIN" || currentEmployee.accessLevel === "GERENTE";
      if (!hasSeenTour && isAdminOrManager && !publicRoutes.includes(pathname)) {
        timerRef.current = setTimeout(() => {
          startTour();
        }, 1200);
      }
    }

    const handleOpenTour = () => {
      startTour();
    };

    window.addEventListener("torque:open-onboarding-tour", handleOpenTour);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      window.removeEventListener("torque:open-onboarding-tour", handleOpenTour);
      if (driverObjRef.current) {
        try {
          driverObjRef.current.destroy();
        } catch (e) {}
        driverObjRef.current = null;
      }
    };
  }, [pathname, currentEmployee?.id, currentEmployee?.accessLevel]);

  return null;
}
