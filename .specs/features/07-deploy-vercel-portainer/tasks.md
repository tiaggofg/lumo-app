# Deploy Vercel & Portainer CE Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, the walk, check_proofs, the Verifier and the screens sub-agent).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/07-deploy-vercel-portainer/spec.md`
**Design**: skipped (scope Medium/Large de infraestrutura e configuração cross-origin seguindo o padrão já validado em `../secret-santa` e `AD-011`, sem novas entidades de domínio)
**Status**: Completed
**Approved**:
**Build**: `cd backend && ./mvnw test-compile; cd frontend && npm run lint && npm run build`
**Run backend-unit**: `cd backend && ./mvnw test -Dtest=AuthStartupValidatorTest,AuthCookieHelperTest`
**Run backend-it**: `cd backend && ./mvnw verify -DskipUTs -Dit.test=AuthResourceIT,CrossOriginAuthIT`
**Run frontend-unit**: `cd frontend && npx ng test --watch=false --include="src/app/core/**/*.spec.ts"`

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md`, `backend/pom.xml`, `frontend/package.json`, `backend/src/test/java/io/github/tiaggofg/lumo/infrastructure/auth/AuthStartupValidatorTest.java`, `backend/src/test/java/io/github/tiaggofg/lumo/infrastructure/auth/AuthResourceIT.java`, `frontend/src/app/core/auth/auth.interceptor.spec.ts`, `frontend/src/app/core/auth/auth.service.spec.ts`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Backend Auth Validator / Cookie Helper (`infrastructure/auth/`) | unit | 1:1 para todas as combinações de `LUMO_AUTH_COOKIE_SAME_SITE` (`LAX`, `NONE`, `STRICT`, case-insensitive, inválido, `NONE` sem `Secure=true`) e `LUMO_FRONTEND_URL` (vazia, HTTP/HTTPS válida, inválida sem esquema/host) | `backend/src/test/java/io/github/tiaggofg/lumo/infrastructure/auth/*Test.java` | `cd backend && ./mvnw test -Dtest=AuthStartupValidatorTest,AuthCookieHelperTest` |
| Backend REST / CORS / OAuth Redirects (`infrastructure/auth/`) | integration | Fluxos OAuth callback sucesso e erro com `LUMO_FRONTEND_URL` configurada (com/sem barra final) e sem `LUMO_FRONTEND_URL` (relativo), além de preflight CORS com `CORS_ALLOWED_ORIGINS` e `Access-Control-Allow-Credentials: true` | `backend/src/test/java/io/github/tiaggofg/lumo/infrastructure/auth/*IT.java` | `cd backend && ./mvnw verify -DskipUTs -Dit.test=AuthResourceIT,CrossOriginAuthIT` |
| Frontend HTTP Interceptor / AuthService (`core/`) | unit | Prefixo de `/api/*` com `environment.apiUrl` não vazia, no-op com `apiUrl` vazia, `withCredentials: true`, retry após `401` sem duplicação de prefixo, e `AuthService.buildGoogleLoginUrl` com e sem `apiUrl` | `frontend/src/app/core/**/*.spec.ts` | `cd frontend && npx ng test --watch=false --include="src/app/core/**/*.spec.ts"` |
| Config / Build Scripts / Docker / CI / Docs | none | Validado por comandos de build, `docker compose config`, build real da imagem Docker e validação sintática YAML (build gate only) | `application.properties`, `AuthConfig.java`, `vercel.json`, `environment.ts`, `set-env.mjs`, `package.json`, `Dockerfile`, `docker-compose.prod.*.yml`, `.github/workflows/deploy-backend.yml`, `docs/` | build gate only |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | After tasks with unit tests only | `cd backend && ./mvnw test` (backend) ou `cd frontend && npm test -- --watch=false` (frontend) |
| Full | After tasks with integration tests | `cd backend && ./mvnw verify` |
| Build | After config/infra/docs tasks or phase completion | `cd backend && ./mvnw verify && cd ../frontend && npm run lint && npm run build && npm test -- --watch=false` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Backend Cross-Origin, OAuth Redirects & Cookie Config

Configura variáveis de ambiente no Quarkus, validação fail-fast no startup, `SameSite` configurável nos cookies e redirects pós-OAuth com `LUMO_FRONTEND_URL`.

```
T1 → T2 → T3 → T4 → T5
```

### Phase 2: Frontend Vercel Build, `BACKEND_URL` & Interceptors

Prepara o roteamento SPA na Vercel, injeção de `BACKEND_URL` no build, interceptor de URL base mantendo refresh `401` e URL absoluta do login Google.

```
T6 → T7 → T8 → T9 → T10 → T11 → T12
```

### Phase 3: Multi-Arch Docker, Dual Prod Compose, Portainer CI/CD & Docs

Endurece o `backend/Dockerfile` para multi-arch, cria `docker-compose.prod.amd64.yml` e `docker-compose.prod.arm64.yml`, adiciona o pipeline GHCR + callback Portainer CE e sincroniza a documentação.

```
T13 → T14 → T15 → T16 → T17 → T18
```

---

## Task Breakdown

### T1: Externalize CORS origins, frontend URL, and cookie SameSite in `application.properties`

**What**: Configurar `quarkus.http.cors.origins=${CORS_ALLOWED_ORIGINS:http://localhost:4200,http://127.0.0.1:4200,http://localhost:4201,http://127.0.0.1:4201}`, `lumo.auth.frontend-url=${LUMO_FRONTEND_URL:}` e `lumo.auth.cookie-same-site=${LUMO_AUTH_COOKIE_SAME_SITE:LAX}` em `application.properties`.
**Where**: `backend/src/main/resources/application.properties`
**Depends on**: None
**Reuses**: Configuração existente de CORS e `lumo.auth.*` em `backend/src/main/resources/application.properties`
**Requirement**: DEPLOY-01, DEPLOY-05

**Done when**:

- [x] `quarkus.http.cors.origins` lê `CORS_ALLOWED_ORIGINS` com fallback para as 4 origens locais e mantém `quarkus.http.cors.access-control-allow-credentials=true`.
- [x] `lumo.auth.frontend-url` lê `LUMO_FRONTEND_URL` com default vazio.
- [x] `lumo.auth.cookie-same-site` lê `LUMO_AUTH_COOKIE_SAME_SITE` com default `LAX`.
- [x] Gate check passes: `cd backend && ./mvnw test`

**Tests**: none
**Gate**: build
**Commit**: `chore(backend): externalize CORS, frontend URL and cookie SameSite`

---

### T2: Expose `frontendUrl()` and `cookieSameSite()` in `AuthConfig`

**What**: Adicionar os métodos `Optional<String> frontendUrl()` e `@WithDefault("LAX") String cookieSameSite()` na interface `@ConfigMapping(prefix = "lumo.auth")` `AuthConfig`.
**Where**: `backend/src/main/java/io/github/tiaggofg/lumo/infrastructure/auth/AuthConfig.java`
**Depends on**: T1
**Reuses**: Padrão `@ConfigMapping` / `@WithDefault` já existente em `AuthConfig.java`
**Requirement**: DEPLOY-02, DEPLOY-03, DEPLOY-05

**Done when**:

- [x] `AuthConfig` declara `Optional<String> frontendUrl()` e `@WithDefault("LAX") String cookieSameSite()`.
- [x] Nenhum teste existente de `AuthConfig` quebra com os novos métodos (mocks/stubs atualizados se necessário).
- [x] Gate check passes: `cd backend && ./mvnw test`

**Tests**: none
**Gate**: build
**Commit**: `feat(auth): expose frontendUrl and cookieSameSite in AuthConfig`

---

### T3: Validate `cookieSameSite` and `frontendUrl` fail-fast in `AuthStartupValidator`

**What**: Estender `AuthStartupValidator` para validar em qualquer profile que `cookieSameSite` seja um valor suportado (`LAX`, `NONE`, `STRICT` case-insensitive), que `NONE` exija `cookieSecure=true`, e que `frontendUrl` (quando não vazia) seja uma URI `http://` ou `https://` com host válido; co-localizar testes unitários em `AuthStartupValidatorTest`.
**Where**: `backend/src/main/java/io/github/tiaggofg/lumo/infrastructure/auth/AuthStartupValidator.java`
**Depends on**: T2
**Reuses**: `backend/src/test/java/io/github/tiaggofg/lumo/infrastructure/auth/AuthStartupValidatorTest.java`
**Requirement**: DEPLOY-06, DEPLOY-07

**Done when**:

- [x] `AuthStartupValidator` lança `IllegalStateException` quando `cookieSameSite` é inválido (ex.: `"INVALID"`).
- [x] `AuthStartupValidator` lança `IllegalStateException` quando `cookieSameSite` é `"NONE"` (ou `"none"`) com `cookieSecure=false`.
- [x] `AuthStartupValidator` aceita `"NONE"` com `cookieSecure=true`, além de `"LAX"` e `"STRICT"` (case-insensitive).
- [x] `AuthStartupValidator` lança `IllegalStateException` quando `frontendUrl` não vazia não inicia com `http://`/`https://` ou não possui host válido (ex.: `"lumo.example.com"`, `"javascript:alert(1)"`, `"https://"`).
- [x] `AuthStartupValidatorTest` cobre todos os casos válidos e inválidos (edge cases inclusos).
- [x] Gate check passes: `cd backend && ./mvnw test -Dtest=AuthStartupValidatorTest`
- [x] Test count: >= 8 tests pass in `AuthStartupValidatorTest` (no silent deletions)

**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): validate cookie SameSite and frontend URL on startup`

---

### T4: Apply configurable `SameSite` policy in `AuthCookieHelper`

**What**: Alterar `AuthCookieHelper` para resolver `NewCookie.SameSite` a partir de `authConfig.cookieSameSite()` (`LAX`, `NONE`, `STRICT`, case-insensitive, default `LAX`) e aplicá-lo a `lumo_access`, `lumo_refresh` e `lumo_oauth_state` (incluindo clear cookies); criar `AuthCookieHelperTest` cobrindo os 3 valores e case-insensitivity.
**Where**: `backend/src/main/java/io/github/tiaggofg/lumo/infrastructure/auth/AuthCookieHelper.java`
**Depends on**: T3
**Reuses**: `AuthConfig` e constantes de `AuthCookieHelper.java`
**Requirement**: DEPLOY-05

**Done when**:

- [x] `AuthCookieHelper` aplica o `SameSite` configurado em `accessCookie`, `refreshCookie`, `oauthStateCookie` e respectivos `clear*Cookie`.
- [x] Valores em minúsculas ou mistos (`"none"`, `"Lax"`, `"strict"`) são resolvidos corretamente para `NewCookie.SameSite`.
- [x] `AuthCookieHelperTest` verifica `LAX`, `NONE` (case-insensitive) e `STRICT` nos cookies emitidos.
- [x] Gate check passes: `cd backend && ./mvnw test -Dtest=AuthCookieHelperTest`
- [x] Test count: >= 4 tests pass in `AuthCookieHelperTest` (no silent deletions)

**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): apply configurable SameSite policy to auth cookies`

