# Google OAuth2 Authentication Context

**Gathered:** 2026-11-27
**Spec:** `.specs/features/04-google-oauth-auth/spec.md`
**Status:** Approved — Ready for execution

---

## Feature Boundary

Adicionar autenticação mínima pronta para produção ao Lumo utilizando **Google OAuth 2.0 (Authorization Code + PKCE no backend)** com sessões próprias gerenciadas pelo backend Quarkus via cookies `HttpOnly` (Access JWT de 15 min + Refresh Token rotativo de 30 dias em PostgreSQL), proteção completa das rotas REST (`/api/v1/**`) e rotas Angular v22, tela dedicada de `/login`, perfil/logout na sidebar e modo **Entrar como Dev** exclusivo de `%dev`/`%test`. Todos os usuários autorizados compartilham o mesmo conjunto de dados financeiros familiares (sem multi-tenancy por `Household` nesta etapa).

---

## Implementation Decisions

### Provedor de Autenticação e Custo Zero

- Usuário escolheu **Google OAuth 2.0** em vez de Magic Link por e-mail/WhatsApp para manter custo zero e simplicidade operacional em produção (`"vamos para o oauth2 do google"`).
- Usuário já possui `GOOGLE_OAUTH_CLIENT_ID` e `GOOGLE_OAUTH_CLIENT_SECRET` configurados no Google Cloud Console.
- Fluxo via backend (BFF / Authorization Code + PKCE) aproveitando o proxy same-origin já existente em `frontend/nginx.conf` e `frontend/proxy.conf.json` (`/api/` -> backend), sem SDK JS externo do Google no Angular.

### Controle de Acesso e Escopo de Dados

- Usuário indicou que controlará quem pode logar diretamente na lista de *Test users* no Google Cloud Console (`"Lá no google eu consigo definir quem pode logar, então acho que não precisa nada do lado da aplicação, a não ser que você me convença que seja necessário"`).
- Como defesa em profundidade sem fricção operacional, a spec inclui uma variável de ambiente **opcional** `LUMO_ALLOWED_EMAILS` (vazia por padrão = confia 100% na lista do Google; se preenchida, restringe o login no backend contra eventual publicação acidental do app no Google Cloud). Decisão destacada para confirmação do usuário na revisão da spec.
- Dados financeiros permanecem compartilhados em um único espaço pessoal/familiar nesta entrega; isolamento multi-tenant por `Household` fica para fase posterior.

### Modo de Desenvolvimento e Testes

- Usuário aprovou explicitamente o modo **"Entrar como Dev"** (`"E pode ter o login como dev"`), ativo exclusivamente fora de produção (`%dev`/`%test`) para agilizar desenvolvimento local e manter a suíte Playwright E2E e testes de integração 100% determinísticos sem dependência de rede ou conta Google.

### Agent's Discretion

- Estrutura de tabelas Liquibase (`users`, `refresh_sessions`), nomes dos cookies (`lumo_access`, `lumo_refresh`, `lumo_oauth_state`), assinatura JWT HS256/EdDSA configurada via `LUMO_AUTH_JWT_SECRET` e composição visual da tela `/login` seguindo o design system ZardUI + identidade visual Lumo (`AD-009`, `AD-010`).

### Declined / Undiscussed Gray Areas → Assumptions

- Tratamento de `LUMO_ALLOWED_EMAILS` opcional (vazio por padrão) registrado em `spec.md` (`Assumptions & Open Questions`) para validação explícita na aprovação da spec.
- Retenção de sessão de 30 dias e renovação silenciosa no `authInterceptor` registrados como padrões confirmados do desenho proposto.

---

## Specific References

- Arquitetura Clean Architecture + DDD do backend (`AD-003`) e contrato HTTP RFC 9457 (`AD-007`).
- Identidade visual Royal Indigo & Azul Safira (`AD-009`) e componentes ZardUI + `<app-lumo-logo>` + Dark Sidebar (`AD-010`).
- Proxy same-origin `/api/` em `frontend/nginx.conf` e `frontend/proxy.conf.json`.

---

## Deferred Ideas

- Isolamento multi-tenant por `Household` (`household_id` em `MonthlyBudget`, `Transaction`, `Category`, `Beneficiary`, `RecurringTransaction`) e convites entre membros da família.
- Magic Link por e-mail (Resend/Brevo/SES) como método secundário de login.
- Notificações ou lançamento rápido via WhatsApp / Telegram Bot.
- Tela de gerenciamento de sessões/dispositivos ativos.
