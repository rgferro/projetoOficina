# 🚗 AutoGestão Local - Oficina Mecânica & Lava-Jato

Sistema full-stack integrado e monólito desktop-friendly projetado para rodar localmente no computador/servidor da oficina ou lava-jato, com interface moderna, limpa, responsiva e pronta para tablets e celulares no pátio.

---

## 🛠️ Stack Tecnológica

- **Frontend:** Next.js 14 (App Router) + TypeScript + TailwindCSS + Lucide Icons.
- **Backend & ORM:** Node.js (Route Handlers & Server Actions) com **Prisma ORM**.
- **Banco de Dados Local:** **SQLite** (armazenado no arquivo único `prisma/dev.db`, garantindo portabilidade e facilidade total de backup local sem necessidade de instalar servidores externos).
- **Impressão:** Layout otimizado para impressão de Ordens de Serviço (A4 e impressoras térmicas).
- **CRM WhatsApp:** Deep-links automáticos (`https://wa.me/...`) para disparo em 1 clique.

---

## 📦 Módulos do Sistema

1. **Dashboard Geral (`/`):**
   - Visão consolidada em tempo real: Carros no pátio (Lava-jato), Ordens de Serviço ativas, Caixa do dia (total e formas de pagamento) e Alertas de WhatsApp.
2. **Lava-Jato & Pátio (`/lavajato`):**
   - Quadro Kanban: *Aguardando*, *Em Lavagem*, *Finalizado/Pronto*, *Entregue*.
   - Botão de 1 clique: 🟢 **Avisar no WhatsApp** com template personalizado quando o carro estiver limpo.
   - Baixa e recebimento direto no caixa ao entregar.
3. **Oficina Mecânica & Ordens de Serviço (`/oficina`):**
   - Abertura de OS com seleção de cliente, veículo, KM de entrada e mecânico.
   - Inclusão dinâmica de Peças e Mão de Obra com cálculo automático.
   - Controle de status: *Orçamento*, *Aprovado*, *Em Execução*, *Aguardando Peça*, *Concluído*.
   - **Impressão Profissional de OS (`/oficina/[id]/imprimir`)** com termo de garantia de 90 dias e campos de assinatura.
4. **Clientes & Veículos (`/clientes`):**
   - Cadastro completo de clientes (Nome, WhatsApp, CPF/CNPJ, Endereço).
   - Vários veículos por cliente com busca instantânea por placa ou nome.
   - Histórico completo de passagens de cada veículo pela oficina e lava-jato.
5. **Equipe & Produtividade (`/equipe`):**
   - Cadastro de mecânicos e lavadores com percentual de comissão.
   - Cálculo automático de comissões acumuladas por serviços realizados.
6. **Caixa Diário & Financeiro (`/financeiro`):**
   - Fechamento diário de caixa discriminado por forma de pagamento: **PIX**, **Dinheiro**, **Cartão de Crédito** e **Cartão de Débito**.
   - Lançamento de despesas e receitas avulsas.
7. **CRM WhatsApp Marketing Preditivo (`/crm`):**
   - Alerta de retenção: Clientes do Lava-jato sem retorno há mais de 15/30 dias.
   - Alerta de revisão preventiva: Veículos com mais de 6 meses da última OS / troca de óleo.
   - Botão direto para abrir o WhatsApp Web com mensagem formatada pronta para envio.
8. **Configurações & Backup Local (`/configuracoes`):**
   - Download direto do arquivo SQLite `dev.db` com 1 clique.
   - Exportação completa em JSON.
   - Cópia para pasta local sincronizada com Google Drive ou pendrive.
   - Edição dos dados da empresa e dos modelos de mensagens de WhatsApp.

---

## 🚀 Como Executar Localmente

### 1. Pré-requisitos
- Node.js instalado (v18 ou superior).

### 2. Instalação e Inicialização
No terminal da pasta do projeto, execute:

```bash
# 1. Instalar dependências
npm install

# 2. Sincronizar o banco de dados SQLite local
npx prisma db push

# 3. Popular o banco com dados de teste realistas (Clientes, Veículos, Lavagens, OSs e Caixa)
npx tsx prisma/seed.ts

# 4. Iniciar o servidor local
npm run dev
```

Abra no navegador em: **[http://localhost:3000](http://localhost:3000)**

Para acessar em tablets ou celulares no pátio conectado na mesma rede Wi-Fi, basta acessar pelo IP local do computador (ex: `http://192.168.1.100:3000`).

---

## 💾 Rotina de Backup Local

O banco de dados SQLite fica no caminho:
```
prisma/dev.db
```

Você pode fazer o backup de 3 maneiras simples:
1. **Pela Interface Web:** Vá em **Backup & Ajustes** (`/configuracoes`) e clique em **Baixar Banco (.db)** ou **Exportar JSON**.
2. **Cópia para Google Drive / Pendrive:** Copie manualmente o arquivo `prisma/dev.db` para qualquer pasta ou nuvem.
3. **Script de Cópia Rápida:** Na tela de configurações, clique em **Criar Cópia Agora** para duplicar o banco na pasta `/backups`.

---

## 📁 Estrutura de Arquivos

```
projetoOficina/
├── prisma/
│   ├── schema.prisma       # Schema SQLite com todas as entidades
│   ├── seed.ts             # Script com dados demonstrativos completos
│   └── dev.db              # Arquivo de Banco de Dados Local SQLite
├── src/
│   ├── app/
│   │   ├── api/            # API REST (clientes, lavajato, oficina, equipe, financeiro, crm, backup)
│   │   ├── clientes/       # Gestão de Clientes e Veículos
│   │   ├── lavajato/       # Kanban e fluxo do Lava-Jato
│   │   ├── oficina/        # Ordens de Serviço (Nova, Edição e Impressão)
│   │   ├── equipe/         # Gestão de Funcionários e Comissões
│   │   ├── financeiro/     # Caixa Diário e Formas de Pagamento
│   │   ├── crm/            # WhatsApp Marketing Preditivo
│   │   ├── configuracoes/  # Backup Local e Dados da Empresa
│   │   ├── layout.tsx      # Layout mestre
│   │   └── page.tsx        # Dashboard Principal
│   ├── components/         # Sidebar, Header, AppShell responsivo
│   └── lib/                # Prisma client singleton, formatters brasileiros e gerador WhatsApp
├── package.json
└── README.md
```