---

### T5: Resolve post-OAuth redirect URLs with `LUMO_FRONTEND_URL` in `AuthResource` and add integration tests

**What**: Atualizar `AuthResource` para prefixar o header `Location` dos redirects `302` (callback de sucesso `<returnUrl>` e redirects de erro `/login?error=<errorCode>`) com `LUMO_FRONTEND_URL` normalizada sem barras finais quando configurada, preservando paths relativos quando vazia; atualizar `AuthResourceIT` e adicionar `CrossOriginAuthIT` (com profile de teste definindo `LUMO_FRONTEND_URL`, `CORS_ALLOWED_ORIGINS` e `LUMO_AUTH_COOKIE_SAME_SITE=NONE`) cobrindo sucesso, erro, trailing slash e preflight CORS.
**Where**: `backend/src/main/java/io/github/tiaggofg/lumo/infrastructure/auth/AuthResource.java`
**Depends on**: T4
**Reuses**: `backend/src/test/java/io/github/tiaggofg/lumo/infrastructure/auth/AuthResourceIT.java` e `StubGoogleOAuthClient`
**Requirement**: DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04

**Done when**:

- [x] Com `LUMO_FRONTEND_URL` vazia (`AuthResourceIT`), redirects `302` mantêm `Location` relativo (`/dashboard`, `/catalog`, `/login?error=...`).
- [x] Com `LUMO_FRONTEND_URL=https://lumo.example.com/` (`CrossOriginAuthIT`), callback Google bem-sucedido retorna `302` com `Location: https://lumo.example.com/dashboard` (sem barra dupla) e cookies `SameSite=None`.
- [x] Com `LUMO_FRONTEND_URL=https://lumo.example.com/` (`CrossOriginAuthIT`), erro no callback Google retorna `302` com `Location: https://lumo.example.com/login?error=<errorCode>`.
- [x] Preflight `OPTIONS` em `/api/v1/auth/me` com `Origin: https://lumo.example.com` retorna `Access-Control-Allow-Origin: https://lumo.example.com` e `Access-Control-Allow-Credentials: true`.
- [x] Gate check passes: `cd backend && ./mvnw verify`
- [x] Test count: all existing tests plus >= 3 new integration tests in `CrossOriginAuthIT` pass (no silent deletions)

