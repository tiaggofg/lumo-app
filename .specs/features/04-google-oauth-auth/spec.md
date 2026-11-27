# Google OAuth2 Authentication Specification

**Status**: Approved
**Approved**: 2026-11-27 - user: "sim, pode aprovar e grar o handoff"

## Problem Statement

O Lumo já entrega o MVP completo de controle financeiro pessoal e familiar (`01-lumo-mvp`, `02-ui-ux-overhaul` e `03-zardui-brand-and-shell`), mas opera sem autenticação (`AD-007`), impedindo o deploy direto em produção sem expor orçamentos e lançamentos financeiros. Esta especificação define uma camada de autenticação enxuta, gratuita e pronta para produção baseada em **Google OAuth 2.0 (Authorization Code + PKCE no backend)** com sessões próprias gerenciadas pelo Quarkus via cookies `HttpOnly` (Access Token JWT de 15 min + Refresh Token opaco rotativo de 30 dias em PostgreSQL), proteção integral de todos os endpoints `/api/v1/**` e rotas do frontend Angular v22, tela dedicada `/login` no padrão ZardUI/Lumo, identificação do usuário e logout na sidebar/drawer, e um fluxo **Entrar como Dev** estritamente restrito a `%dev`/`%test`.

## Goals

- [ ] Proteger 100% dos endpoints de negócio sob `/api/v1/**` e `/api/v1/auth/me` exigindo sessão autenticada válida, retornando `401 Unauthorized` no formato RFC 9457 (`application/problem+json`) para requisições não autenticadas.
- [ ] Implementar fluxo **Google OAuth 2.0 Authorization Code + PKCE (S256)** no backend Quarkus (`/api/v1/auth/google/login` e `/api/v1/auth/google/callback`) com validação criptográfica do `id_token` via JWKS oficial do Google (`iss`, `aud`, `exp`, `email_verified = true`) e upsert de usuários na tabela `users`.
- [ ] Gerenciar sessões próprias do Lumo com Access Token JWT (15 minutos) e Refresh Token opaco rotativo (30 dias, armazenado apenas como hash `SHA-256` em `refresh_sessions`), entregues exclusivamente em cookies `HttpOnly; SameSite=Lax` (e `Secure` em produção), com renovação silenciosa no frontend e revogação efetiva no logout.
- [ ] Entregar tela `/login` responsiva (desktop e mobile, Light/Dark) no padrão visual Lumo + ZardUI, guarda de rotas com preservação sanitizada de `returnUrl`, e área de conta do usuário (avatar/iniciais, nome/e-mail e botão **Sair**) na sidebar desktop (expandida e recolhida) e drawer mobile.
- [ ] Disponibilizar login **Entrar como Dev** (`POST /api/v1/auth/dev-login`) exclusivamente fora de produção (`lumo.auth.dev-login.enabled=true` em `%dev`/`%test` e estritamente `false` em `%prod`, retornando `404 Not Found`) para manter desenvolvimento local e testes automatizados/Playwright 100% determinísticos.

## Out of Scope

Explicitly excluded to prevent scope creep.

| Feature | Reason |
| --- | --- |
| Isolamento multi-tenant por `Household` nas tabelas financeiras | Esta entrega foca autenticação mínima para uso pessoal/familiar compartilhado; a separação por `Household` permanece para fase futura |
| Magic Link por e-mail, login por senha, WhatsApp ou outros provedores OAuth | O provedor escolhido para custo zero e simplicidade em produção é exclusivamente Google OAuth 2.0 (além do atalho Dev em `%dev`/`%test`) |
| Painel administrativo de usuários, papéis (RBAC) ou convites na UI | O controle de acesso de contas permitidas é feito via *Test users* no Google Cloud Console (com variável opcional `LUMO_ALLOWED_EMAILS` no backend) |
| Listagem e revogação remota de múltiplas sessões/dispositivos | O logout encerra e revoga a sessão atual do navegador; gerenciamento multi-dispositivo fica fora desta entrega |

