# Deploy Vercel & Portainer CE Specification

**Status**: Approved
**Approved**: 2026-11-28 - user: "sim, está aprovado"

## Problem Statement

O Lumo está pronto localmente via `docker-compose.yml`, mas ainda não possui artefatos nem adaptações cross-origin para deploy contínuo em produção com o frontend Angular na Vercel e o backend Quarkus em um Portainer CE (em VPS Linux **AMD64** de 1 GB RAM ou **ARM64**). Como a autenticação utiliza cookies `HttpOnly` e redirecionamentos `302` do Google OAuth 2.0, o backend precisa suportar `CORS_ALLOWED_ORIGINS`, `LUMO_FRONTEND_URL` e `LUMO_AUTH_COOKIE_SAME_SITE` configuráveis, o frontend precisa injetar `BACKEND_URL` no build e suportar SPA routing na Vercel, e o repositório precisa de dois arquivos de produção (`docker-compose.prod.amd64.yml` e `docker-compose.prod.arm64.yml`) aliados a um workflow GitHub Actions multi-arch (`linux/amd64,linux/arm64`) com publicação no GHCR e callback automático para redeploy no Portainer CE (mesmo padrão do `secret-santa`).

## Goals

- [x] Permitir deploy do frontend Angular na Vercel apontando diretamente para o backend via `BACKEND_URL` sem quebrar rotas SPA nem o fluxo local via `proxy.conf.json`.
- [x] Garantir que autenticação Google OAuth 2.0 e sessões via cookies `HttpOnly` funcionem em comunicação cross-origin entre Vercel e Portainer CE.
- [x] Fornecer dois arquivos Docker Compose de produção dedicados — `docker-compose.prod.amd64.yml` (x86_64, ajustado para VMs de 1 GB RAM) e `docker-compose.prod.arm64.yml` (ARM64) — consumindo a imagem multi-arch do backend conectada a PostgreSQL externo.
- [x] Automatizar testes completos (`./mvnw verify`), build/push multi-arch (`linux/amd64,linux/arm64`) da imagem Docker endurecida no GHCR e redeploy automático da stack Git no Portainer CE a cada push em `main`.
- [x] Documentar de forma completa o passo a passo de configuração na Vercel, Portainer CE (ARM64 e AMD64), Cloudflare Tunnel/DNS, GitHub Actions e Google Cloud Console.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Proxy reverso `/api/*` dentro da Vercel (Serverless Functions ou Edge Rewrites) | Usuário optou por chamada direta cross-origin via `BACKEND_URL` no build, alinhado ao `secret-santa` |
| Container PostgreSQL 17 nos arquivos `docker-compose.prod.*.yml` | Usuário optou por PostgreSQL externo (Neon, Supabase ou banco no host/Portainer) |
| Múltiplas réplicas do `backend` na mesma VM | Avaliação técnica confirmou que 1 container Quarkus é superior em estabilidade e RAM numa VM de 1 GB |
| Workflow GitHub Actions para deploy do frontend | A Vercel faz build e deploy nativamente pela integração Git apontando para `frontend/` |
| Deploy em GCP Cloud Run / AWS | Usuário optou por manter a infra na Oracle Cloud + Portainer CE + `cloudflared` |
| Compilação GraalVM Native Image | Imagem de produção mantém Quarkus JVM (`eclipse-temurin:25-jre`) conforme `AD-002` |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Comunicação Vercel ↔ Portainer | Chamada direta cross-origin via `BACKEND_URL` no build + `CORS_ALLOWED_ORIGINS`, `LUMO_FRONTEND_URL`, `LUMO_AUTH_COOKIE_SAME_SITE` | Decisão explícita do usuário na discussão inicial, espelhando o padrão do `secret-santa` | y |
| Banco PostgreSQL em produção | PostgreSQL externo via `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` + `host.docker.internal:host-gateway` | Decisão explícita do usuário; compose de produção sobe apenas 1 container `backend` | y |
| Arquiteturas de produção (ARM e AMD) | Dois arquivos `docker-compose.prod.arm64.yml` (`platform: linux/arm64`) e `docker-compose.prod.amd64.yml` (`platform: linux/amd64`, com `JAVA_OPTS_APPEND` enxuto `-Xms64m -Xmx220m`) + imagem multi-arch `linux/amd64,linux/arm64` no GHCR | Decisão explícita do usuário para rodar já na `E2.1.Micro` (1 GB RAM) e estar pronto para `A1.Flex` ARM64 | y |
| Nível de testes no CI de deploy do backend | Suíte completa `./mvnw verify --batch-mode` (unitários + ArchUnit + integração Testcontainers) | Decisão explícita do usuário; runner `ubuntu-latest` possui Docker para Testcontainers | y |
| Validação de variáveis de deploy no startup do backend | Fail-fast em `AuthStartupValidator` para `LUMO_AUTH_COOKIE_SAME_SITE` inválido ou `NONE` sem `cookie-secure=true`, e para `LUMO_FRONTEND_URL` sem `http://`/`https://` ou sem host válido | Evita deploy aparentemente saudável que quebra silenciosamente o login OAuth/cookies no navegador | y |
| Hardening e multi-arch do `backend/Dockerfile` | `FROM --platform=$BUILDPLATFORM eclipse-temurin:25-jdk AS build`, estágio final `eclipse-temurin:25-jre` com `curl`, usuário não-root `appuser` e `ENTRYPOINT` respeitando `JAVA_OPTS_APPEND` via `exec` | Compila Maven na velocidade nativa do runner sem emulação QEMU, garante healthcheck + non-root e permite ajustar heap da JVM em VMs de 1 GB RAM | y |
| Dimensões implícitas (concorrência, ciclo de vida de dados, observabilidade) | N/A para este escopo — não há novos estados de domínio, tabelas nem filas; logs existentes de auth e healthcheck `/q/health/ready` permanecem inalterados | Escopo restrito a configuração de runtime, build, containerização e pipeline CI/CD | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Backend Cross-Origin, OAuth Redirects e Cookies Configuráveis ⭐ MVP

