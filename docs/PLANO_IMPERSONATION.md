# Plano de Implementação: Impersonation Seguro com Auditoria, Notificação e Deploy na VM

Implementação da funcionalidade de personificação de suporte para o Master Admin no **Torque ERP**, garantindo segurança, isolamento de credenciais, trilha de auditoria completa e transparência para o usuário.

---

## 1. Modificações Propostas

### A. Banco de Dados e Modelos Prisma
#### [MODIFY] [schema.prisma](file:///c:/Users/rgfer/OneDrive/Documentos/repositorioIA/projetoOficina/prisma/schema.prisma)
- Atualizar o modelo `AuditLog` com campos de operador admin, endpoint, método HTTP e flag `isImpersonated`.
- Criar o modelo `ImpersonationSession` para registro de sessões ativas de suporte com expiração de 1 hora e identificador único `tokenJti`.

---

### B. Módulo de Autenticação e Notificação
#### [MODIFY] [auth.ts](file:///c:/Users/rgfer/OneDrive/Documentos/repositorioIA/projetoOficina/src/lib/auth.ts)
- Suportar claims de personificação no `UserSessionPayload`: `isImpersonating`, `impersonatedBy`, `impersonationExpiresAt`, `impersonationSessionId`.
- Função `createImpersonationToken` com validade de 1 hora (3600 segundos).

#### [MODIFY] [email.ts](file:///c:/Users/rgfer/OneDrive/Documentos/repositorioIA/projetoOficina/src/lib/email.ts)
- Adicionar função `sendSupportAccessNotificationEmail` enviando e-mail transacional oficial via Brevo REST API v3 com detalhes do operador, data/hora, IP e orientações de segurança.

---

### C. Backend & Endpoints de Controle
#### [MODIFY] [route.ts (Master Admin)](file:///c:/Users/rgfer/OneDrive/Documentos/repositorioIA/projetoOficina/src/app/api/master-admin/route.ts)
- Atualizar a ação `IMPERSONATE`:
  - Valida permissão do Master Admin (`rafael.gielow@gmail.com`).
  - Gera token JWT de curta duração (1h).
  - Grava registro na tabela `ImpersonationSession` e log inicial `IMPERSONATION_STARTED` no `AuditLog`.
  - Dispara o e-mail de alerta assíncrono para o e-mail do dono da oficina alvo (`target.ownerEmail`).
  - Retorna o payload de suporte com `is_impersonating: true`.

#### [MODIFY] [route.ts (Profile & Credentials Protection)](file:///c:/Users/rgfer/OneDrive/Documentos/repositorioIA/projetoOficina/src/app/api/auth/profile/route.ts)
- Bloquear terminantemente alteração de senhas quando a requisição for feita sob o modo `isImpersonating: true`.
- Registrar no log de auditoria qualquer tentativa de alteração indevida.

---

### D. Frontend & Experiência do Usuário
#### [NEW] [ImpersonationBanner.tsx](file:///c:/Users/rgfer/OneDrive/Documentos/repositorioIA/projetoOficina/src/components/ImpersonationBanner.tsx)
- Componente flutuante/sticky no topo do sistema.
- Indicador visual âmbar/amarelo de alta visibilidade: `MODO DE SUPORTE ATIVO`.
- Mostra nome da oficina/usuário e e-mail do operador Master Admin.
- Cronômetro regressivo de tempo restante da sessão (1h).
- Botão **"Sair do Modo de Suporte"** que restaura o token e a sessão do Master Admin e redireciona de volta para `/master-admin`.

#### [MODIFY] [AppShell.tsx](file:///c:/Users/rgfer/OneDrive/Documentos/repositorioIA/projetoOficina/src/components/AppShell.tsx)
- Integrar o `ImpersonationBanner` no topo de todas as páginas autenticadas.

#### [MODIFY] [page.tsx (Master Admin)](file:///c:/Users/rgfer/OneDrive/Documentos/repositorioIA/projetoOficina/src/app/master-admin/page.tsx)
- Ajustar o fluxo de início de suporte para salvar a sessão do Master no `torque_master_backup` e salvar o novo token com tempo de expiração de suporte.

---

## 2. Plano de Validação e Deploy

### Testes Locais
1. `npx prisma generate` e `npx prisma db push` para aplicar a modelagem de banco.
2. `npm run build` para garantir compilação Next.js sem erros de tipagem.

### Commit & Deploy na VM
1. `git add .` e commit com mensagem descritiva.
2. `git push origin main`.
3. Executar o deploy via SSH na VM Linux Oracle Cloud (`137.131.221.53`) atualizando dependências, banco, compilação e reload no PM2.