---

## Implicit-Requirement Dimensions

| Dimension | Resolution |
| --- | --- |
| Input validation & bounds | Coberto por `AUTH-01`, `AUTH-02` e `AUTH-04`: validação obrigatória de `state`, `code` e PKCE (`S256`), validação das claims do `id_token` (`sub`, `email`, `email_verified = true`, `aud`, `iss`, `exp`), sanitização estrita de `returnUrl` (apenas caminhos relativos iniciando com `/` e nunca `//` ou URLs absolutas) e limites de tamanho nas colunas de `users` (`email` ≤ 255, `name` ≤ 200, `avatar_url` ≤ 1024, `google_sub` ≤ 255) |
| Failure / partial-failure states | Coberto por `AUTH-01` e `AUTH-05`: cancelamento ou erro no Google (`access_denied`, `state` inválido, `id_token` inválido, `email_verified = false` ou e-mail bloqueado por `LUMO_ALLOWED_EMAILS`) redireciona para `/login?error=<codigo>` exibindo mensagem clara em PT-BR sem gravar usuário ou sessão parcial; operações de persistência executam em transação atômica (`@Command`) |
| Idempotency / retry / duplicate handling | Coberto por `AUTH-01` e `AUTH-03`: logins repetidos do mesmo usuário Google executam upsert idempotente por `google_sub` (atualizando nome, e-mail e avatar sem duplicar `users`); no frontend, múltiplas respostas `401` paralelas compartilham uma única requisição em voo para `POST /api/v1/auth/refresh` (single-flight) |
| Auth boundaries & rate limits | Coberto por `AUTH-02`, `AUTH-03` e `AUTH-06`: todos os endpoints `/api/v1/**` (exceto `/api/v1/auth/providers`, `/api/v1/auth/google/login`, `/api/v1/auth/google/callback`, `/api/v1/auth/refresh`, `/api/v1/auth/logout` e `/api/v1/auth/dev-login` quando habilitado) exigem sessão válida (`401 Unauthorized` RFC 9457); `/q/health/**` permanece público para healthchecks; `POST /api/v1/auth/dev-login` retorna `404 Not Found` quando `lumo.auth.dev-login.enabled=false`; cookies usam `HttpOnly`, `SameSite=Lax` e `Secure` configurável (`true` em `%prod`); rate limiting distribuído é N/A nesta fase pessoal/familiar porque o tráfego de autenticação é privado (Google Test Users) e protegido por reverse proxy em produção |
| Concurrency / ordering | Coberto por `AUTH-03`: a rotação de `refresh_sessions` valida e revoga o token anterior atomicamente na transação (`revoked_at IS NULL AND expires_at > now()`), impedindo que duas requisições simultâneas emitam duas sessões válidas a partir do mesmo refresh token |
| Data lifecycle / expiry | Coberto por `AUTH-01` e `AUTH-03`: cookie `lumo_oauth_state` expira em 5 minutos; Access Token JWT (`lumo_access`) expira em 15 minutos; Refresh Token (`lumo_refresh` / `refresh_sessions`) expira em 30 dias e armazena exclusivamente hash `SHA-256` em banco; logout marca `revoked_at` e limpa todos os cookies de autenticação (`Max-Age=0`) |
| Observability | Coberto por `AUTH-01`, `AUTH-02` e `AUTH-03`: o backend registra logs de auditoria (`INFO`/`WARN`) para login bem-sucedido (`userId`), rejeição de callback OAuth (motivo), falha de refresh/reuso de token e logout, garantindo que `client_secret`, `code`, `code_verifier`, `id_token`, JWTs e refresh tokens nunca sejam gravados nos logs |
| External-dependency failure | Coberto por `AUTH-01`: chamadas HTTP ao Google Token Endpoint e ao endpoint JWKS usam timeout explícito (10 segundos), cache em memória das chaves públicas JWKS com recarga sob `kid` desconhecido, e falhas de rede/timeout redirecionam para `/login?error=provider_unavailable` sem derrubar o backend |
| State-transition integrity | Coberto por `AUTH-03`, `AUTH-04` e `AUTH-05`: sessões em `refresh_sessions` seguem transição irreversível (`ACTIVE` → `REVOKED`/`ROTATED` ou `EXPIRED`); usuários com `active = false` têm login e refresh bloqueados; no Angular, `AuthService` inicia em estado `loading` até resolver `GET /api/v1/auth/me`, evitando renderização prematura da sidebar ou flash de conteúdo protegido antes da validação da sessão |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here - nothing is left silently unclear.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Controle de acesso de usuários permitidos (Google Test Users vs. Allowlist na aplicação) | Confiar na lista de *Test users* do Google Cloud Console por padrão, com suporte à variável de ambiente opcional `LUMO_ALLOWED_EMAILS` (vazia por padrão = aceita qualquer conta liberada pelo Google; quando preenchida com e-mails separados por vírgula, bloqueia e-mails fora da lista com `error=email_not_allowed`) | Atende o pedido de zero configuração obrigatória na aplicação enquanto oferece defesa em profundidade contra uma eventual publicação acidental do app no Google Cloud Console (escopos básicos publicam sem auditoria) | y |
| Escopo de dados após autenticação | Workspace financeiro único compartilhado por todos os usuários autorizados (sem `household_id` nas tabelas financeiras nesta etapa) | Alinhado à decisão de autenticação mínima pessoal/familiar rápida para produção, mantendo `Household` multi-tenant para evolução futura | y |
| Estratégia de sessão e cookies | Sessão própria do Lumo: Access Token JWT (15 min) em cookie `lumo_access` + Refresh Token opaco rotativo (30 dias, hash SHA-256 em `refresh_sessions`) em cookie `lumo_refresh`, ambos `HttpOnly` e `SameSite=Lax` (`Secure=true` em `%prod`, `false` em `%dev`/`%test`) | Aproveita o proxy same-origin de `frontend/nginx.conf` e `frontend/proxy.conf.json`, elimina exposição de tokens em `localStorage` e mantém o usuário logado por 30 dias mesmo com o app Google em modo Testing | y |
| Login de desenvolvimento (`Entrar como Dev`) | Endpoint `POST /api/v1/auth/dev-login` e botão `"Entrar como Dev"` na tela `/login` habilitados via `lumo.auth.dev-login.enabled` (`true` em `%dev`/`%test`, `false` em `%prod`), criando/reutilizando usuário fixo `dev@lumo.local` | Aprovado explicitamente pelo usuário para agilizar desenvolvimento local e manter testes de integração e Playwright E2E determinísticos | y |
| Segredo de assinatura JWT e proteção de startup em produção | Assinatura HMAC-SHA256 (`HS256`) usando `LUMO_AUTH_JWT_SECRET` (mínimo 32 caracteres obrigatório em `%prod`, falhando o startup caso ausente ou curto; valor padrão determinístico apenas em `%dev`/`%test`) | Evita configuração de pares de chaves PEM para um monólito/backend único, garantindo segurança forte em produção com 1 única variável de ambiente | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Fluxo Google OAuth 2.0 (Authorization Code + PKCE) e Persistência de Usuários (`AUTH-01`) ⭐ MVP