**User Story**: As a developer deploying Lumo to Portainer CE, I want CORS origins, post-OAuth frontend redirects, and cookie `SameSite` policy to be configurable via environment variables so that the Vercel frontend can authenticate and consume the API over cross-origin HTTPS without breaking local development.

**Why P1**: Sem CORS configurável, redirect absoluto para o domínio da Vercel e política `SameSite` ajustável, o login Google OAuth e as chamadas autenticadas falham completamente em produção.

**Acceptance Criteria**:

1. (`DEPLOY-01`) The backend SHALL configure `quarkus.http.cors.origins` from `CORS_ALLOWED_ORIGINS` (defaulting to `http://localhost:4200,http://127.0.0.1:4200,http://localhost:4201,http://127.0.0.1:4201` when unset) with `quarkus.http.cors.access-control-allow-credentials=true`.
2. (`DEPLOY-02`) WHEN `LUMO_FRONTEND_URL` is set to a non-blank HTTP(S) origin (with or without trailing slash) and `GET /api/v1/auth/google/callback` completes authentication, THEN the backend SHALL return HTTP `302` with `Location` equal to `<normalized-LUMO_FRONTEND_URL><returnUrl>` (for example `https://lumo.example.com/dashboard`).
3. (`DEPLOY-03`) WHEN `LUMO_FRONTEND_URL` is set to a non-blank HTTP(S) origin and Google OAuth login or callback redirects with an error, THEN the backend SHALL return HTTP `302` with `Location` equal to `<normalized-LUMO_FRONTEND_URL>/login?error=<errorCode>`.
4. (`DEPLOY-04`) WHILE `LUMO_FRONTEND_URL` is blank or unset, the backend SHALL return relative `Location` headers (`<returnUrl>` and `/login?error=<errorCode>`) preserving compatibility with local proxy and Docker Compose Nginx.
5. (`DEPLOY-05`) The backend SHALL resolve the cookie `SameSite` attribute from `LUMO_AUTH_COOKIE_SAME_SITE` (default `LAX`, accepting `LAX`, `NONE`, and `STRICT` case-insensitively) and apply it to `lumo_access`, `lumo_refresh`, and `lumo_oauth_state` cookies.
6. (`DEPLOY-06`) IF `LUMO_AUTH_COOKIE_SAME_SITE` is set to an unsupported value OR set to `NONE` while `lumo.auth.cookie-secure` is `false`, THEN `AuthStartupValidator` SHALL throw `IllegalStateException` blocking application startup.
7. (`DEPLOY-07`) IF `LUMO_FRONTEND_URL` is non-blank and does not start with `http://` or `https://` (or fails URI parsing without a valid host), THEN `AuthStartupValidator` SHALL throw `IllegalStateException` blocking application startup.

