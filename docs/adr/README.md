# Architecture Decision Records (ADRs) — Lumo

As decisões arquiteturais ativas do projeto são mantidas em sincronia com [`.specs/STATE.md`](../../.specs/STATE.md):

| ID | Decisão | Status |
| :--- | :--- | :--- |
| `AD-001` | Produto **Lumo** em monorepo (`backend/`, `frontend/`, `docker-compose.yml`), package `io.github.tiaggofg.lumo` | Active |
| `AD-002` | Backend em Java 25 + Quarkus 3.33 LTS (`3.33.4.2`) + Maven + PostgreSQL 17 + Liquibase (SQL formatado) | Active |
| `AD-003` | Clean Architecture + DDD estrito (`domain` 100% Java puro, estereótipos `@Command`/`@Query`, ArchUnit) | Active |
| `AD-004` | `MonthlyBudget` e `Transaction` como Aggregate Roots independentes; totais calculados via Read Model SQL | Active |
| `AD-005` | Status neutro `TransactionStatus` (`ESTIMATED`, `PENDING`, `SETTLED`) com métricas Previsto vs. Realizado | Active |
| `AD-006` | Motor de `RecurringTransaction` (`INDEFINITE`, `FIXED_TERM`, `INSTALLMENT`), materialização idempotente e supressão | Active |
| `AD-007` | API REST `/api/v1`, UUIDs de domínio, erros RFC 9457 (`application/problem+json`), sem auth na Fase 1 | Active |
| `AD-008` | Frontend Angular v22 (Standalone + Signals) + Tailwind CSS v4 + PrimeNG v22 (MIT) + Chart.js + Light/Dark Mode | Superseded by `AD-010` |
| `AD-009` | Identidade visual **Royal Indigo (`#4F46E5`) & Azul Safira (`#0284C7`)** (zero verde), tipografia ampliada (**Plus Jakarta Sans** + **JetBrains Mono**), layout fluido full-width (`w-full`) e página dedicada de **Dashboard (`/dashboard`)** como rota padrão com gráficos multicoloridos | Active |
| `AD-010` | Migração completa de PrimeNG para suíte própria **ZardUI (estilo shadcn/ui para Angular — 100% MIT)** em `frontend/src/app/shared/ui/`, gráficos no padrão ZardUI / shadcn Charts (`<z-chart-container>`), **Dark Sidebar (`slate-900`)** no Light Mode com canvas `slate-100`, sidebar desktop fixa (`h-dvh sticky top-0`) com modo recolhido (`w-20`) persistido em `localStorage`, e identidade de marca vetorial **Lumo ("Prisma de Luz & Camadas")** (`<app-lumo-logo>`, `favicon.svg`, `site.webmanifest`) | Active |