**User Story**: Como usuário do Lumo, quero entrar na aplicação usando minha conta Google de forma segura e sem custo de mensageria, para acessar meus orçamentos em produção sem precisar criar ou lembrar senhas.

**Why P1**: É o mecanismo central de autenticação para publicar o Lumo em produção com segurança e custo zero.

**Acceptance Criteria**:

1. WHEN a browser requests `GET /api/v1/auth/google/login` (with optional `returnUrl` query parameter) THEN the system SHALL generate a cryptographically random `state` (≥ 128 bits) and PKCE `code_verifier` (RFC 7636 `S256`), store them with the sanitized `returnUrl` in a signed/encrypted `HttpOnly` cookie `lumo_oauth_state` expiring in 5 minutes, and respond with HTTP `302 Found` redirecting to `https://accounts.google.com/o/oauth2/v2/auth` with `scope=openid email profile`, `response_type=code`, `code_challenge_method=S256`, `client_id`, `redirect_uri`, and `state`.
2. WHEN Google redirects to `GET /api/v1/auth/google/callback?code=...&state=...` with a valid matching `state` cookie THEN the system SHALL exchange `code` and `code_verifier` at Google's token endpoint (timeout 10s), cryptographically verify the returned `id_token` against Google's JWKS public keys validating `iss`, `aud == GOOGLE_OAUTH_CLIENT_ID`, `exp`, and `email_verified == true`, upsert the user in PostgreSQL (`users` keyed by `google_sub`), create a 30-day `RefreshSession`, set `lumo_access` and `lumo_refresh` `HttpOnly` cookies, clear `lumo_oauth_state`, and redirect (`302 Found`) to the sanitized `returnUrl` (default `/dashboard`).
3. IF the Google callback fails because of user denial (`error=access_denied`), missing/mismatched `state`, invalid/expired `id_token`, `email_verified != true`, disabled user (`active = false`), or Google endpoint unavailability/timeout THEN the system SHALL clear `lumo_oauth_state`, create no user or session, log the failure reason without leaking secrets or tokens, and redirect (`302 Found`) to `/login?error=<reason_code>` (`access_denied`, `invalid_state`, `oauth_failed`, `account_disabled`, or `provider_unavailable`).
4. WHERE `LUMO_ALLOWED_EMAILS` is configured with one or more comma-separated email addresses, IF the verified Google email (case-insensitive) is not in the configured list THEN the system SHALL deny authentication, create no session, clear `lumo_oauth_state`, and redirect (`302 Found`) to `/login?error=email_not_allowed`.
5. The system SHALL isolate authentication domain entities (`User`, `RefreshSession`) in `io.github.tiaggofg.lumo.domain` with zero Quarkus/Jakarta/Hibernate/Jackson dependencies (`AD-003`), persist them via Liquibase SQL migration (`003-create-auth-schema.sql`), and inject Google OAuth exchange/JWKS verification behind an application port so unit and integration tests run without external network calls.

