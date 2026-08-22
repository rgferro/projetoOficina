// Base de Conhecimento e Motor de IA Nativo Especializado do Torque ERP

export interface ActionLink {
  label: string;
  url: string;
  icon?: string;
}

export interface AiResponse {
  reply: string;
  actions?: ActionLink[];
  suggestions?: string[];
  source?: "gemini" | "openai" | "groq" | "local-engine";
}

export const SYSTEM_PROMPT = `
Você é o **Torque IA**, o assistente virtual inteligente e especialista em gestão automotiva integrado ao sistema **Torque ERP**.
Sua missão é dar suporte humanizado, rápido, claro, empático e prático para donos de oficinas mecânicas, centros automotivos, lava-jatos e autocenters.

SOBRE O TORQUE ERP:
1. **Oficina & Pátio Kanban**: Controle total de Ordens de Serviço (OS), checklist de entrada com fotos, serviços executados, peças aplicadas, mecânico responsável e histórico por placa (Padrão Mercosul e antigo). Status: Aguardando, Em Análise, Em Execução, Pronto e Entregue. Rota: /oficina
2. **Lava-Jato & Estética**: Fila de lavagem rápida, tipos de lavagem (Simples, Completa, Cera, Higienização), lavadores responsáveis e checklist. Rota: /lavajato
3. **PDV & Peças (Ponto de Venda)**: Venda rápida de balcão para peças e acessórios, controle de descontos, carrinho ágil e múltiplos métodos de pagamento (Dinheiro, PIX, Cartão). Rota: /pdv
4. **Estoque & Produtos**: Cadastro de peças, controle de código de barras/SKU, estoque mínimo com alertas e histórico de fornecedores. Rota: /estoque
5. **Clientes & Veículos**: Cadastro unificado de clientes (CPF/CNPJ, WhatsApp) com vinculação de veículos por placa e modelo. Rotas: /clientes e /veiculos
6. **Financeiro & Caixa**: Livro caixa em tempo real, contas a pagar e receber, DRE gerencial, fluxo de caixa e relatórios de lucratividade. Rota: /financeiro
7. **CRM & WhatsApp**: Disparos automáticos e conexão via QR Code. Avisa o cliente quando o orçamento está pronto, quando o carro foi finalizado e envia lembretes preventivos de revisão e troca de óleo. Rota: /crm
8. **Equipe & Mecânicos**: Cadastro de colaboradores (Mecânicos, Lavadores, Atendentes) e controle de comissões e produtividade. Rota: /equipe
9. **Relatórios**: Métricas de faturamento, serviços mais rentáveis, produtividade e ticket médio. Rota: /relatorios
10. **Planos & Assinatura**: Starter (Gratuito), Torque Oficina Pro (R$ 69,90/mês) e Torque Oficina Elite (R$ 129,90/mês) com pagamentos via PIX/Mercado Pago. Rota: /assinatura

DIRETRIZES DE RESPOSTA:
- Seja sempre objetivo, amigável e resolutivo.
- Utilize formatação Markdown limpa (tópicos com marcadores, negrito para destacar botões e passos).
- Quando explicar um procedimento, estruture em passos simples (Ex: "Passo 1:", "Passo 2:").
- Se apropriado, mencione a tela ou rota para o usuário acessar diretamente.
- Nunca invente funcionalidades que não existem no ERP.
`;

interface KnowledgeTopic {
  keywords: string[];
  title: string;
  response: string;
  actions: ActionLink[];
  suggestions: string[];
}