**Tests**: integration
**Gate**: full
**Commit**: `feat(auth): support cross-origin frontend URL redirects in OAuth`

---

### T6: Add Vercel SPA rewrite configuration in `frontend/vercel.json`

**What**: Criar `frontend/vercel.json` redirecionando `/(.*)` para `/index.html` para habilitar deep linking em todas as rotas SPA do Angular na Vercel.
**Where**: `frontend/vercel.json`
**Depends on**: None
**Reuses**: `../secret-santa/frontend/vercel.json`
**Requirement**: DEPLOY-08

**Done when**:

- [x] `frontend/vercel.json` contém JSON válido com `"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]`.
- [x] Gate check passes: `cd frontend && npm run lint && npm run build`

**Tests**: none
**Gate**: build
**Commit**: `chore(frontend): add vercel.json SPA rewrite rules`

---

### T7: Create default `frontend/src/environments/environment.ts`

**What**: Criar `frontend/src/environments/environment.ts` exportando `export const environment = { apiUrl: '' };` como valor padrão para desenvolvimento local com `proxy.conf.json` e testes unitários.
**Where**: `frontend/src/environments/environment.ts`
**Depends on**: T6
**Reuses**: Convenção de `../secret-santa/frontend/src/environments/environment.ts` e regras ESLint/Prettier de `frontend/`
**Requirement**: DEPLOY-09

**Done when**:

- [x] `frontend/src/environments/environment.ts` exporta `environment` com `apiUrl: ''` e passa no ESLint (`npm run lint`).
- [x] Gate check passes: `cd frontend && npm run lint && npm run build`

**Tests**: none
**Gate**: build
**Commit**: `chore(frontend): add default environment configuration`

---

### T8: Create `frontend/scripts/set-env.mjs` to inject `BACKEND_URL`

**What**: Criar o script Node ESM `frontend/scripts/set-env.mjs` que lê `process.env.BACKEND_URL || process.env.API_URL || ''`, remove espaços e barras finais (`replace(/\/+$/, '')`) e sobrescreve `frontend/src/environments/environment.ts` com formatação compatível com ESLint/Prettier.
**Where**: `frontend/scripts/set-env.mjs`
**Depends on**: T7
**Reuses**: `../secret-santa/frontend/scripts/set-env.mjs`
**Requirement**: DEPLOY-09

**Done when**:

- [x] Executar `BACKEND_URL="https://api.lumo.example.com///" node frontend/scripts/set-env.mjs` grava `apiUrl: 'https://api.lumo.example.com'` em `frontend/src/environments/environment.ts`.
- [x] Executar `API_URL="https://fallback.example.com/" node frontend/scripts/set-env.mjs` (sem `BACKEND_URL`) grava `apiUrl: 'https://fallback.example.com'`.
- [x] Executar `node frontend/scripts/set-env.mjs` sem variáveis restaura `apiUrl: ''` e o arquivo gerado passa em `cd frontend && npm run lint`.
- [x] Gate check passes: `cd frontend && npm run lint && npm run build`

**Tests**: none
**Gate**: build
**Commit**: `build(frontend): add set-env script for BACKEND_URL injection`

---

### T9: Wire `scripts/set-env.mjs` into `frontend/package.json` `build` script

**What**: Atualizar o script `"build"` em `frontend/package.json` para `"node scripts/set-env.mjs && ng build"` mantendo `"start"` com `proxy.conf.json` intacto.
**Where**: `frontend/package.json`
**Depends on**: T8
**Reuses**: `../secret-santa/frontend/package.json`
**Requirement**: DEPLOY-09

