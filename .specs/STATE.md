# STATE

## Decisions

### AD-001
- **Decision**: Adotar o nome de produto **Lumo** em monorepo (`backend/`, `frontend/`, `docker-compose.yml`) com package Java base `io.github.tiaggofg.lumo`.
- **Reason**: Alinhar nomenclatura do produto, código-fonte, schema e documentação ao repositório `lumo-app`.
- **Trade-off**: Centraliza backend e frontend no mesmo histórico Git, exigindo disciplina de escopo em commits e CI por diretório.
- **Scope**: Projeto inteiro.
- **Date**: 2026-11-26
- **Status**: active

### AD-002
- **Decision**: Construir o backend em **Java 25 + Quarkus 3.33 LTS (`3.33.4.2`) + Maven + PostgreSQL + Liquibase (SQL formatado)**.
- **Reason**: Reduzir consumo de RAM/CPU em ambientes enxutos (~100–160 MB RSS em JVM mode, pronto para Native Image no futuro), com suporte LTS a Java 25, live reload (`quarkus:dev`) e Dev Services.
- **Trade-off**: Menos convenções prontas que Spring Boot para `ProblemDetail` e `@Transactional(readOnly = true)`, compensadas por um `ExceptionMapper` RFC 9457 próprio e interceptor CDI leve.
- **Scope**: `backend/`.
- **Date**: 2026-11-26
- **Status**: active

### AD-003
- **Decision**: Aplicar Clean Architecture + DDD estrito no backend: `domain` 100% Java puro (sem Quarkus/CDI/JPA) com estereótipos próprios (`AggregateRoot`, `Entity<T>`, `ValueObject`); `application` com `@Command` (`@Stereotype` + `@ApplicationScoped` + `@Transactional`) e `@Query` (`@Stereotype` + `@ApplicationScoped` + interceptor read-only); fronteiras verificadas por ArchUnit.
- **Reason**: Isolar regras financeiras críticas de detalhes de framework e garantir evolução segura nas Fases 2+ (importadores, projeções, ML/LLM).
- **Trade-off**: Maior número de classes de mapeamento entre domínio e entidades JPA em troca de testabilidade pura e isolamento duradouro.
- **Scope**: `backend/`.
- **Date**: 2026-11-26
- **Status**: active

### AD-004
- **Decision**: `MonthlyBudget` e `Transaction` são Aggregate Roots independentes; `MonthlyBudget` não persiste `totalIncome`, `totalExpense` nem `balance`. Os totais (Previsto e Realizado) são calculados dinamicamente via Read Model/Query agregada.
- **Reason**: Preservar o limite transacional de um agregado por transação e eliminar risco de dessincronização entre lançamentos e totais do mês.
- **Trade-off**: Consultas de listagem e detalhe de orçamentos executam agregação SQL (`SUM` condicional por tipo e status), facilmente atendida com índice composto em `(monthly_budget_id, type, status)`.
- **Scope**: Domínio financeiro (`MonthlyBudget`, `Transaction`).
- **Date**: 2026-11-26
- **Status**: active

### AD-005
- **Decision**: Usar enum neutro `TransactionStatus` (`ESTIMATED`, `PENDING`, `SETTLED`) para despesas e receitas, expondo dois pares de métricas no orçamento: **Previsto** (`ESTIMATED + PENDING + SETTLED`) e **Realizado** (`SETTLED`).
- **Reason**: Evitar enum duplicado para receitas/despesas no domínio mantendo linguagem natural na UI (`Pago` para `EXPENSE`, `Recebido` para `INCOME`) e dando visibilidade imediata do caixa realizado vs. planejado.
- **Trade-off**: A camada de apresentação traduz o rótulo de `SETTLED` conforme `TransactionType`.
- **Scope**: Domínio financeiro e Frontend.
- **Date**: 2026-11-26
- **Status**: active

### AD-006
- **Decision**: Modelar `RecurringTransaction` com três modos (`INDEFINITE`, `FIXED_TERM`, `INSTALLMENT`), `amountType` (`FIXED` ou `ESTIMATED`), `dueDay` opcional (1..31 com clamp para fim do mês), materialização automática na criação de `MonthlyBudget` e nos budgets elegíveis atuais/futuros na criação de `RecurringTransaction`, supressão de ocorrências excluídas manualmente por mês, propagação opt-in na edição (nunca tocando `SETTLED`) e remoção opt-in de futuras abertas na desativação.
- **Reason**: Cobrir todos os casos reais da planilha do usuário (contas fixas, variáveis como água/luz, prazos "Até Novembro" e parcelamentos já em andamento) sem duplicações nem mutação silenciosa do histórico pago.
- **Trade-off**: Exige tabela auxiliar `recurring_occurrence_exclusions` para impedir recriação após exclusão pontual em um mês.
- **Scope**: Motor de recorrências.
- **Date**: 2026-11-26
- **Status**: active

### AD-007
- **Decision**: Expor API REST sob `/api/v1`, com identificadores `UUID` gerados no domínio, erros no formato RFC 9457 (`application/problem+json`), documentação OpenAPI/Swagger, e sem autenticação na Fase 1.
- **Reason**: Priorizar entrega rápida do núcleo financeiro pessoal/familiar mantendo contratos padronizados e prontos para adicionar Auth/Household na Fase 2.
- **Trade-off**: Deploy público na Fase 1 exige proteção de rede externa (VPN/reverse proxy autenticado) até a Fase 2.
- **Scope**: API REST e Segurança.
- **Date**: 2026-11-26
- **Status**: active

### AD-008
- **Decision**: Construir o frontend em **Angular v22 (Standalone + Signals) + Tailwind CSS + PrimeNG v22**, estado via Signals/Services, layout desktop-first responsivo com cards adaptados no mobile e tema Light padrão com toggle Dark Mode.
- **Reason**: Produtividade em tabelas financeiras, diálogos e filtros com PrimeNG, estilização ágil com Tailwind e reatividade simples com Signals sem boilerplate de store global.
- **Trade-off**: Verificar termos de licença de componentes específicos do PrimeNG v22 durante setup, restringindo uso a componentes gratuitos/MIT ou Tailwind/CDK se algum componente exigir licença comercial.
- **Scope**: `frontend/`.
- **Date**: 2026-11-26
- **Status**: active

## Handoff

- **Feature**: `01-lumo-mvp`
- **Phase / Task**: Implemented & Verified (T1..T32 concluídas) — aguardando aprovação explícita do usuário antes de commit/push
- **Completed**: Backend Java 25 + Quarkus 3.33.4.2 (83 testes unitários/ArchUnit + 17 testes de integração Testcontainers PostgreSQL), Frontend Angular v22 + Tailwind CSS v4 + PrimeNG v22 + Chart.js (lint OK, build OK, 17 testes unitários Vitest), E2E Playwright (10/10 cenários desktop + mobile sem erros de console) e sincronização de `README.md` + `docs/`
- **In-progress** (file:line): none
- **Next step**: Aguardar aprovação do usuário para realizar `git add`, `git commit` (Angular Conventional Commits) e `git push`
- **Blockers**: none (SonarQube Quality Gate `OK` para `lumo-backend` e `lumo-frontend`, lint OK)
- **Uncommitted files**: `backend/`, `frontend/`, `docker-compose.yml`, `README.md`, `AGENTS.md`, `docs/`, `sonar-project.properties`, `.gitignore`, `.specs/`
- **Branch**: main