**Independent Test**: Executar testes unitários e de integração (`./mvnw verify`) simulando o fluxo completo `GET /api/v1/auth/google/login` → `GET /api/v1/auth/google/callback` com stub do provedor Google (sucesso, upsert repetido, `state` inválido, `access_denied`, `email_verified=false`, allowlist opcional e timeout), validando cookies `HttpOnly`, registros em `users` e `refresh_sessions` e redirecionamento.

---

### P1: Proteção de Rotas da API, Sessões Próprias, Refresh Rotativo e Logout (`AUTH-02`, `AUTH-03`) ⭐ MVP

**User Story**: Como usuário autenticado do Lumo, quero que meus dados financeiros fiquem bloqueados para qualquer requisição não autenticada, que minha sessão dure 30 dias sem pedir login toda hora e que o botão Sair revogue minha sessão no servidor.

**Why P1**: Sem proteção efetiva da API e gestão segura de sessão, o login seria apenas cosmético.

**Acceptance Criteria**:

1. The system SHALL require a valid `lumo_access` JWT cookie (valid signature, non-expired, existing active user) on every endpoint under `/api/v1/**` except `/api/v1/auth/providers`, `/api/v1/auth/google/login`, `/api/v1/auth/google/callback`, `/api/v1/auth/refresh`, `/api/v1/auth/logout`, and (only when enabled) `/api/v1/auth/dev-login`.
2. IF a client sends a request to a protected `/api/v1/**` endpoint or `GET /api/v1/auth/me` without a valid non-expired `lumo_access` cookie THEN the system SHALL respond with HTTP `401 Unauthorized` in RFC 9457 format (`application/problem+json`) with `status: 401`, `title`, and `detail`.
3. WHILE a request carries a valid `lumo_access` cookie, WHEN the client calls `GET /api/v1/auth/me` THEN the system SHALL return HTTP `200 OK` with `{ id, email, name, avatarUrl }`.
4. WHEN a client calls `POST /api/v1/auth/refresh` with a valid, non-expired, non-revoked `lumo_refresh` cookie THEN the system SHALL atomically revoke the previous `RefreshSession` row, persist a new 30-day `RefreshSession` storing only the `SHA-256` hash of the new opaque token, set fresh `lumo_access` (15 min) and `lumo_refresh` (30 days) `HttpOnly; SameSite=Lax` cookies, and return HTTP `200 OK` with the authenticated user summary.
5. IF a client calls `POST /api/v1/auth/refresh` with a missing, unknown, expired, or already-revoked `lumo_refresh` cookie (or belonging to an inactive user) THEN the system SHALL clear `lumo_access` and `lumo_refresh` cookies (`Max-Age=0`) and respond with HTTP `401 Unauthorized` in RFC 9457 format.
6. WHEN a client calls `POST /api/v1/auth/logout` THEN the system SHALL revoke the `RefreshSession` matching the `lumo_refresh` cookie if present, clear both `lumo_access` and `lumo_refresh` cookies (`Max-Age=0`), and return HTTP `204 No Content`.
7. The system SHALL keep `/q/health/**` accessible without authentication so Docker and production liveness/readiness probes continue operating normally.
8. WHILE running in `%prod` profile, IF `LUMO_AUTH_JWT_SECRET` is missing or shorter than 32 characters THEN the system SHALL fail startup with a clear configuration error rather than starting with a weak or default signing secret.