**Done when**:

- [x] `"build"` em `frontend/package.json` executa `node scripts/set-env.mjs && ng build`.
- [x] `cd frontend && BACKEND_URL=https://api.lumo.example.com/ npm run build` compila com sucesso injetando a URL normalizada (e executar `npm run build` sem env restaura `apiUrl: ''`).
- [x] Gate check passes: `cd frontend && npm run lint && npm run build`

**Tests**: none
**Gate**: build
**Commit**: `build(frontend): run set-env before ng build`

---

### T10: Create `apiUrlInterceptor` with unit tests

**What**: Criar `apiUrlInterceptor` (usando um `InjectionToken<string>` `API_BASE_URL` com factory padrão lendo `environment.apiUrl` normalizado para facilitar testabilidade sem mutar módulo global) que, quando a base URL não estiver vazia e `req.url.startsWith('/api/')`, reescreve a URL de saída para `${baseUrl}${req.url}` mantendo `withCredentials: true`; co-localizar `api-url.interceptor.spec.ts`.
**Where**: `frontend/src/app/core/interceptors/api-url.interceptor.ts`
**Depends on**: T9
**Reuses**: `frontend/src/environments/environment.ts` e padrão functional interceptor de `problem-detail.interceptor.ts`
**Requirement**: DEPLOY-10

**Done when**:

- [x] Quando `API_BASE_URL` é `'https://api.lumo.example.com'`, requisições `/api/v1/budgets` são reescritas para `https://api.lumo.example.com/api/v1/budgets` com `withCredentials: true`.
- [x] Quando `API_BASE_URL` é `''`, requisições `/api/v1/budgets` permanecem relativas (`/api/v1/budgets`).
- [x] Requisições absolutas ou que não começam com `/api/` não são alteradas nem sofrem duplicação de prefixo.
- [x] `api-url.interceptor.spec.ts` cobre todos os casos acima.
- [x] Gate check passes: `cd frontend && npx ng test --watch=false --include="src/app/core/interceptors/api-url.interceptor.spec.ts"`
- [x] Test count: >= 4 tests pass in `api-url.interceptor.spec.ts` (no silent deletions)

**Tests**: unit
**Gate**: quick
**Commit**: `feat(frontend): add apiUrlInterceptor for cross-origin API base URL`

---

### T11: Register `apiUrlInterceptor` in `app.config.ts` and test 401 refresh retry with base URL

**What**: Registrar `apiUrlInterceptor` após `authInterceptor` em `frontend/src/app/app.config.ts` (`withInterceptors([problemDetailInterceptor, authInterceptor, apiUrlInterceptor])`) e adicionar teste em `frontend/src/app/core/auth/auth.interceptor.spec.ts` cobrindo cadeia completa `authInterceptor + apiUrlInterceptor` com `API_BASE_URL` não vazia garantindo refresh `401` + single retry sem duplicação do prefixo.
**Where**: `frontend/src/app/app.config.ts`
**Depends on**: T10
**Reuses**: `frontend/src/app/core/interceptors/api-url.interceptor.ts` e `frontend/src/app/core/auth/auth.interceptor.spec.ts`
**Requirement**: DEPLOY-10

**Done when**:

- [x] `app.config.ts` registra `[problemDetailInterceptor, authInterceptor, apiUrlInterceptor]`.
- [x] Teste em `auth.interceptor.spec.ts` com `API_BASE_URL = 'https://api.lumo.example.com'` comprova que `GET /api/v1/budgets` envia para `https://api.lumo.example.com/api/v1/budgets` com `withCredentials: true`, após `401` chama `POST https://api.lumo.example.com/api/v1/auth/refresh`, e refaz `GET https://api.lumo.example.com/api/v1/budgets` uma única vez sem duplicar o prefixo.
- [x] Gate check passes: `cd frontend && npx ng test --watch=false --include="src/app/core/**/*.spec.ts"`
- [x] Test count: all existing `auth.interceptor.spec.ts` tests plus >= 1 new cross-origin retry test pass (no silent deletions)

**Tests**: unit
**Gate**: quick
**Commit**: `feat(frontend): wire apiUrlInterceptor in app config`

---

### T12: Prefix `AuthService.buildGoogleLoginUrl` with `API_BASE_URL` and add unit tests

**What**: Injetar `API_BASE_URL` em `AuthService` para que `buildGoogleLoginUrl(returnUrl)` retorne `${baseUrl}/api/v1/auth/google/login?returnUrl=<encodedReturnUrl>` (mantendo `/api/v1/auth/google/login?...` quando `baseUrl` for vazia); adicionar testes unitários em `frontend/src/app/core/auth/auth.service.spec.ts`.
**Where**: `frontend/src/app/core/auth/auth.service.ts`
**Depends on**: T11
**Reuses**: `API_BASE_URL` de `frontend/src/app/core/interceptors/api-url.interceptor.ts` e `frontend/src/app/core/auth/auth.service.spec.ts`
**Requirement**: DEPLOY-11

**Done when**:

- [x] Com `API_BASE_URL` vazia, `buildGoogleLoginUrl('/catalog')` retorna `/api/v1/auth/google/login?returnUrl=%2Fcatalog`.
- [x] Com `API_BASE_URL = 'https://api.lumo.example.com'`, `buildGoogleLoginUrl('/catalog')` retorna `https://api.lumo.example.com/api/v1/auth/google/login?returnUrl=%2Fcatalog`.
- [x] Gate check passes: `cd frontend && npm run lint && npm run build && npm test -- --watch=false`
- [x] Test count: all existing `auth.service.spec.ts` tests plus >= 1 new cross-origin login URL test pass (no silent deletions)

