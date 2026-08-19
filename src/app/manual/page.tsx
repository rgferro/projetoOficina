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
  HelpCircle,
  Smartphone,
  Laptop,
  Check,
  AlertTriangle,
  QrCode,
  Zap,
} from "lucide-react";
import { InteractiveTourModal } from "@/components/InteractiveTour";
import Link from "next/link";

export default function ManualPage() {
  const [activeSection, setActiveSection] = useState<
    "LAVAJATO" | "OFICINA" | "PDV" | "ESTOQUE" | "CRM" | "FINANCEIRO" | "EQUIPE" | "BACKUP" | "FAQ"
  >("LAVAJATO");
  const [isTourOpen, setIsTourOpen] = useState(false);

  const sections = [
    {
      id: "LAVAJATO",
      title: "1. Lava-Jato & Pátio Kanban",
      icon: Droplets,
      badge: "Operação Pátio & Rápida",
      badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-300",
      image: "/manual/lavajato.jpg",
      summary:
        "Fluxo visual de veículos no pátio através de cartões Kanban com disparo automático e silencioso de WhatsApp quando o carro estiver limpo.",
      proTips: [
        "Cadastro Expresso: Digite apenas a placa e o WhatsApp para registrar o carro em menos de 10 segundos.",
        "Comissão por Lavador: Atribua o colaborador executor para apuração automática de comissões no fechamento.",
        "Integração WhatsApp: O aviso 'Seu carro está pronto!' é gerado com link direto ou enviado pelo serviço de WhatsApp conectado.",
      ],
      steps: [
        {
          num: "1",
          title: "Entrada & Cadastro Expresso",
          desc: "Cadastre a placa, modelo e o telefone do cliente. Selecione o serviço (Lavagem Simples, Completa, Cera, Higienização) e adicione observações de avarias prévias se necessário.",
        },
        {
          num: "2",
          title: "Execução no Box de Lavagem",
          desc: "O operador move o cartão de 'Na Fila' para 'Lavando'. O horário de início é registrado para controle de tempo médio por veículo.",
        },
        {
          num: "3",
          title: "Inspeção & Pronto para Retirada",
          desc: "Após a secagem e acabamento, o cartão é movido para 'Pronto para Retirada'. O sistema prepara a mensagem personalizada de aviso ao cliente.",
        },
        {
          num: "4",
          title: "Notificação no WhatsApp & Liquidação",
          desc: "Clique no ícone de WhatsApp para notificar o cliente instantaneamente. Ao retirar o veículo, receba o pagamento (PIX, Dinheiro ou Cartão) e marque como 'Entregue'.",
        },
      ],
    },
    {
      id: "OFICINA",
      title: "2. Oficina Mecânica & Ordens de Serviço (OS 2.0)",
      icon: Wrench,
      badge: "Mecânica, Laudo & Estoque",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      image: "/manual/oficina.jpg",
      summary:
        "Checklist com fotos de avarias, diagnóstico técnico detalhado (Defeito Reclamado vs. Constatado), baixa automática de estoque de peças, aprovação e termo de garantia.",
      proTips: [
        "Defeito Reclamado x Constatado: Separa o relato do motorista da conclusão técnica do mecânico, evitando retrabalho.",
        "Baixa de Estoque Automática: Ao mudar o status da OS para 'Aprovado' ou 'Em Execução', as peças vinculadas são deduzidas automaticamente do estoque.",
        "Impressão A4 Térmica ou PDF: Emita a OS com logomarca, dados da oficina, QR Code PIX e Termo de Garantia de 90 dias com 1 clique.",
      ],
      steps: [
        {
          num: "1",
          title: "Recepção, Km & Fotos de Avarias",
          desc: "Registre a quilometragem atual do veículo, nível de combustível e anexe fotos de arranhões e amassados pré-existentes para resguardo jurídico.",
        },
        {
          num: "2",
          title: "Diagnóstico & Orçamento de Peças/Serviços",
          desc: "O mecânico insere o parecer técnico, seleciona as peças necessárias do estoque (óleo, pastilhas, correias) e a mão de obra com tempo estimado.",
        },
        {
          num: "3",
          title: "Aprovação do Cliente & Execução",
          desc: "Envie o orçamento detalhado via WhatsApp ou PDF. Com a aprovação, a OS passa para 'Em Execução' e o estoque é automaticamente debitado.",
        },
        {
          num: "4",
          title: "Conclusão, Quitação & Termo de Garantia",
          desc: "Receba o valor no Caixa (à vista ou faturado a prazo), emita o comprovante com o Termo de Garantia e dispare a mensagem de 'Veículo Pronto' no WhatsApp.",
        },
      ],
    },
    {
      id: "PDV",
      title: "3. PDV Balcão de Peças & Venda Rápida",
      icon: ShoppingCart,
      badge: "Vendas Balcão & Troco",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      image: "/manual/pdv.jpg",
      summary:
        "Venda ágil de lubrificantes, filtros, palhetas e acessórios com leitor de código de barras, cálculo de troco e emissão de comprovante térmico.",
      proTips: [
        "Leitor USB: Conecte qualquer leitor de código de barras ou bipe direto na tela para adicionar itens instantaneamente.",
        "Calculadora de Troco: Digite o valor entregue em notas e veja o troco exato na hora, evitando erros do operador.",
        "Integração com Caixa: Toda venda de balcão alimenta o Livro Caixa e atualiza o estoque em tempo real.",
      ],
      steps: [
        {
          num: "1",
          title: "Bipar ou Buscar Peça",
          desc: "Digite o nome da peça, código interno (SKU) ou bipe o código de barras EAN-13 para inserir o produto na cesta de compras.",
        },
        {
          num: "2",
          title: "Seleção do Cliente & Vendedor",
          desc: "Venda rápida como 'Consumidor Balcão' ou vincule a um cliente cadastrado para histórico e programa de fidelidade.",
        },
        {
          num: "3",
          title: "Forma de Pagamento & Desconto",
          desc: "Escolha Dinheiro, PIX (com QR Code na tela), Cartão de Crédito ou Débito. Aplique descontos em reais ou percentual.",
        },
        {
          num: "4",
          title: "Finalização & Cupom de Venda",
          desc: "Ao confirmar, o estoque é debitado, o valor entra no fluxo de caixa e o sistema abre o cupom térmico pronto para impressão (80mm ou 58mm).",
        },
      ],
    },
    {
      id: "ESTOQUE",
      title: "4. Controle de Estoque & Importação de XML (NF-e)",
      icon: Package,
      badge: "Almoxarifado & Compras",
      badgeColor: "bg-orange-100 text-orange-800 border-orange-300",
      image: "/manual/oficina.jpg",
      summary:
        "Gestão completa de peças, alertas de estoque mínimo, formação automática de preço com margem de lucro e importação de XML de Notas Fiscais em 1 clique.",
      proTips: [
        "Importação de NF-e: Arraste o arquivo XML da nota fiscal do fornecedor para cadastrar dezenas de peças e atualizar custos automaticamente.",
        "Alerta de Reposição: Produtos com estoque igual ou abaixo do mínimo são destacados em vermelho no Dashboard.",
        "Localização Física: Registre o corredor e prateleira de cada item para agilizar o trabalho do mecânico no galpão.",
      ],
      steps: [
        {
          num: "1",
          title: "Cadastro de Peças & Preço",
          desc: "Cadastre nome, fabricante, categoria, unidade (UN, L, KG), preço de custo e margem de lucro (%) desejada para calcular o preço de venda.",
        },
        {
          num: "2",
          title: "Importação Automática via XML",
          desc: "Na aba 'Importar XML', envie o arquivo da nota fiscal eletrônica. O sistema lê os produtos, quantidades e atualiza o estoque sem digitação manual.",
        },
        {
          num: "3",
          title: "Movimentações & Histórico",
          desc: "Acompanhe o extrato de entradas por compras, saídas por Ordens de Serviço, vendas de balcão e ajustes de inventário.",
        },
        {
          num: "4",
          title: "Vínculo com Fornecedores",
          desc: "Mantenha o cadastro de distribuidores de autopeças e gere pedidos de reposição com histórico de preços pagos.",
        },
      ],
    },
    {
      id: "CRM",
      title: "5. CRM & WhatsApp Marketing Automático",
      icon: MessageSquare,
      badge: "Fidelização & Retenção",
      badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
      image: "/manual/crm.jpg",
      summary:
        "Automação inteligente de pós-venda, lembretes de troca de óleo preventiva (180 dias), aviso para clientes sumidos e cupons de aniversariantes.",
      proTips: [
        "Conexão Silenciosa: Pareie o WhatsApp da sua oficina via QR Code em 'Ajustes' para envios 100% automáticos sem abrir o navegador.",
        "Personalização Total: Customize os textos das mensagens inserindo o nome do cliente, placa e modelo do carro automaticamente.",
        "Geração de Receita Recorrente: O lembrete de 6 meses de troca de óleo traz os clientes de volta de forma previsível e contínua.",
      ],
      steps: [
        {
          num: "1",
          title: "Lembrete Preventivo de Óleo (180 dias)",
          desc: "O sistema monitora a data da última troca de óleo e lista automaticamente os clientes que completaram 6 meses para envio do convite de revisão preventiva.",
        },
        {
          num: "2",
          title: "Reativação de Clientes Sumidos do Lava-Jato",
          desc: "Identifica veículos que não retornam há mais de 30 dias para oferecer uma lavagem rápida com condições especiais.",
        },
        {
          num: "3",
          title: "Aniversariantes do Mês com Cupom",
          desc: "Dispara mensagens personalizadas de felicitações com cupom de desconto em serviços durante o mês de aniversário do cliente.",
        },
        {
          num: "4",
          title: "Histórico Completo de Interações",
          desc: "Consulte todas as mensagens enviadas e o retorno dos clientes no histórico de relacionamento da oficina.",
        },
      ],
    },
    {
      id: "FINANCEIRO",
      title: "6. Caixa, Sangrias & Contas a Pagar/Receber",
      icon: CircleDollarSign,
      badge: "Gestão Financeira & DRE",
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300",
      image: "/manual/pdv.jpg",
      summary:
        "Abertura e fechamento de turno de caixa, controle de retiradas (sangrias), contas a pagar para fornecedores e fluxo financeiro em tempo real.",
      proTips: [
        "Fechamento Cego: O operador conta o dinheiro físico no fim do turno e o sistema aponta eventuais diferenças (sobras ou faltas) com precisão.",
        "Contas a Pagar: Cadastre duplicatas, boletos de autopeças e contas fixas (aluguel, energia) para alertas de vencimento diários.",
        "Gráficos de Lucro: Veja o resultado operacional líquido da oficina separando receitas de serviços, peças e lavagens.",
      ],
      steps: [
        {
          num: "1",
          title: "Abertura de Turno com Fundo de Troco",
          desc: "Ao iniciar o expediente, o atendente informa o valor em notas e moedas disponível no cofre/gaveta para troco inicial.",
        },
        {
          num: "2",
          title: "Registro de Sangrias & Suprimentos",
          desc: "Registre qualquer saída de dinheiro (sangria para pagamento de motoboy ou peças) ou aporte (suprimento) com motivo documentado.",
        },
        {
          num: "3",
          title: "Contas a Pagar & Receber",
          desc: "Acompanhe os títulos pendentes, liquide recebimentos de faturados e registre pagamentos de notas de fornecedores.",
        },
        {
          num: "4",
          title: "Fechamento de Caixa Consolidado",
          desc: "Emita o relatório de fechamento diário consolidando totais em Dinheiro, PIX, Cartão de Débito e Cartão de Crédito.",
        },
      ],
    },
    {
      id: "EQUIPE",
      title: "7. Controle de Login, Cargos & Permissões",
      icon: Shield,
      badge: "Segurança & Matriz de Acesso",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
      image: "/manual/oficina.jpg",
      summary:
        "Controle rigoroso de acessos por perfil (Administrador, Gerente, Atendente, Mecânico e Lavador) mantendo dados financeiros 100% protegidos.",
      proTips: [
        "Login do Mecânico: O mecânico só visualiza suas OSs atribuídas, sem ver faturamento ou relatórios gerenciais.",
        "Troca Rápida de Usuário: Alterne de atendente no topo direito com PIN de 4 dígitos sem precisar deslogar do computador.",
        "Links de Convite Seguros: Envie convites por e-mail ou WhatsApp para os colaboradores definirem suas próprias senhas com validade de 48h.",
      ],
      steps: [
        {
          num: "1",
          title: "Cadastro de Colaborador & Cargo",
          desc: "Cadastre nome, e-mail, telefone, cargo na oficina, PIN rápido e taxa de comissão padrão sobre serviços executados.",
        },
        {
          num: "2",
          title: "Definição de Nível de Acesso",
          desc: "Selecione entre Administrador (Acesso Total), Gerente, Atendente (Caixa/Balcão), Mecânico (OSs) ou Lavador (Pátio).",
        },
        {
          num: "3",
          title: "Personalização de Permissões Específicas",
          desc: "O Proprietário pode marcar ou desmarcar telas específicas para customizar o que cada funcionário pode acessar.",
        },
        {
          num: "4",
          title: "Auditoria de Ações",
          desc: "Todas as operações críticas (descontos, cancelamento de OS e exclusões) ficam registradas no log de auditoria com IP e usuário.",
        },
      ],
    },
    {
      id: "BACKUP",
      title: "8. Backup Automático no Google Drive & Ajustes",
      icon: Cloud,
      badge: "Segurança de Dados & Nuvem",
      badgeColor: "bg-sky-100 text-sky-700 border-sky-300",
      image: "/manual/oficina.jpg",
      summary:
        "Sincronização de cópias de segurança do banco de dados no Google Drive, exportação de cadastros e dados cadastrais da oficina para notas e OSs.",
      proTips: [
        "Backup em 1 Clique: Faça o download do arquivo de backup do banco de dados a qualquer momento para um pendrive ou computador seguro.",
        "Google Drive Integrado: Conecte sua conta do Google Drive em 'Ajustes' para cópias de segurança automáticas em nuvem.",
        "Dados da Oficina: Configure logotipo, endereço, telefones e mensagem de rodapé para saírem personalizados nas impressões.",
      ],
      steps: [
        {
          num: "1",
          title: "Dados da Empresa & Logotipo",
          desc: "Preencha a Razão Social, CNPJ/CPF, endereço completo e envie a logomarca da oficina para constar no cabeçalho das Ordens de Serviço.",
        },
        {
          num: "2",
          title: "Configuração do WhatsApp Oficial",
          desc: "Acesse a aba WhatsApp e faça a leitura do QR Code com o WhatsApp da oficina para ativar disparos silenciosos.",
        },
        {
          num: "3",
          title: "Conexão com Google Drive",
          desc: "Autorize o envio de cópias automáticas para sua pasta pessoal no Google Drive mantendo redundância total de segurança.",
        },
        {
          num: "4",
          title: "Exportação de Relatórios",
          desc: "Exporte cadastros de clientes, veículos, estoque e movimentações financeiras em formato Excel/CSV quando desejar.",
        },
      ],
    },
    {
      id: "FAQ",
      title: "9. Perguntas Frequentes & Dúvidas Operacionais",
      icon: HelpCircle,
      badge: "Dúvidas Frequentes",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      image: "/manual/lavajato.jpg",
      summary:
        "Respostas claras para as dúvidas mais comuns sobre operação no celular, impressoras térmicas, planos e limites.",
      proTips: [
        "Acesso no Celular: O sistema é 100% responsivo e pode ser acessado direto pelo navegador do celular do mecânico ou operador.",
        "Impressoras Térmicas: Compatível com impressoras 80mm e 58mm (Epson, Bematech, Elgin, Daruma) via driver padrão.",
        "Suporte Prioritário: Atendimento rápido via WhatsApp para tirar dúvidas e orientar sua equipe.",
      ],
      steps: [
        {
          num: "1",
          title: "Como acessar no celular do mecânico ou lavador?",
          desc: "Basta abrir o navegador do celular, acessar o endereço da oficina e fazer login com seu e-mail ou PIN. A interface se adapta perfeitamente a telas de smartphones.",
        },
        {
          num: "2",
          title: "Qual impressora de cupom é suportada?",
          desc: "Qualquer impressora térmica USB, Rede ou Bluetooth que funcione no Windows/Mac/Linux (80mm ou 58mm), além de impressoras A4 comuns para Ordens de Serviço completas.",
        },
        {
          num: "3",
          title: "Como funciona o limite do Plano Starter?",
          desc: "O plano Starter gratuito permite até 2 usuários, 30 Ordens de Serviço e 50 Lavagens por mês. Ao atingir o limite, você pode fazer upgrade para o Plano Pro com operações ilimitadas.",
        },
        {
          num: "4",
          title: "Como adicionar novos mecânicos na equipe?",
          desc: "Acesse o menu 'Equipe & Usuários', clique em 'Novo Colaborador', defina o cargo e envie o link de ativação para o WhatsApp do funcionário.",
        },
      ],
    },
  ];

  const currentSection = sections.find((s) => s.id === activeSection) || sections[0];

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Top Header Responsivo */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="space-y-2 max-w-2xl relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold">
            <BookOpen className="w-3.5 h-3.5" />
            Manual de Operações & Guia de Treinamento
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
            Manual Completo do AutoGestão ERP
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Consulte o passo a passo detalhado de cada módulo, confira as melhores práticas operacionais e inicie o tour interativo na tela a qualquer momento.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto relative">
          <button
            onClick={() => setIsTourOpen(true)}
            className="flex-1 sm:flex-initial px-4 sm:px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-extrabold text-xs shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            ▶️ Iniciar Tour Guiado
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 transition-all no-print"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir Manual</span>
          </button>
        </div>
      </div>

      {/* Navegação por Abas dos Módulos (Scroll Suave no Mobile) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-print">
        {sections.map((sec) => {
          const Icon = sec.icon;
          const isSelected = activeSection === sec.id;

          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id as any)}
              className={`px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 flex-shrink-0 ${
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
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-8 shadow-sm space-y-6 sm:space-y-8">
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <span
              className={`text-[11px] font-black px-3 py-1 rounded-full border ${currentSection.badgeColor}`}
            >
              {currentSection.badge}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
              {currentSection.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              {currentSection.summary}
            </p>
          </div>
        </div>

        {/* Dicas de Ouro / Boas Práticas Operacionais */}
        {currentSection.proTips && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-2.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-600 fill-current" />
              Dicas de Ouro da Operação:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {currentSection.proTips.map((tip, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white/80 rounded-xl border border-amber-200/60 text-xs text-amber-950 flex items-start gap-2 shadow-2xs"
                >
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                    ★
                  </span>
                  <span className="leading-relaxed">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Infográfico do Fluxo */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Infográfico Visual do Fluxo:
          </h3>

          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-950 flex items-center justify-center relative aspect-video max-h-[420px] w-full">
            <img
              src={currentSection.image}
              alt={currentSection.title}
              className="w-full h-full object-cover object-center hover:scale-[1.01] transition-transform duration-500"
            />
          </div>
        </div>

        {/* Passo a Passo Detalhado */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Procedimento Operacional Passo a Passo:
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentSection.steps.map((st, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 hover:border-blue-300 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
                    {st.num}
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">{st.title}</h4>
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