**Independent Test**: Executar testes RestAssured em `backend/` verificando `401 application/problem+json` em `/api/v1/budgets`, `/api/v1/categories`, `/api/v1/recurring-transactions` e `/api/v1/auth/me` sem cookie; `200` com sessão válida; rotação de refresh token e rejeição (`401`) ao tentar reusar o refresh token antigo; revogação efetiva após `POST /api/v1/auth/logout`; e `200` em `/q/health/ready` sem autenticação.

---

### P1: Tela de Login Lumo, Proteção de Rotas no Angular, Renovação Silenciosa e Perfil/Logout na Sidebar (`AUTH-04`, `AUTH-05`) ⭐ MVP

**User Story**: Como usuário do Lumo no desktop e no celular, quero ser redirecionado para uma tela de login elegante quando não estiver autenticado, continuar navegando sem quedas quando meu token curto renovar, ver quem está logado na sidebar e poder sair com um clique.

**Why P1**: Fecha a experiência ponta a ponta no frontend Angular v22 com o mesmo padrão visual ZardUI e identidade Lumo (`AD-009`, `AD-010`).

**Acceptance Criteria**:

1. WHILE the user is unauthenticated, WHEN navigating to any protected route (`/dashboard`, `/budgets`, `/budgets/:id`, `/recurrences`, `/catalog`) THEN the Angular `authGuard` SHALL redirect to `/login?returnUrl=<encoded_path>` without rendering the authenticated `AppShellComponent` sidebar or triggering unauthenticated business API toasts.
2. WHEN the user visits `/login` THEN the system SHALL render a dedicated full-screen authentication page (without the app sidebar/top-bar) displaying `<app-lumo-logo>`, theme toggle support (Light/Dark), a primary **"Entrar com Google"** button (`data-testid="google-login-button"`), and clear PT-BR error alerts when `?error=` is present (`access_denied`, `invalid_state`, `oauth_failed`, `email_not_allowed`, `account_disabled`, `provider_unavailable`), adapting cleanly across desktop (`1280px+`) and mobile (`375px+`).
3. WHEN the user clicks **"Entrar com Google"** on `/login` THEN the browser SHALL navigate to `/api/v1/auth/google/login` passing the sanitized `returnUrl` query parameter when present.
4. WHILE the user is authenticated, WHEN navigating to `/login` THEN the guest guard SHALL redirect automatically to `/dashboard` (or the sanitized `returnUrl`).
5. WHEN an authenticated API call returns HTTP `401 Unauthorized` THEN the Angular `authInterceptor` SHALL attempt a single deduplicated `POST /api/v1/auth/refresh` (with `withCredentials: true`), retry the original request(s) transparently on success without displaying an error toast, or clear client auth state and redirect to `/login` if refresh fails.
6. WHILE the user is authenticated, `AppShellComponent` SHALL display the logged-in user's name/email and avatar (with initials fallback) plus a **"Sair"** action button (`data-testid="logout-button-desktop"` and `data-testid="logout-button-mobile"`) in both the desktop sidebar footer (adapting to the collapsed `w-20` rail with `[zTooltip]`) and the mobile slide-out drawer.
7. WHEN the user clicks **"Sair"** THEN `AuthService` SHALL call `POST /api/v1/auth/logout`, clear client session state, and navigate to `/login`.

