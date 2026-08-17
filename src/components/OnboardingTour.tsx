"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

export default function OnboardingTour() {
  const pathname = usePathname();
  const router = useRouter();
  const driverObjRef = useRef<any>(null);

  const startTour = () => {
    // Configura os passos com seletores reais dos menus e módulos da tela
    const steps: DriveStep[] = [
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
            "Convide seus mecânicos, atendentes e lavadores por e-mail. Eles receberão um link seguro para cadastrar suas próprias senhas com controle de permissões por perfil.",
          side: "right",
          align: "start",
        },
      },
      {
        element: "#tour-nav-estoque",
        popover: {
          title: "4. Estoque & Importação de XML",
          description:
            "Cadastre peças e insumos com preço de custo e estoque mínimo, ou suba o arquivo XML da nota fiscal (NF-e) do fornecedor para dar entrada automática em todo o estoque.",
          side: "right",
          align: "start",
        },
      },
      {
        element: "#tour-nav-oficina",
        popover: {
          title: "5. Oficina Mecânica & Ordens de Serviço",
          description:
            "Abra e gerencie ordens de serviço com registro de placa, checklist digital de avarias, fotos do veículo, peças utilizadas e atribuição direta ao mecânico responsável.",
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
      {
        element: "#tour-btn-guia",
        popover: {
          title: "🚀 Pronto para Começar!",
          description:
            "Você pode reabrir este Guia Passo a Passo a qualquer momento clicando neste botão no topo da tela ou no menu lateral.",
          side: "bottom",
          align: "end",
        },
      },
    ];

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
      steps,
      onDestroyed: () => {
        if (typeof window !== "undefined") {
          localStorage.setItem("torque_onboarding_completed", "true");
        }
      },
    });

    driverObjRef.current = driverInstance;
    driverInstance.drive();
  };

  useEffect(() => {
    // Abre automaticamente no primeiro acesso ao painel
    if (typeof window !== "undefined") {
      const hasSeenTour = localStorage.getItem("torque_onboarding_completed");
      const publicRoutes = ["/", "/login", "/cadastro", "/convite", "/sobre", "/termos", "/privacidade"];
      if (!hasSeenTour && !publicRoutes.includes(pathname)) {
        setTimeout(() => {
          startTour();
        }, 800);
      }
    }

    const handleOpenTour = () => {
      startTour();
    };

    window.addEventListener("torque:open-onboarding-tour", handleOpenTour);
    return () => {
      window.removeEventListener("torque:open-onboarding-tour", handleOpenTour);
      if (driverObjRef.current) {
        try {
          driverObjRef.current.destroy();
        } catch (e) {}
      }
    };
  }, [pathname]);

  return null;
}
