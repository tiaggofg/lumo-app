# Segurança e Privacidade

## Autenticação e Sessões (`AD-011`)
- **Provedor de Produção**: **Google OAuth 2.0 (Authorization Code + PKCE S256)** executado no backend Quarkus (padrão BFF), com validação criptográfica do `id_token` contra o endpoint JWKS oficial do Google (`RS256`, `iss`, `aud`, `exp`, `email_verified = true`, timeout de 10s e cache em memória com recarga sob `kid` desconhecido).
- **Sessões Próprias via Cookies `HttpOnly`**:
  - `lumo_access`: JWT `HS256` assinado com `LUMO_AUTH_JWT_SECRET`, TTL de **15 minutos**, `HttpOnly; SameSite=Lax; Path=/api` (`Secure=true` em `%prod`).
  - `lumo_refresh`: token opaco de 256 bits, TTL de **30 dias**, `HttpOnly; SameSite=Lax; Path=/api/v1/auth` (`Secure=true` em `%prod`). Apenas o hash `SHA-256` (64 chars hex) é armazenado na tabela `refresh_sessions`, com rotação atômica (`revoked_at IS NULL`) e revogação efetiva no logout.
  - `lumo_oauth_state`: payload `{ state, codeVerifier, returnUrl, exp }` assinado com HMAC-SHA256, TTL de **5 minutos**, com sanitização anti-open-redirect de `returnUrl`.
  - Nenhum token é armazenado em `localStorage` ou `sessionStorage`.
- **Proteção Transversal da API**: `AuthRequestFilter` (`@Priority(Priorities.AUTHENTICATION)`) protege 100% dos endpoints `/api/v1/**` e `GET /api/v1/auth/me` retornando `401 Unauthorized` em RFC 9457 (`application/problem+json`). Apenas `/api/v1/auth/{providers,google/login,google/callback,refresh,logout,dev-login}` e `/q/health/**` permanecem acessíveis sem cookie `lumo_access`.
- **Controle de Acesso de Contas**: Por padrão, confia na lista de *Test users* do Google Cloud Console; opcionalmente aceita `LUMO_ALLOWED_EMAILS` (e-mails separados por vírgula, case-insensitive) para defesa em profundidade.
- **Modo Dev (`Entrar como Dev`)**: `POST /api/v1/auth/dev-login` é estritamente restrito a `%dev`/`%test` (`lumo.auth.dev-login.enabled=false` em `%prod`, retornando `404 Not Found`).
- **Guarda de Startup em Produção**: `AuthStartupValidator` aborta a inicialização em `%prod` caso `LUMO_AUTH_JWT_SECRET` esteja ausente ou possua menos de 32 caracteres.

## CORS, Validação e Sigilo em Logs
- **CORS**: Restrito às origens configuradas em `application.properties` com `access-control-allow-credentials=true`.
- **Tratamento de Erros**: `ProblemDetailExceptionMapper` nunca expõe stacktraces ou detalhes internos em respostas HTTP `500`, e os logs de auditoria de autenticação nunca gravam `client_secret`, `code`, `code_verifier`, `id_token`, JWTs ou refresh tokens.
- **Validação de Entrada**: Todas as entradas são validadas via Bean Validation e nos invariantes puros do domínio (`User`, `RefreshSession`, `Money > 0`, formatos ISO `YYYY-MM`).

## Evolução Futura
- Isolamento multi-tenant por `Household` nas tabelas financeiras.
