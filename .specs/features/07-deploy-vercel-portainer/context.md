# Deploy Vercel & Portainer CE Context

**Gathered:** 2026-11-28
**Spec:** `.specs/features/07-deploy-vercel-portainer/spec.md`
**Status:** Ready for tasks & execution

---

## Feature Boundary

Preparar o monorepo `lumo-app` para deploy contínuo em produção com o frontend Angular na **Vercel** e o backend Quarkus em um **Portainer CE** (em VPS Oracle Cloud Linux **AMD64** ou **ARM64**) alimentado por imagem multi-arch no **GHCR**, banco **PostgreSQL externo** e callback automático na REST API do Portainer (mesmo padrão do `secret-santa`), suportando chamadas diretas cross-origin com cookies `HttpOnly` e redirecionamento Google OAuth 2.0.

---

## Implementation Decisions

### Comunicação Frontend (Vercel) ↔ Backend (Portainer)

- Usuário escolheu: `"Chamada direta cross-origin com BACKEND_URL no build (igual ao secret-santa — adiciona CORS_ALLOWED_ORIGINS, LUMO_FRONTEND_URL para redirect OAuth, SameSite configurável e withCredentials em todas as chamadas; ideal se usar subdomínios do mesmo domínio)"`.
- O domínio do usuário é gerenciado na **Cloudflare** (com túnel `cloudflared` já ativo na VPS Oracle), permitindo usar subdomínios do mesmo domínio raiz (ex.: `lumo.seudominio.com` na Vercel e `api.lumo.seudominio.com` no Portainer) com `LUMO_AUTH_COOKIE_SAME_SITE=LAX` (ou `NONE` caso use domínios distintos como `.vercel.app`).
- O frontend gera `src/environments/environment.ts` no build via `scripts/set-env.mjs` lendo `BACKEND_URL` (fallback `API_URL`, default `""`), adiciona prefixo `environment.apiUrl` nas requisições `/api/*` via HTTP interceptor mantendo `withCredentials: true`, e prefixa a URL de login Google em `AuthService.buildGoogleLoginUrl`.
- O backend torna `quarkus.http.cors.origins` configurável via `CORS_ALLOWED_ORIGINS`, adiciona `LUMO_FRONTEND_URL` para montar `Location` absoluto nos redirects `302` do Google OAuth (mantendo relativo quando vazio), e torna `SameSite` dos cookies de sessão/OAuth configurável via `LUMO_AUTH_COOKIE_SAME_SITE` (`LAX` padrão, `NONE` ou `STRICT`).

### Banco de Dados e Arquiteturas em Produção (`docker-compose.prod.amd64.yml` e `docker-compose.prod.arm64.yml`)

- Usuário escolheu PostgreSQL externo: `"(Recommended) PostgreSQL externo (ex.: Neon, Supabase ou Postgres já no host/Portainer) — docker-compose.prod.yml sobe apenas o serviço backend com DB_URL/DB_USERNAME/DB_PASSWORD e host.docker.internal mapeado, igual ao secret-santa"`.
- Usuário solicitou dois arquivos Compose: `"Mas deixe dois docker compose um com arm outro amd"`.
- Usuário confirmou subida na Oracle Cloud com Portainer (`E2.1.Micro` 1 GB RAM agora, com `docker-compose.prod.arm64.yml` pronto para quando provisionar a `A1.Flex`), em container único: `"sim, está aprovado"`.
- Arquivos de produção:
  - `docker-compose.prod.amd64.yml` (`platform: linux/amd64`, com default enxuto de heap JVM `JAVA_OPTS_APPEND=-Dquarkus.http.host=0.0.0.0 -Xms64m -Xmx220m` para VMs de 1 GB RAM como `E2.1.Micro`).
  - `docker-compose.prod.arm64.yml` (`platform: linux/arm64`, para VMs ARM como `VM.Standard.A1.Flex`).
- Ambos consomem a mesma imagem multi-arch `ghcr.io/tiaggofg/lumo-backend:latest` (`linux/amd64` + `linux/arm64`) e sobem apenas 1 container do serviço `backend` com `extra_hosts: ["host.docker.internal:host-gateway"]`.

### Pipeline CI/CD e Callback Portainer CE

- Usuário escolheu: `"(Recommended) Suíte completa (./mvnw verify — unitários, ArchUnit e integração com Testcontainers PostgreSQL) antes de publicar a imagem no GHCR e acionar o Portainer"`.
- O workflow `.github/workflows/deploy-backend.yml` segue o padrão do `secret-santa`, estendido para **multi-arch**: executa `./mvnw verify --batch-mode`, configura QEMU + Docker Buildx, compila e publica `backend/Dockerfile` (`FROM --platform=$BUILDPLATFORM` no estágio build para compilar Maven na CPU nativa do runner) para `platforms: linux/amd64,linux/arm64` no GHCR (`:latest` e `:${{ github.sha }}`), busca a configuração atual da stack via `GET /api/stacks/{id}` para preservar `Env`, e dispara `PUT /api/stacks/{id}/git/redeploy?endpointId={endpointId}` com `pullImage: true` e `prune: true`.
- Paths monitorados pelo workflow: `backend/**`, `docker-compose.prod.*.yml` e `.github/workflows/deploy-backend.yml`.

### Agent's Discretion

- Validação fail-fast em `AuthStartupValidator` para `LUMO_AUTH_COOKIE_SAME_SITE` inválido (`NONE` sem `cookieSecure=true` ou valor fora de `LAX|NONE|STRICT`) e `LUMO_FRONTEND_URL` malformado (sem esquema `http://` ou `https://` + host válido).
- Hardening do `backend/Dockerfile` no estágio runtime com usuário não-root `appuser`, `curl` instalado para healthcheck e `ENTRYPOINT ["sh", "-c", "exec java ${JAVA_OPTS_APPEND:-} -jar /work/quarkus-run.jar"]` para respeitar `JAVA_OPTS_APPEND` mantendo `java` como PID 1.

### Declined / Undiscussed Gray Areas → Assumptions

- Nenhuma área recusada; todas as decisões de arquitetura de deploy, comunicação, banco e CI/CD foram confirmadas pelo usuário.

---

## Specific References

- `../secret-santa/.github/workflows/deploy-backend.yml` — modelo de pipeline GHCR + callback REST API do Portainer CE.
- `../secret-santa/docker-compose.prod.yml` — estrutura enxuta de produção com imagem GHCR, `extra_hosts`, healthcheck e variáveis obrigatórias com `:?`.
- `../secret-santa/backend/Dockerfile` — estágio runtime com `curl` e usuário não-root `appuser`.
- `../secret-santa/frontend/vercel.json` e `../secret-santa/frontend/scripts/set-env.mjs` — configuração SPA na Vercel e injeção de `BACKEND_URL` no build.

---

## Deferred Ideas

- Deploy alternativo em Google Cloud Run Always Free (avaliado e preterido pelo usuário em favor da VPS Oracle + Portainer + `cloudflared` já operacionais).
- Proxy reverso same-origin na Vercel (`/api/*` via Vercel Functions ou Edge Rewrites).