const KNOWLEDGE_BASE: KnowledgeTopic[] = [
  {
    keywords: ["os", "ordem de serviço", "ordem", "servico", "abrir os", "criar os", "nova os", "conserto", "reparo", "kanban"],
    title: "Como Criar e Gerenciar Ordens de Serviço (OS)",
    response: `### 📋 Como Criar uma Nova Ordem de Serviço:

1. Acesse o menu **Oficina** no painel lateral.
2. Clique no botão **"+ Nova Ordem de Serviço"** no topo da tela.
3. Selecione ou cadastre o **Cliente** e o **Veículo** (pela placa).
4. Preencha o relato do cliente, quilometragem atual e nível de combustível.
5. Adicione os **Serviços** (mão de obra) e **Peças** necessárias.
6. Associe o **Mecânico Responsável** e salve a OS.

💡 *Dica:* Você pode acompanhar o status da OS diretamente pelo **Quadro Kanban de Pátio** arrastando os cartões entre *Aguardando*, *Em Execução* e *Pronto*!`,
    actions: [
      { label: "Ir para Oficina", url: "/oficina" },
      { label: "Cadastrar Cliente", url: "/clientes" },
    ],
    suggestions: ["Como mudar o status da OS?", "Como enviar OS pelo WhatsApp?", "Como adicionar peças na OS?"],
  },
  {
    keywords: ["whatsapp", "conectar whatsapp", "qr code", "notificacao", "notificar cliente", "aviso", "disparo"],
    title: "Integração e Automação de WhatsApp",
    response: `### 📲 Conectando e Usando o WhatsApp no Torque ERP:

1. Acesse o menu **CRM & WhatsApp** na barra lateral.
2. Na aba de conexão, clique em **"Gerar QR Code"**.
3. Abra o WhatsApp no seu celular, vá em **Aparelhos Conectados > Conectar um aparelho** e aponte a câmera.
4. Após conectar, o sistema poderá:
   - Enviar orçamentos e aprovações com 1 clique;
   - Notificar o cliente quando o veículo estiver **Pronto para Retirada**;
   - Disparar lembretes preventivos de **Troca de Óleo e Revisão**.`,
    actions: [
      { label: "Conectar WhatsApp", url: "/crm" },
      { label: "Configurar Notificações", url: "/configuracoes" },
    ],
    suggestions: ["Como enviar aviso de carro pronto?", "Como funciona o lembrete de troca de óleo?"],
  },
  {
    keywords: ["pdv", "balcao", "venda", "venda rapida", "peca", "caixa", "vender peca"],
    title: "Como Realizar Vendas Rápidas no PDV Balcão",
    response: `### 🛒 Realizando uma Venda no PDV:

1. Abra a tela de **PDV** no menu lateral.
2. Busque os produtos pelo **Nome**, **Código SKU** ou leitor de código de barras.
3. Ajuste as quantidades e aplique descontos se necessário.
4. Clique em **"Finalizar Venda"**.
5. Selecione a forma de pagamento (**PIX, Cartão ou Dinheiro**) e confirme.

O estoque é baixado instantaneamente e a venda é lançada no seu **Livro Caixa**!`,
    actions: [
      { label: "Abrir PDV Balcão", url: "/pdv" },
      { label: "Ver Estoque de Peças", url: "/estoque" },
    ],
    suggestions: ["Como cadastrar peças no estoque?", "Como dar desconto no PDV?"],
  },
  {
    keywords: ["lava jato", "lavajato", "lavagem", "ducha", "higienizacao", "polimento", "cera"],
    title: "Módulo Lava-Jato e Estética Automotiva",
    response: `### 🚿 Gerenciando o Lava-Jato:

1. Acesse o menu **Lava-Jato**.
2. Clique em **"+ Nova Lavagem"**.
3. Informe a placa do veículo e escolha o tipo de serviço (ex: *Simples, Completa, Polimento, Higienização*).
4. Defina o lavador responsável e inicie o atendimento.
5. Quando finalizado, basta marcar como concluído para gerar o recebimento e notificar o cliente via WhatsApp.`,
    actions: [
      { label: "Acessar Lava-Jato", url: "/lavajato" },
      { label: "Tabela de Preços", url: "/configuracoes" },
    ],
    suggestions: ["Como criar tipos de lavagem?", "Como comissionar lavadores?"],
  },
  {
    keywords: ["financeiro", "caixa", "dre", "contas", "pagar", "receber", "faturamento", "lucro", "despesa"],
    title: "Controle Financeiro e Fluxo de Caixa",
    response: `### 💰 Gestão Financeira Completa:

No menu **Financeiro**, você conta com:
- **Fluxo de Caixa em Tempo Real:** Registro automático de todas as entradas de OS e PDV.
- **Contas a Pagar / Receber:** Cadastre despesas fixas (aluguel, luz) e peças a prazo.
- **DRE Simplificado:** Visão clara de Receita Bruta, Custos Operacionais e Lucro Líquido.
- **Filtros por Período:** Analise o dia, mês ou ano com relatórios prontos para exportar.`,
    actions: [
      { label: "Abrir Financeiro", url: "/financeiro" },
      { label: "Ver Relatórios", url: "/relatorios" },
    ],
    suggestions: ["Como lançar uma despesa?", "Como ver o faturamento do mês?"],
  },
  {
    keywords: ["plano", "planos", "assinatura", "preco", "pagar", "pro", "elite", "starter", "renovar", "mensalidade", "pix"],
    title: "Planos e Assinaturas do Torque ERP",
    response: `### 🏆 Nossos Planos Disponíveis:

- **Starter (Gratuito):** Ideal para quem está começando. Permite até 30 OS/mês e PDV de peças.
- **Torque Oficina Pro (R$ 69,90/mês):** Sem limite de ordens de serviço, checklist com fotos e envio de WhatsApp.
- **Torque Oficina Elite (R$ 129,90/mês):** Tudo do Pro + Multi-usuários ilimitados, CRM avançado e suporte prioritário via WhatsApp.

Você pode assinar ou atualizar seu plano em segundos via **PIX automático com ativação imediata**!`,
    actions: [
      { label: "Ver Planos & Assinar", url: "/assinatura" },
      { label: "Falar com Suporte", url: "/contato" },
    ],
    suggestions: ["Como funciona o pagamento via PIX?", "O plano Starter expira?"],
  },
  {
    keywords: ["cliente", "clientes", "veiculo", "veiculos", "placa", "cadastrar cliente", "cadastrar carro"],
    title: "Cadastro de Clientes e Veículos",
    response: `### 🚗 Cadastrando Clientes e Veículos:

1. Acesse o menu **Clientes**.
2. Clique em **"+ Novo Cliente"**.
3. Preencha Nome, WhatsApp/Telefone e CPF/CNPJ.
4. Adicione o(s) veículo(s) do cliente informando **Placa**, **Modelo/Marca** e **Ano**.
5. Todo o histórico de manutenções e OS fica unificado na ficha do veículo!`,
    actions: [
      { label: "Ir para Clientes", url: "/clientes" },
      { label: "Lista de Veículos", url: "/veiculos" },
    ],
    suggestions: ["Como buscar cliente pela placa?", "Como cadastrar frota de veículos?"],
  },
  {
    keywords: ["estoque", "produto", "pecas", "cadastrar peca", "codigo de barras", "sku", "fornecedor"],
    title: "Controle de Estoque e Peças",
    response: `### 📦 Gestão de Estoque e Autopeças:

1. Vá em **Estoque**.
2. Clique em **"+ Novo Produto/Peça"**.
3. Insira o nome, código SKU/barras, quantidade atual e estoque mínimo.
4. Defina o **Preço de Custo** e a **Margem de Lucro / Preço de Venda**.
5. O sistema avisa automaticamente quando o item atingir o estoque mínimo para você repor com seu fornecedor.`,
    actions: [
      { label: "Acessar Estoque", url: "/estoque" },
      { label: "Fornecedores", url: "/fornecedores" },
    ],
    suggestions: ["Como cadastrar fornecedores?", "Como dar entrada de estoque?"],
  },
  {
    keywords: ["equipe", "mecanico", "comissao", "usuario", "funcionario", "atendente", "lavador"],
    title: "Gestão de Equipe e Comissões",
    response: `### 👥 Cadastro de Funcionários e Comissões:

1. Acesse o menu **Equipe**.
2. Clique em **"+ Novo Membro"**.
3. Defina o cargo (*Mecânico, Lavador, Atendente, Gerente*).
4. Configure a porcentagem de **Comissão sobre Serviços e Peças**.
5. O sistema calcula automaticamente o extrato de comissões conforme as Ordens de Serviço forem finalizadas!`,
    actions: [
      { label: "Gerenciar Equipe", url: "/equipe" },
      { label: "Ver Comissões", url: "/relatorios" },
    ],
    suggestions: ["Como calcular comissão do mecânico?", "Como criar login para funcionários?"],
  },
];

