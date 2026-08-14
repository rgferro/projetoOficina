# 🚗 AutoGestão ERP - Oficina Mecânica, Auto Center, Lava-Jato & Autopeças (v2.0)

Sistema full-stack integrado e monólito desktop-friendly projetado para rodar localmente no computador/servidor da oficina, centro automotivo ou lava-jato, com interface moderna, limpa, responsiva e pronta para tablets e celulares no pátio.

---

## 🛠️ Stack Tecnológica

- **Frontend:** Next.js 14 (App Router) + TypeScript + TailwindCSS + Lucide Icons.
- **Backend & ORM:** Node.js (Route Handlers) com **Prisma ORM**.
- **Banco de Dados Local:** **SQLite** (armazenado no arquivo único `prisma/dev.db`, garantindo portabilidade e facilidade total de backup local sem necessidade de instalar servidores externos).
- **Testes Automatizados:** **Vitest** (suíte de testes unitários para formatadores, parser XML NF-e e regras de negócio financeiras).
- **Instalação 1-Clique:** Scripts automatizados para Windows (`INSTALAR_SISTEMA_AUTOMATICO.bat` e `INICIAR_SISTEMA.bat`).
- **Containers:** Suporte nativo a Docker (`Dockerfile` e `docker-compose.yml`).

---

## 📦 Módulos do Sistema

1. **Dashboard Geral (`/`):**
   - Visão consolidada em tempo real: Pátio da oficina, lava-jato, resumo de caixa e alertas de retenção.
2. **🛒 PDV Rápido de Balcão (`/pdv`):**
   - Venda de autopeças e lubrificantes com leitor de código de barras, comissão e cálculo de troco.
3. **📦 Controle de Estoque & Importador XML (`/estoque`):**
   - Preços de custo, venda, margem de lucro, alerta de estoque mínimo e **Importador de XML de NF-e 4.0**.
4. **🔧 Ordens de Serviço Turbinada (`/oficina`):**
   - Defeito Reclamado x Defeito Constatado, galeria de fotos do veículo, baixa automática no estoque e pagamentos parciais.
5. **🧼 Lava-Jato & Pátio (`/lavajato`):**
   - Quadro Kanban em 4 colunas com botão de WhatsApp com 1 clique para avisar retirada.
6. **💵 Caixa & Financeiro Completo (`/financeiro`):**
   - Turno de caixa (Abertura, Sangria, Suprimento e Fechamento), Contas a Pagar e Contas a Receber.
7. **📊 Relatórios Estratégicos & BI (`/relatorios`):**
   - **Curva ABC de Produtos**, ranking de produtividade de mecânicos e CRM de aniversariantes.
8. **🏢 Fornecedores & Tabela de Serviços (`/fornecedores`, `/servicos`):**
   - Cadastro de parceiros/distribuidores e catálogo de mão de obra padronizada.
9. **👥 Clientes & Veículos (`/clientes`):**
   - Gestão de clientes PF/PJ com histórico de placas e serviços.
10. **⚙️ Configurações & Backup Local (`/configuracoes`):**
    - Backup com 1 clique do banco SQLite `dev.db` e exportação JSON.

---

## 🚀 Como Executar Localmente

### Método 1: Instalador 1-Clique para Windows (Mais Fácil)
1. Dê 2 cliques em **`INSTALAR_SISTEMA_AUTOMATICO.bat`** (instala tudo e cria o atalho no Desktop).
2. Para abrir no dia a dia, dê 2 cliques no ícone **AutoGestão Oficina** na Área de Trabalho ou em **`INICIAR_SISTEMA.bat`**.

### Método 2: Execução Manual via Terminal
```bash
# 1. Instalar dependências
npm install

# 2. Sincronizar o banco de dados SQLite local
npx -y prisma db push

# 3. Popular o banco com dados demonstrativos
npx -y tsx prisma/seed.ts

# 4. Iniciar o servidor local
npm run dev
```

Abra no navegador em: **[http://localhost:3000](http://localhost:3000)**

### Método 3: Execução via Docker
```bash
docker-compose up -d --build
```

---

## 🧪 Testes Unitários
Para rodar a suíte de testes unitários automatizados:
```bash
npm test
```