**Independent Test**: Executar testes Vitest do `AuthService`, `authGuard`, `guestGuard`, `authInterceptor`, `LoginPageComponent` e `AppShellComponent`, além de testes Playwright E2E em desktop (`1280x800`) e mobile (`390x844`) cobrindo redirecionamento anônimo para `/login`, preservação de `returnUrl`, persistência após reload da página, sidebar expandida/recolhida com perfil do usuário e logout completo.

---

### P1: Modo "Entrar como Dev" Exclusivo de Desenvolvimento e Testes (`AUTH-06`) ⭐ MVP

**User Story**: Como desenvolvedor do Lumo, quero um atalho **"Entrar como Dev"** disponível apenas fora de produção (`%dev`/`%test`), para desenvolver localmente e rodar toda a suíte Playwright E2E sem depender de login interativo no Google.

**Why P1**: Mantém o fluxo local (`quarkus:dev` + `npm start`) produtivo e permite que toda a suíte E2E Playwright existente e nova rode de forma 100% determinística em CI/local.

**Acceptance Criteria**:

1. WHEN a client calls `GET /api/v1/auth/providers` THEN the system SHALL return HTTP `200 OK` with `{ googleEnabled: boolean, devLoginEnabled: boolean }` reflecting active configuration (`devLoginEnabled` is `true` in `%dev`/`%test` and `false` in `%prod`).
2. WHERE `lumo.auth.dev-login.enabled` is `true` (default in `%dev` and `%test` only), WHEN a client calls `POST /api/v1/auth/dev-login` THEN the system SHALL upsert a deterministic local user (`email: "dev@lumo.local"`, `name: "Desenvolvedor Lumo"`, `google_sub: "dev-local-user"`), issue genuine `lumo_access` and `lumo_refresh` `HttpOnly` cookies using the exact same session mechanism as Google OAuth, and return HTTP `200 OK` with the user summary.
3. WHERE `lumo.auth.dev-login.enabled` is `false` (mandatory default in `%prod`), WHEN any client calls `POST /api/v1/auth/dev-login` THEN the system SHALL reject the request with HTTP `404 Not Found` (`application/problem+json`) and emit no cookies or user records.
4. WHERE `GET /api/v1/auth/providers` returns `devLoginEnabled: true`, `/login` SHALL render a clearly labeled secondary button **"Entrar como Dev"** (`data-testid="dev-login-button"`) that calls `POST /api/v1/auth/dev-login` and navigates to the sanitized `returnUrl` (or `/dashboard`); WHERE `devLoginEnabled: false`, the button SHALL NOT be rendered in the DOM.