**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): prefix Google OAuth login URL with API_BASE_URL`

---

### T13: Harden `backend/Dockerfile` for multi-arch build, non-root user, `curl` and `JAVA_OPTS_APPEND`

**What**: Atualizar `backend/Dockerfile` para usar `FROM --platform=$BUILDPLATFORM eclipse-temurin:25-jdk AS build`, instalar `curl` e criar usuário não-root `appuser`/`appgroup` no estágio runtime `eclipse-temurin:25-jre`, ajustar ownership de `/work` para `appuser:appgroup`, e usar `ENTRYPOINT ["sh", "-c", "exec java ${JAVA_OPTS_APPEND:-} -jar /work/quarkus-run.jar"]`.
**Where**: `backend/Dockerfile`
**Depends on**: None
**Reuses**: `../secret-santa/backend/Dockerfile` e estrutura fast-jar de `backend/Dockerfile`
**Requirement**: DEPLOY-12

**Done when**:

- [x] `backend/Dockerfile` usa `FROM --platform=$BUILDPLATFORM eclipse-temurin:25-jdk AS build` no estágio de build.
- [x] Estágio final (`eclipse-temurin:25-jre`) instala `curl`, roda como `USER appuser` e inicia Quarkus com `exec java ${JAVA_OPTS_APPEND:-} -jar /work/quarkus-run.jar`.
- [x] `docker build -t lumo-backend:test ./backend` conclui com exit code 0 e `docker run --rm --entrypoint id lumo-backend:test` comprova execução como `appuser` (uid != 0).
- [x] Gate check passes: `docker build -t lumo-backend:test ./backend`

**Tests**: none
**Gate**: build
**Commit**: `build(docker): harden multi-arch backend Dockerfile with non-root user`

---

### T14: Create `docker-compose.prod.amd64.yml` for AMD64 hosts (tuned for 1 GB RAM)

**What**: Criar `docker-compose.prod.amd64.yml` na raiz do repositório com serviço único `backend` (`platform: linux/amd64`, imagem `ghcr.io/tiaggofg/lumo-backend:latest`, `restart: unless-stopped`, porta `${BACKEND_PORT:-8080}:8080`, `extra_hosts: ["host.docker.internal:host-gateway"]`, healthcheck `curl -fsS http://localhost:8080/q/health/ready || exit 1`, `JAVA_OPTS_APPEND` default `-Dquarkus.http.host=0.0.0.0 -Xms64m -Xmx220m` e todas as variáveis obrigatórias com `:?` e opcionais com defaults).
**Where**: `docker-compose.prod.amd64.yml`
**Depends on**: T13
**Reuses**: `../secret-santa/docker-compose.prod.yml` e `docker-compose.yml`
**Requirement**: DEPLOY-13

**Done when**:

- [x] `docker-compose.prod.amd64.yml` declara `platform: linux/amd64`, `image: ghcr.io/tiaggofg/lumo-backend:latest`, `JAVA_OPTS_APPEND: ${JAVA_OPTS_APPEND:--Dquarkus.http.host=0.0.0.0 -Xms64m -Xmx220m}`, healthcheck via `curl` e todas as variáveis obrigatórias e opcionais especificadas em `DEPLOY-13`.
- [x] `docker compose -f docker-compose.prod.amd64.yml config` falha quando variáveis obrigatórias estão ausentes e passa com exit code 0 quando todas estão definidas.
- [x] Gate check passes: `DB_URL=jdbc:postgresql://host:5432/lumo DB_USERNAME=u DB_PASSWORD=p CORS_ALLOWED_ORIGINS=https://lumo.example.com LUMO_FRONTEND_URL=https://lumo.example.com LUMO_AUTH_JWT_SECRET=12345678901234567890123456789012 GOOGLE_OAUTH_CLIENT_ID=cid GOOGLE_OAUTH_CLIENT_SECRET=csec GOOGLE_OAUTH_REDIRECT_URI=https://api.lumo.example.com/api/v1/auth/google/callback docker compose -f docker-compose.prod.amd64.yml config > /dev/null`

**Tests**: none
**Gate**: build
**Commit**: `chore(docker): add production compose for amd64 hosts`

---

### T15: Create `docker-compose.prod.arm64.yml` for ARM64 hosts

**What**: Criar `docker-compose.prod.arm64.yml` na raiz do repositório com serviço único `backend` (`platform: linux/arm64`, imagem `ghcr.io/tiaggofg/lumo-backend:latest`, `restart: unless-stopped`, porta `${BACKEND_PORT:-8080}:8080`, `extra_hosts: ["host.docker.internal:host-gateway"]`, healthcheck `curl -fsS http://localhost:8080/q/health/ready || exit 1`, `JAVA_OPTS_APPEND` default `-Dquarkus.http.host=0.0.0.0` e todas as variáveis obrigatórias com `:?` e opcionais com defaults).
**Where**: `docker-compose.prod.arm64.yml`
**Depends on**: T14
**Reuses**: `docker-compose.prod.amd64.yml`
**Requirement**: DEPLOY-13

**Done when**:

- [x] `docker-compose.prod.arm64.yml` declara `platform: linux/arm64`, `image: ghcr.io/tiaggofg/lumo-backend:latest`, healthcheck via `curl` e todas as variáveis obrigatórias e opcionais especificadas em `DEPLOY-13`.
- [x] `docker compose -f docker-compose.prod.arm64.yml config` falha quando variáveis obrigatórias estão ausentes e passa com exit code 0 quando todas estão definidas.
- [x] Gate check passes: `DB_URL=jdbc:postgresql://host:5432/lumo DB_USERNAME=u DB_PASSWORD=p CORS_ALLOWED_ORIGINS=https://lumo.example.com LUMO_FRONTEND_URL=https://lumo.example.com LUMO_AUTH_JWT_SECRET=12345678901234567890123456789012 GOOGLE_OAUTH_CLIENT_ID=cid GOOGLE_OAUTH_CLIENT_SECRET=csec GOOGLE_OAUTH_REDIRECT_URI=https://api.lumo.example.com/api/v1/auth/google/callback docker compose -f docker-compose.prod.arm64.yml config > /dev/null`

**Tests**: none
**Gate**: build
**Commit**: `chore(docker): add production compose for arm64 hosts`

---

### T16: Create `.github/workflows/deploy-backend.yml` with multi-arch GHCR push and Portainer CE callback

**What**: Criar `.github/workflows/deploy-backend.yml` disparado em `push` para `main` (`backend/**`, `docker-compose.prod.*.yml`, `.github/workflows/deploy-backend.yml`) e `workflow_dispatch`, executando `./mvnw verify --batch-mode` (Java 25), configurando QEMU + Buildx, publicando `backend/Dockerfile` com `platforms: linux/amd64,linux/arm64` em `ghcr.io/${{ github.repository_owner }}/lumo-backend:latest` e `:${{ github.sha }}`, validando presença de `PORTAINER_URL`, `PORTAINER_API_KEY`, `PORTAINER_STACK_ID` e `PORTAINER_ENDPOINT_ID` (com `::error::` e exit 1 se ausentes), buscando `Env` atual via `GET /api/stacks/${PORTAINER_STACK_ID}` e disparando `PUT /api/stacks/${PORTAINER_STACK_ID}/git/redeploy?endpointId=${PORTAINER_ENDPOINT_ID}` (preservando `Env`, `pullImage: true`, `prune: true`, `repositoryReferenceName: "refs/heads/main"`).
**Where**: `.github/workflows/deploy-backend.yml`
**Depends on**: T15
**Reuses**: `../secret-santa/.github/workflows/deploy-backend.yml`
**Requirement**: DEPLOY-14, DEPLOY-15

**Done when**:

- [x] `.github/workflows/deploy-backend.yml` possui sintaxe YAML válida verificada via `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy-backend.yml'))"` (ou parser equivalente).
- [x] Workflow define `permissions: { contents: read, packages: write }`, roda `./mvnw verify --batch-mode`, configura `docker/setup-qemu-action@v3` e `docker/setup-buildx-action@v3`, faz push multi-arch (`linux/amd64,linux/arm64`) para GHCR com `:latest` e `:${{ github.sha }}`.
- [x] Passo Portainer valida os 4 segredos obrigatórios emitindo `::error::` antes de qualquer chamada `curl`, remove barra final de `PORTAINER_URL`, preserva `Env` via `GET /api/stacks/{id}` e dispara `PUT /api/stacks/{id}/git/redeploy?endpointId={endpointId}`.
- [x] Gate check passes: validação YAML + verificação estrutural dos campos obrigatórios do workflow.

**Tests**: none
**Gate**: build
**Commit**: `ci(deploy): add multi-arch GHCR and Portainer CE deploy workflow`

---

### T17: Update `docs/deploy-e-ci-cd.md` with production deploy guide and Mermaid diagram

**What**: Atualizar `docs/deploy-e-ci-cd.md` com o diagrama Mermaid do pipeline CI/CD (GitHub Actions → `./mvnw verify` → GHCR multi-arch → Portainer CE REST API), guia completo de configuração da Vercel (`Root Directory: frontend`, `BACKEND_URL`), Portainer CE Git Stack (escolha entre `docker-compose.prod.amd64.yml` para VPS 1 GB RAM e `docker-compose.prod.arm64.yml` para VPS ARM64 + tabela de variáveis obrigatórias/opcionais), exposição via Cloudflare Tunnel/DNS, segredos do GitHub Actions (`PORTAINER_*`), URI de redirect no Google Cloud Console e tabela de `LUMO_AUTH_COOKIE_SAME_SITE` (`LAX` vs `NONE`).
**Where**: `docs/deploy-e-ci-cd.md`
**Depends on**: T16
**Reuses**: `docs/deploy-e-ci-cd.md` e `../secret-santa/docs/deploy-e-ci-cd.md`
**Requirement**: DEPLOY-16

**Done when**:

- [x] `docs/deploy-e-ci-cd.md` inclui diagrama Mermaid `flowchart LR` do pipeline CI/CD do backend.
- [x] Todas as variáveis de `docker-compose.prod.amd64.yml`/`docker-compose.prod.arm64.yml`, segredos de `.github/workflows/deploy-backend.yml`, parâmetros da Vercel e configuração OAuth + Cloudflare + `SameSite` estão documentados.
- [x] Gate check passes: revisão de consistência entre `docs/deploy-e-ci-cd.md`, compose files, workflow e `application.properties`.

**Tests**: none
**Gate**: build
**Commit**: `docs(deploy): document Vercel, Portainer CE and CI/CD pipeline`

---

### T18: Sync `README.md` with production deploy summary and references

**What**: Atualizar `README.md` incluindo resumo de deploy em produção (Vercel + Portainer CE AMD64/ARM64 + PostgreSQL externo + CI/CD automático) com links para `docs/deploy-e-ci-cd.md`, `docker-compose.prod.amd64.yml`, `docker-compose.prod.arm64.yml` e `.github/workflows/deploy-backend.yml`.
**Where**: `README.md`
**Depends on**: T17
**Reuses**: `README.md` e `docs/deploy-e-ci-cd.md`
**Requirement**: DEPLOY-16