**Independent Test**: Executar testes unitários e de integração Quarkus (`./mvnw test` e `./mvnw verify`) validando `AuthStartupValidator`, `AuthCookieHelper` (`LAX`/`NONE`/`STRICT`), `AuthResource` redirects com e sem `LUMO_FRONTEND_URL`, e preflight CORS com `CORS_ALLOWED_ORIGINS`.

---

### P1: Frontend Pronto para Vercel (`vercel.json`, `BACKEND_URL` e Interceptors) ⭐ MVP

**User Story**: As a developer deploying the Angular frontend to Vercel, I want SPA routes rewritten to `/index.html` and the backend base URL injected at build time via `BACKEND_URL` so that all API requests and Google OAuth login redirects target the Portainer backend with credentials.

**Why P1**: Na Vercel, deep links em rotas Angular retornam `404` sem `vercel.json`, e requisições `/api/v1/*` precisam apontar para o domínio do backend com `withCredentials: true`.

**Acceptance Criteria**:

1. (`DEPLOY-08`) The repository SHALL include `frontend/vercel.json` rewriting `/(.*)` to `/index.html`.
2. (`DEPLOY-09`) WHEN `npm run build` runs in `frontend/`, THEN `frontend/scripts/set-env.mjs` SHALL read `BACKEND_URL` (falling back to `API_URL`, then `""`), strip trailing slashes, write `frontend/src/environments/environment.ts` exporting `environment.apiUrl`, and run `ng build`.
3. (`DEPLOY-10`) WHEN `environment.apiUrl` is non-empty and Angular `HttpClient` sends a request whose URL starts with `/api/`, THEN the HTTP interceptor chain SHALL rewrite the outgoing URL to `${environment.apiUrl}${req.url}` and set `withCredentials: true`, preserving transparent `401` session refresh and single retry without duplicating the base URL prefix.
4. (`DEPLOY-11`) WHEN `AuthService.buildGoogleLoginUrl(returnUrl)` is invoked, THEN it SHALL return `${environment.apiUrl}/api/v1/auth/google/login?returnUrl=<encodedReturnUrl>` (yielding a relative `/api/v1/auth/google/login?...` URL when `environment.apiUrl` is empty).

**Independent Test**: Executar `BACKEND_URL=https://api.lumo.example.com/ npm run build` verificando o conteúdo gerado em `src/environments/environment.ts` e o bundle compilado, além dos testes unitários (`npm test -- --watch=false`) cobrindo o interceptor de URL base, retry após `401` e `AuthService.buildGoogleLoginUrl`.

---

### P1: Containers Multi-Arch (`arm64` e `amd64`) e Callback Portainer CE ⭐ MVP