export function getContextualSuggestions(pathname: string): string[] {
  if (pathname.includes("/oficina")) {
    return ["Como criar uma nova OS?", "Como mudar status no Kanban?", "Como adicionar peças na OS?", "Como enviar OS no WhatsApp?"];
  }
  if (pathname.includes("/lavajato")) {
    return ["Como registrar uma lavagem?", "Como comissionar lavadores?", "Como notificar cliente que o carro está pronto?"];
  }
  if (pathname.includes("/pdv")) {
    return ["Como finalizar uma venda rápida?", "Como aplicar desconto no balcão?", "Como cadastrar novas peças no estoque?"];
  }
  if (pathname.includes("/financeiro")) {
    return ["Como lançar uma despesa?", "Como ver o lucro líquido no DRE?", "Como exportar relatório financeiro?"];
  }
  if (pathname.includes("/estoque")) {
    return ["Como cadastrar produto com código de barras?", "Como configurar alerta de estoque mínimo?", "Como vincular fornecedor?"];
  }
  if (pathname.includes("/crm")) {
    return ["Como conectar o WhatsApp via QR Code?", "Como disparar aviso de revisão preventiva?", "Como configurar mensagens automáticas?"];
  }
  if (pathname.includes("/assinatura")) {
    return ["Quais as vantagens do Plano Pro?", "Como assinar via PIX?", "O plano Starter é gratuito para sempre?"];
  }
  return [
    "Como abrir uma Ordem de Serviço?",
    "Como conectar meu WhatsApp?",
    "Como fazer vendas no PDV?",
    "Quais os planos e preços?",
  ];
}

