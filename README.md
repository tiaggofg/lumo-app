# Lumo — Controle Financeiro Pessoal e Familiar

Aplicação web full-stack para controle financeiro mensal pessoal e familiar, substituindo planilhas manuais por orçamentos mensais independentes (`MonthlyBudget`), lançamentos manuais (`Transaction`), motor de recorrências (`RecurringTransaction` nos modos `INDEFINITE`, `FIXED_TERM` e `INSTALLMENT`) e catálogo gerenciável de categorias e beneficiários (`Category`, `Beneficiary`).

## Stack Tecnológica

- **Backend**: Java 25 + Quarkus 3.33 LTS (`3.33.4.2`) + Maven (`./mvnw`), Clean Architecture + DDD, Hibernate ORM, Liquibase (SQL formatado), autenticação **Google OAuth 2.0 + PKCE** com cookies `HttpOnly` (`lumo_access` JWT 15m + `lumo_refresh` rotativo 30d), SmallRye OpenAPI & Health, RFC 9457 (`application/problem+json`).
- **Frontend**: Angular v22 (Standalone Components + Signals), Tailwind CSS v4, suíte própria de componentes **ZardUI (estilo shadcn/ui para Angular — 100% MIT)** em `shared/ui/` (incluindo `<z-select>` com popover `fixed` viewport-aware e busca sem acentos, além de scrollbars finas globais adaptadas a Light/Dark Mode e sidebar escura), Chart.js com containers `<z-chart-container>` (shadcn Charts), identidade de marca vetorial **"Prisma de Luz & Camadas"** (`<app-lumo-logo>`), Dark Sidebar fixa (`100dvh`) com modo recolhível (`w-20`), tipografia **Plus Jakarta Sans** + **JetBrains Mono** (`tabular-nums`), layout fluido full-width (`w-full`) e **Dashboard Analítico Multicolorido (`/dashboard`)** como rota padrão.
- **Banco de Dados**: PostgreSQL 17 (`docker-compose.yml`).
- **Testes**: JUnit 5, AssertJ, ArchUnit, Mockito, RestAssured + Testcontainers (backend); Vitest (frontend unit); Playwright (E2E desktop e mobile).

## Como Executar Localmente

### Opção 1 — Stack completa via Docker Compose (PostgreSQL + Backend + Frontend)
```bash
docker compose up -d --build
# Acesse: http://localhost:4200 (ou defina LUMO_FRONTEND_PORT=4201 se a 4200 estiver ocupada)
# API / Swagger UI: http://localhost:8080/q/swagger-ui
```

### Opção 2 — Modo desenvolvimento (live reload)
```bash
# 1. Subir apenas o PostgreSQL 17
docker compose up -d postgres

# 2. Executar o backend (porta 8080, Swagger UI em /q/swagger-ui)
cd backend && ./mvnw quarkus:dev

# 3. Executar o frontend (porta 4200, proxy /api -> localhost:8080)
cd frontend && npm install && npm start
```

## Comandos de Testes e Qualidade

```bash
# Backend: unitários + ArchUnit + integração (Testcontainers PostgreSQL)
cd backend && ./mvnw verify

# Frontend: lint, build, unitários (Vitest) e E2E (Playwright)
cd frontend && npm run lint
cd frontend && npm run build
cd frontend && npm test -- --watch=false
cd frontend && npx playwright test --reporter=list
```

## Deploy em Produção (Vercel + Portainer CE)

O Lumo está preparado para deploy contínuo em produção com arquitetura desacoplada:

- **Frontend (Vercel)**: integração Git nativa apontando `Root Directory` para `frontend/`, roteamento SPA via [frontend/vercel.json](frontend/vercel.json) e injeção da variável `BACKEND_URL` no build via [frontend/scripts/set-env.mjs](frontend/scripts/set-env.mjs).
- **Backend (Portainer CE + PostgreSQL externo)**: imagem multi-arch (`linux/amd64,linux/arm64`) endurecida com usuário não-root (`appuser`) em [backend/Dockerfile](backend/Dockerfile) e dois arquivos Compose prontos para Git Stack:
  - [docker-compose.prod.amd64.yml](docker-compose.prod.amd64.yml) — otimizado para VPS `amd64` enxutas (ex.: 1 GB RAM, com `-Xms64m -Xmx220m`).
  - [docker-compose.prod.arm64.yml](docker-compose.prod.arm64.yml) — para VPS `arm64`.
- **CI/CD Automático**: [.github/workflows/deploy-backend.yml](.github/workflows/deploy-backend.yml) executa `./mvnw verify --batch-mode`, publica a imagem multi-arch no GHCR (`ghcr.io/tiaggofg/lumo-backend`) e dispara o redeploy automático da stack via API REST do Portainer CE.

Consulte o guia completo passo a passo (variáveis de ambiente, Cloudflare Tunnel, Google OAuth, `SameSite` e segredos do GitHub Actions) em [docs/deploy-e-ci-cd.md](docs/deploy-e-ci-cd.md).

## Documentação Técnica

Consulte o índice completo em [docs/README.md](docs/README.md).
