import { DriveStep } from "driver.js";

export interface PageTourDefinition {
  title: string;
  steps: DriveStep[];
}

export const PAGE_TOURS: Record<string, PageTourDefinition> = {
  // 1. DASHBOARD
  "/dashboard": {
    title: "Tutorial do Dashboard Geral",
    steps: [
      {
        element: "#dash-metrics-grid",
        popover: {
          title: "1. Métricas Financeiras & Faturamento",
          description:
            "Acompanhe o faturamento bruto do dia, faturamento do mês, total de Ordens de Serviço abertas e ticket médio da oficina em tempo real.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#dash-quick-actions",
        popover: {
          title: "2. Atalhos Operacionais Rápidos",
          description:
            "Acesse diretamente os fluxos de maior volume: Entrada de Lava-Jato, Nova OS de Mecânica ou Venda Rápida no PDV.",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: "#dash-recent-activities",
        popover: {
          title: "3. Fluxo de Pátio & Atividades Recentes",
          description:
            "Veja a esteira de serviços em andamento, veículos que estão sendo lavados e OS que aguardam retirada pelo cliente.",
          side: "top",
          align: "start",
        },
      },
      {
        element: "#tour-btn-guia",
        popover: {
          title: "4. Guia Geral do Administrador",
          description:
            "Clique aqui a qualquer momento para rever o passo a passo de configuração inicial de toda a oficina.",
          side: "bottom",
          align: "end",
        },
      },
    ],
  },

  // 2. CONFIGURAÇÕES & WHATSAPP
  "/configuracoes": {
    title: "Tutorial de Ajustes da Oficina & WhatsApp",
    steps: [
      {
        element: "#config-company-card",
        popover: {
          title: "1. Dados Oficiais da Empresa",
          description:
            "Estes são o Nome da Oficina, CNPJ/CPF, Telefone e Endereço Completo informados no seu cadastro. Eles são impressos no cabeçalho de todas as Ordens de Serviço e recibos térmicos.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#config-whatsapp-card",
        popover: {
          title: "2. Conexão Oficial do WhatsApp (QR Code)",
          description:
            "Aponte a câmera do seu celular no botão 'Escanear QR Code' para parear o WhatsApp oficial da sua oficina. Com ele conectado, todos os disparos ocorrem de forma 100% silenciosa e em segundo plano.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#config-templates-card",
        popover: {
          title: "3. Modelos de Mensagens do WhatsApp",
          description:
            "Personalize as mensagens automáticas usando variáveis dinâmicas como {nome}, {veiculo}, {placa}, {valor} e {oficina}. O sistema preenche os dados do cliente automaticamente.",
          side: "top",
          align: "start",
        },
      },
      {
        element: "#config-backup-card",
        popover: {
          title: "4. Backup & Segurança dos Dados",
          description:
            "Crie cópias de segurança instantâneas do seu banco de dados na nuvem com 1 clique para garantir que sua oficina nunca perca históricos ou cadastros.",
          side: "top",
          align: "start",
        },
      },
      {
        element: "#config-save-btn",
        popover: {
          title: "5. Salvar Alterações",
          description:
            "Após ajustar os dados da empresa ou os modelos de mensagem, clique em 'Salvar Configurações' para aplicar em todo o sistema.",
          side: "left",
          align: "center",
        },
      },
    ],
  },

  // 3. TABELA DE SERVIÇOS
  "/servicos": {
    title: "Tutorial da Tabela de Serviços Padronizados",
    steps: [
      {
        element: "#servicos-new-btn",
        popover: {
          title: "1. Cadastrar Novo Serviço",
          description:
            "Clique aqui para cadastrar um serviço padrão (ex: Troca de Óleo + Filtro, Alinhamento, Lavagem Completa, Revisão Geral) com preço de referência e tempo estimado.",
          side: "bottom",
          align: "end",
        },
      },
      {
        element: "#servicos-filters",
        popover: {
          title: "2. Filtro por Categoria",
          description:
            "Filtre os serviços por categoria: Mecânica Geral, Elétrica, Estética & Lava-Jato, Funilaria e Revisão Preventiva.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#servicos-table",
        popover: {
          title: "3. Catálogo de Preços & Mão de Obra",
          description:
            "Todos os serviços cadastrados aqui ficam disponíveis na hora de abrir uma Nova OS e também na aba de 'Serviços' do PDV Balcão, agilizando as vendas.",
          side: "top",
          align: "start",
        },
      },
    ],
  },

  // 4. EQUIPE & USUÁRIOS
  "/equipe": {
    title: "Tutorial de Gestão de Equipe & Permissões",
    steps: [
      {
        element: "#equipe-invite-btn",
        popover: {
          title: "1. Convidar Novo Colaborador",
          description:
            "Clique para cadastrar um mecânico, lavador, atendente ou gerente informando nome, cargo e e-mail.",
          side: "bottom",
          align: "end",
        },
      },
      {
        element: "#equipe-roles-info",
        popover: {
          title: "2. Níveis de Acesso & Segurança",
          description:
            "O sistema aplica permissões rígidas por perfil: Mecânicos e Lavadores só veem suas respectivas OS e pátio, enquanto Gerentes e Administradores acessam o caixa e relatórios.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#equipe-list-table",
        popover: {
          title: "3. Status de Convite & Senha",
          description:
            "O colaborador recebe um link seguro por e-mail para criar a própria senha. Você pode reenviar o convite ou ativar/desativar qualquer membro a qualquer momento.",
          side: "top",
          align: "start",
        },
      },
    ],
  },

  // 5. ESTOQUE DE PEÇAS & XML
  "/estoque": {
    title: "Tutorial de Estoque de Peças & Importação XML",
    steps: [
      {
        element: "#estoque-new-btn",
        popover: {
          title: "1. Cadastrar Peça / Insumo",
          description:
            "Cadastre manualmente pastilhas, filtros, óleos e peças informando código, preço de custo, preço de venda e estoque mínimo.",
          side: "bottom",
          align: "end",
        },
      },
      {
        element: "#estoque-xml-btn",
        popover: {
          title: "2. Importador de Notas Fiscais (XML NF-e)",
          description:
            "Suba o arquivo XML da nota fiscal emitida pelo seu fornecedor de autopeças. O sistema cadastra todos os produtos e atualiza as quantidades em lote automaticamente!",
          side: "bottom",
          align: "end",
        },
      },
      {
        element: "#estoque-critical-alert",
        popover: {
          title: "3. Alerta de Estoque Crítico",
          description:
            "Itens abaixo do estoque mínimo ficam destacados em vermelho para que você nunca fique sem peças essenciais durante um atendimento.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#estoque-search-input",
        popover: {
          title: "4. Busca Rápida por Código ou Nome",
          description:
            "Localize qualquer produto instantaneamente digitando o código de barras, SKU ou descrição da peça.",
          side: "bottom",
          align: "start",
        },
      },
    ],
  },

  // 6. OFICINA & ORDENS DE SERVIÇO (OS)
  "/oficina": {
    title: "Tutorial de Mecânica & Ordens de Serviço (OS)",
    steps: [
      {
        element: "#oficina-new-os-btn",
        popover: {
          title: "1. Abrir Nova Ordem de Serviço",
          description:
            "Inicie uma nova OS selecionando o cliente e veículo (ou cadastrando na hora) com registro de placa e quilometragem atual.",
          side: "bottom",
          align: "end",
        },
      },
      {
        element: "#oficina-kanban-board",
        popover: {
          title: "2. Quadro Kanban de Status",
          description:
            "Arraste ou avance as ordens de serviço pelas fases: [Diagnóstico ➔ Aguardando Peças ➔ Em Execução ➔ Concluído].",
          side: "top",
          align: "start",
        },
      },
      {
        element: "#oficina-os-card",
        popover: {
          title: "3. Card da Ordem de Serviço",
          description:
            "Cada card exibe o veículo, mecânico responsável, valor total das peças e mão de obra, além de botões rápidos para WhatsApp e impressão da OS.",
          side: "right",
          align: "start",
        },
      },
    ],
  },

  // 7. LAVA-JATO & PÁTIO
  "/lavajato": {
    title: "Tutorial de Estética Automotiva & Lava-Jato",
    steps: [
      {
        element: "#lavajato-new-btn",
        popover: {
          title: "1. Nova Entrada no Pátio (Cadastro Rápido)",
          description:
            "Clique aqui para dar entrada em um veículo. Para clientes de passagem, use o 'Modo Expresso' digitando apenas a placa, modelo e telefone!",
          side: "bottom",
          align: "end",
        },
      },
      {
        element: "#lavajato-kanban-board",
        popover: {
          title: "2. Esteira de Lavagens em Tempo Real",
          description:
            "Acompanhe os carros em 4 etapas claras: [Aguardando ➔ Em Lavagem ➔ Pronto / Finalizado ➔ Entregues Recentes].",
          side: "top",
          align: "start",
        },
      },
      {
        element: "#lavajato-whatsapp-action",
        popover: {
          title: "3. Botão 'Avisar no WhatsApp'",
          description:
            "Quando a lavagem estiver concluída, clique neste botão para disparar a notificação oficial com o valor ao cliente de forma 100% silenciosa em segundo plano.",
          side: "left",
          align: "center",
        },
      },
      {
        element: "#lavajato-deliver-action",
        popover: {
          title: "4. Entregar & Dar Baixa no Caixa",
          description:
            "Clique para registrar o recebimento (PIX, Cartão ou Dinheiro). O valor é lançado no caixa diário automaticamente e o carro é movido para Entregues.",
          side: "left",
          align: "center",
        },
      },
    ],
  },

  // 8. PDV BALCÃO & CAIXA
  "/pdv": {
    title: "Tutorial do PDV Balcão & Vendas Rápidas",
    steps: [
      {
        element: "#pdv-catalog-tabs",
        popover: {
          title: "1. Abas de Catálogo (Peças vs. Serviços)",
          description:
            "Alterne facilmente entre a venda de Peças do Estoque (filtros, óleos, aditivos) e Serviços Padronizados (mão de obra e lavagens).",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#pdv-catalog-grid",
        popover: {
          title: "2. Seleção de Itens em 1 Clique",
          description:
            "Clique em qualquer item para adicionar instantaneamente ao carrinho de compras com foto, preço e estoque disponível.",
          side: "right",
          align: "start",
        },
      },
      {
        element: "#pdv-cart-summary",
        popover: {
          title: "3. Carrinho & Descontos",
          description:
            "Ajuste quantidades, aplique descontos em porcentagem ou reais e selecione o atendente para comissionamento.",
          side: "left",
          align: "start",
        },
      },
      {
        element: "#pdv-payment-methods",
        popover: {
          title: "4. Formas de Pagamento & PIX Instantâneo",
          description:
            "Escolha PIX (gera QR Code Copia e Cola na hora), Cartão de Crédito/Débito ou Dinheiro para fechar a venda e imprimir o comprovante.",
          side: "left",
          align: "center",
        },
      },
    ],
  },

  // 9. CAIXA & FINANCEIRO
  "/financeiro": {
    title: "Tutorial de Caixa & Livro Financeiro",
    steps: [
      {
        element: "#fin-balance-cards",
        popover: {
          title: "1. Saldo do Dia & Entradas/Saídas",
          description:
            "Veja o saldo consolidado em dinheiro, PIX e cartão, além do total de receitas e despesas lançadas no período.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#fin-actions-bar",
        popover: {
          title: "2. Sangrias & Suprimentos de Caixa",
          description:
            "Lance retiradas para pagamento de fornecedores (Sangria) ou aportes de troco inicial (Suprimento) mantendo o caixa 100% auditável.",
          side: "bottom",
          align: "end",
        },
      },
      {
        element: "#fin-transactions-table",
        popover: {
          title: "3. Extrato Detalhado de Movimentações",
          description:
            "Todas as vendas de PDV, OS concluídas e lavagens entregues aparecem aqui em ordem cronológica com filtros por método de pagamento.",
          side: "top",
          align: "start",
        },
      },
    ],
  },

  // 10. CRM WHATSAPP
  "/crm": {
    title: "Tutorial de CRM & Retenção de Clientes no WhatsApp",
    steps: [
      {
        element: "#crm-retention-tabs",
        popover: {
          title: "1. Segmentos de Retenção Inteligente",
          description:
            "O sistema monitora automaticamente 3 grupos vitais: [Troca de Óleo Vencendo (6 meses)], [Clientes Sumidos (>60 dias)] e [Aniversariantes do Mês].",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#crm-clients-list",
        popover: {
          title: "2. Disparo em 1 Clique com Template Personalizado",
          description:
            "Clique em 'Enviar Lembrete' para disparar uma mensagem cordial pelo WhatsApp oficial da oficina com o nome do cliente e placa do carro.",
          side: "top",
          align: "start",
        },
      },
    ],
  },

  // 11. RELATÓRIOS & BI
  "/relatorios": {
    title: "Tutorial de Relatórios Gerenciais & Comissões",
    steps: [
      {
        element: "#rel-commissions-card",
        popover: {
          title: "1. Comissões da Equipe",
          description:
            "Apure exatamente o valor gerado por cada mecânico e lavador no mês para facilitar o fechamento de folha e bonificação.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#rel-top-services",
        popover: {
          title: "2. Serviços & Peças Mais Vendidos",
          description:
            "Identifique quais serviços trazem mais lucro para sua oficina e quais peças têm maior giro de estoque.",
          side: "top",
          align: "start",
        },
      },
    ],
  },
};