export function queryLocalKnowledge(query: string, currentPath?: string): AiResponse {
  const normalizedQuery = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  let bestMatch: KnowledgeTopic | null = null;
  let maxScore = 0;

  for (const topic of KNOWLEDGE_BASE) {
    let score = 0;
    for (const kw of topic.keywords) {
      const normalizedKw = kw
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      if (normalizedQuery.includes(normalizedKw)) {
        score += normalizedKw.split(" ").length * 2;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestMatch = topic;
    }
  }

  if (bestMatch && maxScore > 0) {
    return {
      reply: bestMatch.response,
      actions: bestMatch.actions,
      suggestions: bestMatch.suggestions,
      source: "local-engine",
    };
  }

  return {
    reply: `Olá! Sou o **Torque IA**, seu assistente operacional automotivo. 🚗⚡

Entendi sua dúvida sobre *"**${query.slice(0, 60)}**"*. Como posso te ajudar melhor?

Aqui estão algumas das tarefas mais comuns que você pode realizar agora:
- **Abrir Ordem de Serviço (OS):** Vá em **Oficina** para cadastrar e acompanhar reparos.
- **Vender Peças no Balcão:** Use o **PDV** para vendas rápidas com baixa automática.
- **Atendimento de Lava-Jato:** Controle a fila e tipos de lavagens em **Lava-Jato**.
- **Conectar WhatsApp:** Gere o QR Code em **CRM** para avisos automáticos de carros prontos.
- **Controle de Caixa:** Monitore entradas, saídas e lucro em **Financeiro**.

Selecione um dos atalhos abaixo ou faça uma pergunta mais específica!`,
    actions: [
      { label: "Ir para Oficina", url: "/oficina" },
      { label: "Abrir PDV Balcão", url: "/pdv" },
      { label: "Conectar WhatsApp", url: "/crm" },
      { label: "Livro Caixa", url: "/financeiro" },
    ],
    suggestions: getContextualSuggestions(currentPath || "/dashboard"),
    source: "local-engine",
  };
}
