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
      // ADMIN & GERENTE (Fluxo sequencial completo)
      rawSteps = [
        {
          element: "#tour-nav-configuracoes",
          popover: {
            title: "1. Dados Oficiais & Ajustes da Oficina",
            description:
              "Comece conferindo os dados da sua empresa: Nome da Oficina, CNPJ/CPF, Telefone e Endereço Completo. Eles saem impressos nas OS, ordens de serviço e recibos térmicos.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-nav-servicos",
          popover: {
            title: "2. Tabela de Serviços & Mão de Obra",
            description:
              "Cadastre seus serviços padronizados e lavagens (Troca de Óleo, Alinhamento, Lavagem Completa) com valores pré-definidos para agilizar a abertura de OS e vendas no PDV em 1 clique.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-nav-equipe",
          popover: {
            title: "3. Equipe & Colaboradores",
            description:
              "Cadastre seus mecânicos, atendentes e lavadores por e-mail ou definindo a senha diretamente, controlando permissões de cada perfil.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-nav-estoque",
          popover: {
            title: "4. Estoque & Importação de XML",
            description:
              "Cadastre peças e insumos com preço de custo e estoque mínimo, ou suba o arquivo XML da nota fiscal (NF-e) do fornecedor para dar entrada automática em lote.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-nav-oficina",
          popover: {
            title: "5. Oficina Mecânica & Ordens de Serviço",
            description:
              "Abra e gerencie ordens de serviço com registro de placa, checklist digital de avarias, fotos do veículo, peças utilizadas e atribuição direta ao mecânico.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-nav-lavajato",
          popover: {
            title: "6. Estética Automotiva & Lava-Jato",
            description:
              "Acompanhe a esteira de lavagens do pátio em tempo real no Kanban [Aguardando ➔ Em Lavagem ➔ Pronto] e avise o cliente pelo WhatsApp com 1 clique.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-nav-pdv",
          popover: {
            title: "7. PDV Balcão & Caixa",
            description:
              "Realize vendas rápidas no balcão, receba pagamentos por PIX automático, Cartão ou Dinheiro e faça o controle de sangrias, suprimentos e comissões.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-nav-crm",
          popover: {
            title: "8. CRM & Lembretes no WhatsApp",
            description:
              "Monitore clientes inativos e envie lembretes preventivos de troca de óleo (6 meses) e lavagem com templates inteligentes.",
            side: "right",
            align: "start",
          },
        },
      ];
    }

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