**User Story**: As a maintainer, I want separate production Docker Compose files for AMD64 (tuned for 1 GB RAM hosts) and ARM64 hosts and an automated GitHub Actions pipeline that runs full backend verification, publishes a multi-arch image to GHCR, and triggers a Portainer CE Git stack redeploy so that I can deploy cleanly on either architecture without manual steps.

**Why P1**: Entrega o requisito central do usuário de subir o backend no Portainer com callback automático de build/deploy igual ao `secret-santa`, pronto para rodar já na VPS AMD64 de 1 GB RAM e futuramente em ARM64.

**Acceptance Criteria**:

1. (`DEPLOY-12`) The `backend/Dockerfile` SHALL use `FROM --platform=$BUILDPLATFORM eclipse-temurin:25-jdk AS build` for native-speed Maven compilation, and its runtime stage (`eclipse-temurin:25-jre`) SHALL install `curl`, create and switch to a non-root user (`appuser`), expose port `8080`, and start Quarkus via `exec java ${JAVA_OPTS_APPEND:-} -jar /work/quarkus-run.jar`.
2. (`DEPLOY-13`) The repository SHALL include both `docker-compose.prod.amd64.yml` (`platform: linux/amd64`, with default `JAVA_OPTS_APPEND` `-Dquarkus.http.host=0.0.0.0 -Xms64m -Xmx220m` tuned for 1 GB RAM hosts) and `docker-compose.prod.arm64.yml` (`platform: linux/arm64`), each defining only the `backend` service using `ghcr.io/tiaggofg/lumo-backend:latest`, `restart: unless-stopped`, port `${BACKEND_PORT:-8080}:8080`, `extra_hosts: ["host.docker.internal:host-gateway"]`, healthcheck `curl -fsS http://localhost:8080/q/health/ready || exit 1`, required variables (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `CORS_ALLOWED_ORIGINS`, `LUMO_FRONTEND_URL`, `LUMO_AUTH_JWT_SECRET`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`), and optional defaults (`TZ`, `LUMO_TIMEZONE`, `LUMO_AUTH_COOKIE_SECURE`, `LUMO_AUTH_COOKIE_SAME_SITE`, `LUMO_ALLOWED_EMAILS`, `JAVA_OPTS_APPEND`).
3. (`DEPLOY-14`) WHEN a commit is pushed to `main` modifying `backend/**`, `docker-compose.prod.*.yml`, or `.github/workflows/deploy-backend.yml` (or triggered via `workflow_dispatch`), THEN `.github/workflows/deploy-backend.yml` SHALL run `./mvnw verify --batch-mode` with Java 25, configure QEMU and Docker Buildx, build and push `backend/Dockerfile` for `platforms: linux/amd64,linux/arm64` to `ghcr.io/${{ github.repository_owner }}/lumo-backend:latest` and `:${{ github.sha }}`, fetch the stack env via `GET ${PORTAINER_URL}/api/stacks/${PORTAINER_STACK_ID}`, and call `PUT ${PORTAINER_URL}/api/stacks/${PORTAINER_STACK_ID}/git/redeploy?endpointId=${PORTAINER_ENDPOINT_ID}` with `pullImage: true`, `prune: true`, `repositoryReferenceName: "refs/heads/main"`, and the stack's preserved `Env`.
4. (`DEPLOY-15`) IF any of `PORTAINER_URL`, `PORTAINER_API_KEY`, `PORTAINER_STACK_ID`, or `PORTAINER_ENDPOINT_ID` is empty during the workflow redeploy step, THEN the workflow SHALL exit with non-zero status and emit a `::error::` annotation before sending any HTTP request to Portainer.

**Independent Test**: Validar `docker compose -f docker-compose.prod.amd64.yml config` e `docker compose -f docker-compose.prod.arm64.yml config`, executar build real da imagem `backend/Dockerfile` verificando execução como `appuser` e `200 OK` em `/q/health/ready`, e validar sintaxe/estrutura de `.github/workflows/deploy-backend.yml`.

---

### P2: Documentação Operacional de Deploy

**User Story**: As a maintainer setting up production for the first time, I want clear documentation in `docs/deploy-e-ci-cd.md` and `README.md` so that I can configure Vercel, Portainer CE (selecting either AMD64 or ARM64 compose), Cloudflare Tunnel/DNS, GitHub Secrets, and Google Cloud OAuth without guesswork.

**Why P2**: Garante reprodutibilidade da configuração em produção e cumpre a regra de sincronização de documentação do repositório.

**Acceptance Criteria**:

1. (`DEPLOY-16`) The repository SHALL update `docs/deploy-e-ci-cd.md` and `README.md` with a Mermaid CI/CD diagram and complete setup instructions covering Vercel (`Root Directory: frontend`, `BACKEND_URL`), Portainer CE Git Stack (`docker-compose.prod.amd64.yml` para VPS AMD64 1 GB RAM e `docker-compose.prod.arm64.yml` para VPS ARM64, com todas as variáveis obrigatórias), Cloudflare Tunnel/DNS, GitHub Actions secrets/vars (`PORTAINER_*`), Google Cloud Console redirect URI (`https://<backend>/api/v1/auth/google/callback`), and cookie `SameSite` guidance (`LAX` para subdomínios do mesmo domínio vs `NONE` para domínios distintos).

**Independent Test**: Revisar `docs/deploy-e-ci-cd.md` e `README.md` confirmando presença de todas as variáveis de `docker-compose.prod.amd64.yml` e `docker-compose.prod.arm64.yml`, segredos de `.github/workflows/deploy-backend.yml` e parâmetros da Vercel.

---

## Edge Cases

- IF `BACKEND_URL` in Vercel contains trailing slashes (e.g. `https://api.lumo.example.com///`), THEN `scripts/set-env.mjs` SHALL normalize it to `https://api.lumo.example.com` so requests never contain double slashes (`//api/v1/...`).
- IF `LUMO_FRONTEND_URL` in Portainer contains trailing slashes (e.g. `https://lumo.example.com/`), THEN `AuthResource` SHALL strip trailing slashes before concatenating `returnUrl` or `/login?error=...`.
- IF `BACKEND_URL` is unset during local development (`npm start` or `npm run build` without env), THEN `environment.apiUrl` SHALL be `""` and the app SHALL continue working identically via `proxy.conf.json` and `frontend/nginx.conf`.
- IF `PORTAINER_URL` contains a trailing slash in GitHub Secrets, THEN `.github/workflows/deploy-backend.yml` SHALL strip it (`${PORTAINER_URL%/}`) before building the REST API URLs.
- IF `PORTAINER_GIT_USERNAME` and `PORTAINER_GIT_PASSWORD` are unset (public repo), THEN the Portainer redeploy payload SHALL set `repositoryAuthentication: false` without failing.
- IF `LUMO_AUTH_COOKIE_SAME_SITE` is set to `NONE` with `LUMO_AUTH_COOKIE_SECURE=false`, THEN startup SHALL fail immediately with `IllegalStateException`.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| DEPLOY-01 | P1: Backend Cross-Origin, OAuth Redirects e Cookies Configuráveis | In Tasks (T1, T5) | Done |
| DEPLOY-02 | P1: Backend Cross-Origin, OAuth Redirects e Cookies Configuráveis | In Tasks (T2, T5) | Done |
| DEPLOY-03 | P1: Backend Cross-Origin, OAuth Redirects e Cookies Configuráveis | In Tasks (T2, T5) | Done |
| DEPLOY-04 | P1: Backend Cross-Origin, OAuth Redirects e Cookies Configuráveis | In Tasks (T5) | Done |
| DEPLOY-05 | P1: Backend Cross-Origin, OAuth Redirects e Cookies Configuráveis | In Tasks (T1, T2, T4) | Done |
| DEPLOY-06 | P1: Backend Cross-Origin, OAuth Redirects e Cookies Configuráveis | In Tasks (T3) | Done |
| DEPLOY-07 | P1: Backend Cross-Origin, OAuth Redirects e Cookies Configuráveis | In Tasks (T3) | Done |
| DEPLOY-08 | P1: Frontend Pronto para Vercel (`vercel.json`, `BACKEND_URL` e Interceptors) | In Tasks (T6) | Done |
| DEPLOY-09 | P1: Frontend Pronto para Vercel (`vercel.json`, `BACKEND_URL` e Interceptors) | In Tasks (T7, T8, T9) | Done |
| DEPLOY-10 | P1: Frontend Pronto para Vercel (`vercel.json`, `BACKEND_URL` e Interceptors) | In Tasks (T10, T11) | Done |
| DEPLOY-11 | P1: Frontend Pronto para Vercel (`vercel.json`, `BACKEND_URL` e Interceptors) | In Tasks (T12) | Done |
| DEPLOY-12 | P1: Containers Multi-Arch (`arm64` e `amd64`) e Callback Portainer CE | In Tasks (T13) | Done |
| DEPLOY-13 | P1: Containers Multi-Arch (`arm64` e `amd64`) e Callback Portainer CE | In Tasks (T14, T15) | Done |
| DEPLOY-14 | P1: Containers Multi-Arch (`arm64` e `amd64`) e Callback Portainer CE | In Tasks (T16) | Done |
| DEPLOY-15 | P1: Containers Multi-Arch (`arm64` e `amd64`) e Callback Portainer CE | In Tasks (T16) | Done |
| DEPLOY-16 | P2: Documentação Operacional de Deploy | In Tasks (T17, T18) | Done |

**Coverage:** 16 total, 16 mapped to tasks, 0 unmapped

---

## Sources

- `.specs/features/07-deploy-vercel-portainer/context.md` — decisões do usuário sobre comunicação cross-origin, PostgreSQL externo, suporte dual AMD64/ARM64, container único e suíte completa `./mvnw verify` no CI.
- `../secret-santa/.github/workflows/deploy-backend.yml` — referência de build/push GHCR + callback Portainer CE REST API.
- `../secret-santa/docker-compose.prod.yml`, `../secret-santa/backend/Dockerfile`, `../secret-santa/frontend/vercel.json`, `../secret-santa/frontend/scripts/set-env.mjs` — referência de empacotamento e deploy do projeto irmão.

---

## Success Criteria

- [x] `cd backend && ./mvnw verify` passa com 100% dos testes (incluindo novos testes de CORS, `LUMO_FRONTEND_URL`, `LUMO_AUTH_COOKIE_SAME_SITE` e `AuthStartupValidator`).
- [x] `cd frontend && npm run lint && npm run build && npm test -- --watch=false` passa com 100% dos testes (incluindo novos testes do interceptor de `apiUrl`, retry `401` e `buildGoogleLoginUrl`) e `scripts/set-env.mjs` injeta `BACKEND_URL` corretamente.
- [x] Imagem construída por `backend/Dockerfile` executa como `appuser` (não-root), respeita `JAVA_OPTS_APPEND` e responde `200 OK` em `curl -fsS http://localhost:8080/q/health/ready`.
- [x] `docker compose -f docker-compose.prod.amd64.yml config` e `docker compose -f docker-compose.prod.arm64.yml config` validam sem erros com todas as variáveis definidas, e falham com mensagem clara quando alguma variável obrigatória está ausente.
- [x] `.github/workflows/deploy-backend.yml` contém os passos de `./mvnw verify`, push multi-arch GHCR (`linux/amd64,linux/arm64` em `lumo-backend:latest` e `:${{ github.sha }}`) e callback Portainer CE (`GET /api/stacks/{id}` + `PUT /api/stacks/{id}/git/redeploy`), e `docs/deploy-e-ci-cd.md` + `README.md` refletem 100% a configuração final.