**Independent Test**: Verificar em testes de integração Quarkus que `POST /api/v1/auth/dev-login` autentica e emite cookies válidos quando habilitado e retorna `404` quando desabilitado; no Playwright E2E, usar `"Entrar como Dev"` para autenticar e validar que toda a suíte E2E existente (`/dashboard`, `/budgets`, `/recurrences`, `/catalog`) continua passando sem falhas.

---

## Edge Cases

- IF `returnUrl` passed to `/login` or `/api/v1/auth/google/login` is an external URL (`https://evil.com`), protocol-relative (`//evil.com`), or malformed THEN the system SHALL discard it and fall back to `/dashboard` to prevent open-redirect vulnerabilities.
- IF a user triggers `GET /api/v1/auth/google/login` when `GOOGLE_OAUTH_CLIENT_ID` or `GOOGLE_OAUTH_CLIENT_SECRET` is not configured THEN the system SHALL redirect to `/login?error=provider_unavailable` and log a warning instead of returning an unhandled `500` stacktrace.
- IF multiple API requests on `/dashboard` simultaneously receive `401 Unauthorized` after the 15-minute access token expires THEN `authInterceptor` SHALL execute `POST /api/v1/auth/refresh` exactly once and replay all queued requests after the fresh `lumo_access` cookie is issued.
- IF `GET /api/v1/auth/me` returns `401` during initial app bootstrap on an unauthenticated visit THEN `problemDetailInterceptor` SHALL NOT display an intrusive error toast on `/login`.
- IF a Google user changes their display name or profile picture in their Google account THEN subsequent logins SHALL update `name` and `avatar_url` on the existing `users` record matched by `google_sub` without creating a duplicate user.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| AUTH-01 | P1: Fluxo Google OAuth 2.0 (Authorization Code + PKCE) e Persistência de Usuários | Tasks | In Tasks |
| AUTH-02 | P1: Proteção de Rotas da API e Contrato `401` RFC 9457 | Tasks | In Tasks |
| AUTH-03 | P1: Sessões Próprias (JWT 15m + Refresh Rotativo 30d) e Logout | Tasks | In Tasks |
| AUTH-04 | P1: Tela `/login`, Guards de Rota e `returnUrl` Sanitizado no Angular | Tasks | In Tasks |
| AUTH-05 | P1: Renovação Silenciosa (`authInterceptor`), Perfil do Usuário e Logout na Sidebar/Drawer | Tasks | In Tasks |
| AUTH-06 | P1: Modo "Entrar como Dev" Exclusivo de `%dev`/`%test` e Compatibilidade E2E | Tasks | In Tasks |

**Coverage:** 6 total, 6 mapped to tasks, 0 unmapped

---

## Sources

- [STATE.md](../../STATE.md) - Decisões arquiteturais ativas (`AD-002`, `AD-003`, `AD-007`, `AD-009`, `AD-010`).
- [seguranca-e-privacidade.md](../../../docs/seguranca-e-privacidade.md) - Escopo atual de segurança e evolução planejada.
- [nginx.conf](../../../frontend/nginx.conf) - Proxy reverso same-origin `/api/` para o backend Quarkus em produção.
- [context.md](context.md) - Decisões de produto coletadas com o usuário em `2026-11-27`.

---

## Success Criteria

- [ ] Nenhuma rota de negócio sob `/api/v1/**` responde dados financeiros sem cookie de sessão válido (`401 application/problem+json` garantido).
- [ ] Login completo com Google OAuth 2.0 (Authorization Code + PKCE) funciona ponta a ponta com `GOOGLE_OAUTH_CLIENT_ID` e `GOOGLE_OAUTH_CLIENT_SECRET`, mantendo sessão ativa por 30 dias via cookies `HttpOnly`.
- [ ] Em `%prod`, `POST /api/v1/auth/dev-login` retorna `404` e o botão `"Entrar como Dev"` não aparece na UI; em `%dev`/`%test`, toda a suíte backend (`./mvnw verify`), frontend (`npm run lint && npm run build && npm test -- --watch=false`), Playwright E2E e SonarQube Quality Gate passam com 100% de sucesso.
