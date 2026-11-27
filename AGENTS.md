# AGENTS.md — Lumo

Este documento define o contexto arquitetural, convenções de código, comandos essenciais e regras de verificação para agentes de IA trabalhando neste repositório.

> As regras gerais de fluxo Spec-Driven, verificação pós-implementação, aprovação e sincronização de documentação vivem em `.agents/rules/` e são gerenciadas via `agent-spec-kit` (`.agents/update-spec-kit.sh`).

---

## 1. Visão Geral do Projeto

O **Lumo** é uma aplicação web full-stack de controle financeiro pessoal e familiar que substitui planilhas mensais manuais por orçamentos mensais independentes (`MonthlyBudget`), lançamentos manuais (`Transaction`), motor de recorrências (`RecurringTransaction` nos modos `INDEFINITE`, `FIXED_TERM` e `INSTALLMENT`) e catálogo de categorias e beneficiários (`Category`, `Beneficiary`).

---

## 2. Stack Tecnológica e Estrutura do Repositório

```text
lumo-app/
├── backend/                # Java 25 + Quarkus 3.33 LTS + Maven (Clean Architecture + DDD)
├── frontend/               # Angular v22 (Standalone + Signals) + Tailwind CSS v4 + ZardUI (100% MIT) + Chart.js
├── docker-compose.yml      # PostgreSQL 17 local (lumo_db)
├── docs/                   # Documentação técnica e ADRs
├── .specs/                 # Spec-Driven Development (STATE.md e features/)
└── .agents/                # Regras e skills do harness
```

- **Backend**: Java 25 + Quarkus `3.33.4.2` (LTS) + Maven (`./mvnw`), Hibernate ORM, Liquibase (SQL formatado), SmallRye OpenAPI, SmallRye Health.
- **Frontend**: Angular v22 (Standalone Components + Signals), Tailwind CSS v4, componentes **ZardUI (estilo shadcn/ui para Angular — 100% MIT, zero PrimeNG)** em `frontend/src/app/shared/ui/`, Chart.js (`<z-chart-container>`).
- **Persistência**: PostgreSQL 17 (`lumo_db`).
- **Testes**: JUnit 5, AssertJ, ArchUnit, Mockito, RestAssured + Testcontainers (backend); Vitest/Karma (frontend unit); Playwright (E2E desktop e mobile).

---

## 3. Diretrizes de Arquitetura e Invariantes Críticas

- **Isolamento de Domínio (`AD-003`)**: `io.github.tiaggofg.lumo.domain..` deve ser 100% Java puro (zero imports de Quarkus, Jakarta, Hibernate ou Jackson), verificado por `CleanArchitectureArchTest`.
- **Agregados Independentes (`AD-004`)**: `MonthlyBudget` e `Transaction` são Aggregate Roots independentes; `MonthlyBudget` nunca persiste totais (`plannedIncome`, `realizedIncome`, `plannedExpense`, `realizedExpense`, `plannedBalance`, `realizedBalance`), que são calculados dinamicamente via Read Model.
- **Status Neutro (`AD-005`)**: `TransactionStatus` (`ESTIMATED`, `PENDING`, `SETTLED`) é único para receitas e despesas; a UI traduz `SETTLED` como `Pago` (`EXPENSE`) ou `Recebido` (`INCOME`).
- **Motor de Recorrências (`AD-006`)**: Materialização idempotente (índice único parcial), supressão via `recurring_occurrence_exclusions`, propagação opt-in que nunca altera `SETTLED` nem meses passados, e remoção opt-in apenas de lançamentos futuros em aberto.
- **Contrato HTTP (`AD-007`)**: API sob `/api/v1` com erros padronizados em RFC 9457 (`application/problem+json`).

---

## 4. Comandos de Desenvolvimento e Testes

```bash
# Subir PostgreSQL local
docker compose up -d

# Backend: testes unitários + ArchUnit
cd backend && ./mvnw test

# Backend: testes de integração (Testcontainers PostgreSQL)
cd backend && ./mvnw verify -DskipUTs

# Backend: build + todos os testes
cd backend && ./mvnw verify

# Backend: modo dev
cd backend && ./mvnw quarkus:dev

# Frontend: lint, build, unit tests e E2E Playwright
cd frontend && npm run lint
cd frontend && npm run build
cd frontend && npm test -- --watch=false
cd frontend && npx playwright test --reporter=list
```

---

## 5. Regras do Harness (Spec-Driven & Pós-Ciclo)

As regras detalhadas estão em `.agents/rules/` (sempre ativas):
- **Planejamento vs Implementação**: `.agents/rules/spec-handoff-only.md`
- **Verificação Pós-Implementação**: `.agents/rules/post-implementation-testing.md`
- **Documentação e Aprovação antes de Commit/Push**: `.agents/rules/post-cycle-approval-and-docs.md`
- **Nomeação de Features e Qualidade**: `.agents/rules/feature-naming-and-quality.md`
- **Execução de Tasks Aprovadas**: `.agents/skills/implement-spec-tasks/SKILL.md`
