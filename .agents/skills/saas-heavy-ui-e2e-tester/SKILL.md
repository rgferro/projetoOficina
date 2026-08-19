---
name: saas-heavy-ui-e2e-tester
description: Arquitetura completa e automação de testes pesados de interface (UI), validação de fluxos ponta a ponta (E2E), verificação de botões, integridade de rotas e compilação Next.js para SaaS automotivo.
---

# SaaS Heavy UI & E2E Tester Skill

Esta skill fornece uma metodologia rigorosa e automatizada de testes pesados para validar todas as telas, botões, regras de negócio, integrações e fluxos de ponta a ponta (E2E) em sistemas SaaS Next.js / Node.js.

---

## 🎯 1. Pilares de Cobertura de Testes

1. **Testes Unitários & Lógica de Negócio (Vitest):**
   * Validação de cálculos financeiros (margem de lucro, troco de PDV, descontos).
   * Validação oficial de documentos (CPF/CNPJ via Módulo 11 da Receita Federal).
   * Formatadores (Moedas BRL, Placas padrão Mercosul, Telefones e Sanitização).
   * Resiliência de APIs (Circuit Breaker, timeout e fallback offline).

2. **Testes de Integração & Fluxos E2E Reais:**
   * **Fluxo de Autenticação:** PBKDF2 Salt Hashing, tokens JWT assinados com expiração e permissões de perfil (`ADMIN`, `GERENTE`, `MECANICO`, `ATENDENTE`, `LAVADOR`).
   * **Fluxo de Ordem de Serviço (OS 2.0):** Cadastro de OS com itens de peças e serviços, laudo técnico, defeito reclamado/constatado, baixa automática de estoque, quitação no Caixa e geração de notificação de WhatsApp.
   * **Fluxo de Lava-Jato:** Ciclo de vida completo do ticket (`AGUARDANDO` -> `EM_LAVAGEM` -> `FINALIZADO`), cálculo de comissões e mensagem instantânea.
   * **Fluxo de PDV Balcão:** Venda expressa de balcão com baixa em tempo real e fechamento no fluxo de caixa.
   * **Fluxo de Assinaturas & Planos:** Planos SaaS (`STARTER`, `PRO`, `ELITE`, `EXTRA_SEAT`), bloqueio rigoroso de cotas mensais (30 OSs e 50 Lavagens) e auditoria de IPs contra fraudes.

3. **Validação Estrutural e Compilação Next.js:**
   * Varredura de 100% das páginas estáticas e dinâmicas através de `next build` para garantir ausência de erros de tipagem, imports quebrados ou quebra de renderização.

---

## 💻 2. Como Executar a Bateria Completa de Testes

### A. Executar todos os testes Vitest:
```bash
npm run test
```

### B. Validar integridade e compilação de todas as rotas e componentes:
```bash
npm run build
```

---

## 🛠️ 3. Estrutura do Teste E2E Automatizado

Arquivo de referência: `tests/e2e-complete-flows.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("E2E & UI Flow Heavy Integration Tests Suite", () => {
  // Configurações e teardown automático da base de teste
  beforeAll(async () => { /* Setup isolado */ });
  afterAll(async () => { /* Teardown limpo */ });

  it("Fluxo 1: Autenticação, Sessão e Criptografia", async () => { /* ... */ });
  it("Fluxo 2: Validações Oficiais & Formatadores", async () => { /* ... */ });
  it("Fluxo 3: Ordem de Serviço Completa (OS 2.0)", async () => { /* ... */ });
  it("Fluxo 4: Lava-Jato & Lavagens de Veículos", async () => { /* ... */ });
  it("Fluxo 5: PDV Balcão & Venda Direta de Peças", async () => { /* ... */ });
  it("Fluxo 6: Assinaturas SaaS & Mercado Pago", async () => { /* ... */ });
});
```
