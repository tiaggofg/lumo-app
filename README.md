# Lumo — Controle Financeiro Pessoal e Familiar

Aplicação web full-stack para controle financeiro mensal pessoal e familiar, substituindo planilhas manuais por orçamentos mensais independentes (`MonthlyBudget`), lançamentos manuais (`Transaction`), motor de recorrências (`RecurringTransaction` nos modos `INDEFINITE`, `FIXED_TERM` e `INSTALLMENT`) e catálogo gerenciável de categorias e beneficiários (`Category`, `Beneficiary`).

## Stack Tecnológica

- **Backend**: Java 25 + Quarkus 3.33 LTS (`3.33.4.2`) + Maven (`./mvnw`), Clean Architecture + DDD, Hibernate ORM, Liquibase (SQL formatado), SmallRye OpenAPI & Health, RFC 9457 (`application/problem+json`).
- **Frontend**: Angular v22 (Standalone Components + Signals), Tailwind CSS v4, PrimeNG v22 (componentes MIT/gratuitos), Chart.js.
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

## Documentação Técnica

Consulte o índice completo em [docs/README.md](docs/README.md).