**Done when**:

- [x] `README.md` documenta a arquitetura de produção (Vercel + Portainer CE) e aponta para `docs/deploy-e-ci-cd.md`.
- [x] Gate check passes: `cd backend && ./mvnw verify && cd ../frontend && npm run lint && npm run build && npm test -- --watch=false`

**Tests**: none
**Gate**: build
**Commit**: `docs(readme): add Vercel and Portainer CE deploy overview`

---

## Checks

**C1** - `quarkus.http.cors.origins` reads `CORS_ALLOWED_ORIGINS` with `access-control-allow-credentials=true` and allows preflight from configured cross-origin frontend (DEPLOY-01, AC 1)
Proof: run backend-it | CrossOriginAuthIT

**C2** - Google OAuth callback with `LUMO_FRONTEND_URL` configured (including trailing slash) returns `302` with `Location` `<normalized-frontend><returnUrl>` (DEPLOY-02, AC 2)
Proof: run backend-it | CrossOriginAuthIT

**C3** - Google OAuth error redirect with `LUMO_FRONTEND_URL` configured returns `302` with `Location` `<normalized-frontend>/login?error=<errorCode>` (DEPLOY-03, AC 3)
Proof: run backend-it | CrossOriginAuthIT

**C4** - Google OAuth redirects remain relative (`/dashboard`, `/login?error=...`) when `LUMO_FRONTEND_URL` is blank/unset (DEPLOY-04, AC 4)
Proof: run backend-it | AuthResourceIT

**C5** - `AuthCookieHelper` resolves `LUMO_AUTH_COOKIE_SAME_SITE` (`LAX`, `NONE`, `STRICT`, case-insensitive) and applies it to `lumo_access`, `lumo_refresh`, and `lumo_oauth_state` (DEPLOY-05, AC 5)
Proof: run backend-unit | AuthCookieHelperTest

**C6** - `AuthStartupValidator` throws `IllegalStateException` for unsupported `SameSite` or `NONE` with `cookie-secure=false` (DEPLOY-06, AC 6)
Proof: run backend-unit | AuthStartupValidatorTest

**C7** - `AuthStartupValidator` throws `IllegalStateException` when `LUMO_FRONTEND_URL` is non-blank without `http://`/`https://` and valid host (DEPLOY-07, AC 7)
Proof: run backend-unit | AuthStartupValidatorTest

**C8** - `frontend/vercel.json` rewrites `/(.*)` to `/index.html` (DEPLOY-08, AC 1)
Proof: `node -e "const v=JSON.parse(require('fs').readFileSync('frontend/vercel.json','utf8')); if(!v.rewrites.some(r=>r.source==='/(.*)' && r.destination==='/index.html')) process.exit(1)"`

**C9** - `frontend/scripts/set-env.mjs` reads `BACKEND_URL` (fallback `API_URL`, then `""`), strips trailing slashes, writes `environment.ts`, and `npm run build` invokes it (DEPLOY-09, AC 2)
Proof: `cd frontend && BACKEND_URL="https://api.lumo.example.com///" node scripts/set-env.mjs && grep -q "https://api.lumo.example.com'" src/environments/environment.ts && node scripts/set-env.mjs && grep -q "apiUrl: ''" src/environments/environment.ts`

**C10** - `apiUrlInterceptor` rewrites `/api/*` requests with non-empty `API_BASE_URL` and `withCredentials: true`, and `authInterceptor` performs `401` refresh and single retry without duplicating prefix (DEPLOY-10, AC 3)
Proof: run frontend-unit | should prefix api requests with API_BASE_URL and preserve single retry on 401 refresh

**C11** - `AuthService.buildGoogleLoginUrl` prefixes `API_BASE_URL` when non-empty and stays relative when empty (DEPLOY-11, AC 4)
Proof: run frontend-unit | should prefix Google login URL with API_BASE_URL when configured

**C12** - `backend/Dockerfile` uses `FROM --platform=$BUILDPLATFORM`, installs `curl`, runs as non-root `appuser`, and starts via `exec java ${JAVA_OPTS_APPEND:-}` (DEPLOY-12, AC 1)
Proof: `grep -q 'FROM --platform=\$BUILDPLATFORM eclipse-temurin:25-jdk AS build' backend/Dockerfile && grep -q 'USER appuser' backend/Dockerfile && grep -q 'exec java \${JAVA_OPTS_APPEND:-}' backend/Dockerfile`

**C13** - `docker-compose.prod.amd64.yml` and `docker-compose.prod.arm64.yml` both validate cleanly with required env vars and define matching platforms (`linux/amd64` and `linux/arm64`) and healthcheck on `/q/health/ready` (DEPLOY-13, AC 2)
Proof: `DB_URL=jdbc:postgresql://host:5432/lumo DB_USERNAME=u DB_PASSWORD=p CORS_ALLOWED_ORIGINS=https://lumo.example.com LUMO_FRONTEND_URL=https://lumo.example.com LUMO_AUTH_JWT_SECRET=12345678901234567890123456789012 GOOGLE_OAUTH_CLIENT_ID=cid GOOGLE_OAUTH_CLIENT_SECRET=csec GOOGLE_OAUTH_REDIRECT_URI=https://api.lumo.example.com/api/v1/auth/google/callback sh -c 'docker compose -f docker-compose.prod.amd64.yml config | grep -q "platform: linux/amd64" && docker compose -f docker-compose.prod.arm64.yml config | grep -q "platform: linux/arm64"'`

**C14** - `.github/workflows/deploy-backend.yml` runs `./mvnw verify --batch-mode`, builds/pushes `linux/amd64,linux/arm64` to GHCR, fetches Portainer stack env and triggers `/git/redeploy` (DEPLOY-14, AC 3)
Proof: `python3 -c "import yaml; d=yaml.safe_load(open('.github/workflows/deploy-backend.yml')); txt=open('.github/workflows/deploy-backend.yml').read(); assert 'verify --batch-mode' in txt and 'linux/amd64,linux/arm64' in txt and '/api/stacks/\${PORTAINER_STACK_ID}/git/redeploy' in txt"`

**C15** - `.github/workflows/deploy-backend.yml` fails fast with `::error::` when any required `PORTAINER_*` variable is missing (DEPLOY-15, AC 4)
Proof: `grep -q '::error::Missing required Portainer' .github/workflows/deploy-backend.yml`

**C16** - `docs/deploy-e-ci-cd.md` and `README.md` include Mermaid CI/CD diagram and full setup documentation for Vercel, Portainer CE (`amd64` and `arm64`), Cloudflare, GitHub Secrets, Google OAuth, and `SameSite` (DEPLOY-16, AC 1)
Proof: `grep -q 'flowchart LR' docs/deploy-e-ci-cd.md && grep -q 'docker-compose.prod.amd64.yml' docs/deploy-e-ci-cd.md && grep -q 'docker-compose.prod.arm64.yml' docs/deploy-e-ci-cd.md && grep -q 'PORTAINER_API_KEY' docs/deploy-e-ci-cd.md && grep -q 'docs/deploy-e-ci-cd.md' README.md`

---

## Handoff

**Settled mid-build:** none
**Dispatched:** none
**Walked:** none

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3

Phase 1:  T1 → T2 → T3 → T4 → T5
Phase 2:  T6 → T7 → T8 → T9 → T10 → T11 → T12
Phase 3:  T13 → T14 → T15 → T16 → T17 → T18
```

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1 | 1 config file (`application.properties`) | ✅ Granular |
| T2 | 1 config mapping interface (`AuthConfig.java`) | ✅ Granular |
| T3 | 1 validator class + unit tests (`AuthStartupValidator.java`) | ✅ Granular |
| T4 | 1 cookie helper class + unit tests (`AuthCookieHelper.java`) | ✅ Granular |
| T5 | 1 REST resource + integration tests (`AuthResource.java`) | ✅ Granular |
| T6 | 1 Vercel config file (`frontend/vercel.json`) | ✅ Granular |
| T7 | 1 environment file (`frontend/src/environments/environment.ts`) | ✅ Granular |
| T8 | 1 build script (`frontend/scripts/set-env.mjs`) | ✅ Granular |
| T9 | 1 build script hook (`frontend/package.json`) | ✅ Granular |
| T10 | 1 HTTP interceptor + unit tests (`api-url.interceptor.ts`) | ✅ Granular |
| T11 | 1 app config wiring + retry unit test (`app.config.ts`) | ✅ Granular |
| T12 | 1 method update + unit test (`auth.service.ts`) | ✅ Granular |
| T13 | 1 Dockerfile (`backend/Dockerfile`) | ✅ Granular |
| T14 | 1 prod compose (`docker-compose.prod.amd64.yml`) | ✅ Granular |
| T15 | 1 prod compose (`docker-compose.prod.arm64.yml`) | ✅ Granular |
| T16 | 1 GitHub Actions workflow (`.github/workflows/deploy-backend.yml`) | ✅ Granular |
| T17 | 1 documentation file (`docs/deploy-e-ci-cd.md`) | ✅ Granular |
| T18 | 1 documentation file (`README.md`) | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | Phase 1 start | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | None | Phase 2 start | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |
| T11 | T10 | T10 → T11 | ✅ Match |
| T12 | T11 | T11 → T12 | ✅ Match |
| T13 | None | Phase 3 start | ✅ Match |
| T14 | T13 | T13 → T14 | ✅ Match |
| T15 | T14 | T14 → T15 | ✅ Match |
| T16 | T15 | T15 → T16 | ✅ Match |
| T17 | T16 | T16 → T17 | ✅ Match |
| T18 | T17 | T17 → T18 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Config (`application.properties`) | none | none | ✅ OK |
| T2 | Config (`AuthConfig.java`) | none | none | ✅ OK |
| T3 | Backend Auth Validator | unit | unit | ✅ OK |
| T4 | Backend Cookie Helper | unit | unit | ✅ OK |
| T5 | Backend REST / CORS / OAuth | integration | integration | ✅ OK |
| T6 | Config (`vercel.json`) | none | none | ✅ OK |
| T7 | Config (`environment.ts`) | none | none | ✅ OK |
| T8 | Build Script (`set-env.mjs`) | none | none | ✅ OK |
| T9 | Build Config (`package.json`) | none | none | ✅ OK |
| T10 | Frontend HTTP Interceptor | unit | unit | ✅ OK |
| T11 | Frontend App Config / Interceptor Chain | unit | unit | ✅ OK |
| T12 | Frontend AuthService | unit | unit | ✅ OK |
| T13 | Docker (`backend/Dockerfile`) | none | none | ✅ OK |
| T14 | Docker Compose (`amd64`) | none | none | ✅ OK |
| T15 | Docker Compose (`arm64`) | none | none | ✅ OK |
| T16 | CI/CD Workflow | none | none | ✅ OK |
| T17 | Docs (`docs/deploy-e-ci-cd.md`) | none | none | ✅ OK |
| T18 | Docs (`README.md`) | none | none | ✅ OK |
