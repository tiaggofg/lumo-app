# Lumo UI/UX Overhaul & Analytics Dashboard Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, the walk, check_proofs, the Verifier and the screens sub-agent).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/02-ui-ux-overhaul/design.md`
**Status**: Approved
**Approved**: 2026-11-26 - user: "sim, pode aprovar a spec"
**Build**: `cd frontend && npm run lint && npm run build`
**Run frontend-unit**: `cd frontend && npm test -- --watch=false`
**Run e2e**: `cd frontend && npx playwright test --reporter=list`

---

## Test Coverage Matrix

> Generated from project guidelines (`AGENTS.md`, `.agents/rules/post-implementation-testing.md`, `.agents/rules/feature-naming-and-quality.md`) and `.specs/features/02-ui-ux-overhaul/spec.md` - confirm before Execute.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Frontend Utilities & Services (`frontend/src/app/shared/**`, `core/**`) | unit | All branches; palette color resolution (legacy green replacement & deduplication); status badge classes & labels | `frontend/src/app/**/*.spec.ts` | `cd frontend && npm test -- --watch=false` |
| Frontend Feature Pages (`frontend/src/app/features/**`) | unit | Component rendering, competence month selection, status tooltip bindings, absence of charts in `/budgets/:id` | `frontend/src/app/**/*.spec.ts` | `cd frontend && npm test -- --watch=false` |
| Full-Stack UI Flows (`frontend/e2e/**`) | e2e | Desktop (`1440x900`) and mobile (`390x844`) critical flows: `/dashboard` landing & multi-color charts, full-width `<main>`, status tooltip in `/budgets/:id`, zero console errors | `frontend/e2e/**/*.spec.ts` | `cd frontend && npx playwright test --reporter=list` |
| Theme / Styles / Routing Config (`styles.css`, `app.config.ts`, `app.routes.ts`) | none | Build and lint gate only | `frontend/src/styles.css`, `frontend/src/app/app.config.ts`, `frontend/src/app/app.routes.ts` | build gate only |

## Gate Check Commands

> Generated from agreed stack (Angular v22 + Tailwind CSS v4 + PrimeNG v22 + Vitest + Playwright) - confirm before Execute.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | After frontend unit tasks | `cd frontend && npm test -- --watch=false` |
| Full | After E2E tasks | `cd frontend && npx playwright test --reporter=list` |
| Build | After phase completion or config/style/routing tasks | `cd frontend && npm run lint && npm run build` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Design System Foundation (Typography, Royal Indigo Theme & Full-Width Shell)

```
T1 → T2 → T3 → T4
```

### Phase 2: Dedicated Multi-Color Analytics Dashboard (`/dashboard`)

```
T4 → T5 → T6 → T7
```

### Phase 3: Pages Overhaul (Budgets, Status Tooltip, Recurrences, Catalog) & E2E Verification

```
T7 → T8 → T9 → T10
```

---

## Task Breakdown

### T1: Configure Plus Jakarta Sans & JetBrains Mono typography and enlarged global CSS scale

**What**: Load `Plus Jakarta Sans` and `JetBrains Mono` from Google Fonts in `frontend/src/index.html` and update `frontend/src/styles.css` with root font-family tokens, `16px` base sizing, `.tabular-nums` monospace numeric rules, and Royal Indigo/Sapphire Blue custom utility refinements.
**Where**: `frontend/src/styles.css`
**Depends on**: None
**Reuses**: `frontend/src/index.html`
**Requirement**: UI-01

**Done when**:
- [x] `frontend/src/index.html` links Google Fonts for `Plus Jakarta Sans` (`400;500;600;700;800`) and `JetBrains Mono` (`500;600;700`)
- [x] `frontend/src/styles.css` sets `Plus Jakarta Sans` as the primary UI typeface and `JetBrains Mono` for `.font-mono` / `.tabular-nums` with fallback stacks
- [x] Base typography scale is set to `16px` with improved line-height and contrast in both Light and Dark modes
- [x] Gate check passes: `cd frontend && npm run lint && npm run build`

**Tests**: none
**Gate**: build
**Commit**: `style(frontend): configure plus jakarta sans and jetbrains mono typography`

---

### T2: Configure PrimeNG Aura preset with Royal Indigo primary palette

**What**: Customize the PrimeNG Aura theme preset in `frontend/src/app/app.config.ts` using `definePreset(Aura, ...)` so the primary color scale maps to `{indigo.50}`..`{indigo.950}` instead of Aura's default emerald green.
**Where**: `frontend/src/app/app.config.ts`
**Depends on**: T1
**Reuses**: `@primeuix/themes/aura`
**Requirement**: UI-01

**Done when**:
- [x] `app.config.ts` defines a custom `LumoIndigoPreset` extending `Aura` with `indigo` as the semantic primary color palette
- [x] All PrimeNG primary buttons, focus rings, checkboxes, and selects render in Royal Indigo (`#4F46E5` / `#6366F1`) in Light and Dark modes
- [x] Gate check passes: `cd frontend && npm run lint && npm run build`

**Tests**: none
**Gate**: build
**Commit**: `feat(frontend): configure primeng aura royal indigo theme preset`

---

### T3: Redesign AppShellComponent with fluid full-width workspace and Dashboard navigation

**What**: Update `AppShellComponent` to remove `max-w-7xl` from `<main>` (using `w-full` fluid layout), add `Dashboard` (`/dashboard`) as the first navigation item, apply the Royal Indigo brand identity (zero `emerald-*`), and increase sidebar/header typography size with unit test coverage.
**Where**: `frontend/src/app/core/layout/app-shell.component.ts`
**Depends on**: T2
**Reuses**: `frontend/src/app/core/services/theme.service.ts`
**Requirement**: UI-01, UI-02, DASH-01

**Done when**:
- [x] `<main>` uses `flex-1 min-w-0 w-full p-5 sm:p-6 lg:px-10 lg:py-8` without `max-w-7xl`
- [x] `navItems` lists `Dashboard` (`/dashboard`), `Orçamentos` (`/budgets`), `Recorrências` (`/recurrences`), and `Cadastros` (`/catalog`)
- [x] Sidebar brand emblem, active link states, and mobile drawer use Royal Indigo (`indigo-600` / `indigo-50` / `dark:indigo-950/60`) with `15px–16px` nav links
- [x] Unit tests verify navigation items, full-width `<main>` classes, and zero `emerald-*` classes
- [x] Gate check passes: `cd frontend && npm test -- --watch=false`
- [x] Test count: >= 18 unit tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(frontend): redesign app shell with full width layout and indigo nav`

---

### T4: Update TransactionStatusBadgeComponent to Sapphire Blue, Indigo and Amber palette

**What**: Update `TransactionStatusBadgeComponent` and its unit tests so `SETTLED` (`Pago`/`Recebido`) uses Sapphire Blue (`sky-100 text-sky-800 dark:bg-sky-900/45 dark:text-sky-300`), `PENDING` uses Indigo/Slate, and `ESTIMATED` uses Amber, with larger `13px` (`text-[13px]`) badge typography.
**Where**: `frontend/src/app/shared/components/transaction-status-badge.component.ts`
**Depends on**: T3
**Reuses**: `frontend/src/app/shared/components/transaction-status-badge.component.spec.ts`
**Requirement**: UI-01

**Done when**:
- [x] `SETTLED` badge renders Sapphire Blue (`sky-*`) instead of `emerald-*` while preserving `"Pago"` (`EXPENSE`) and `"Recebido"` (`INCOME`) labels
- [x] Badge padding and font size are scaled up (`px-3 py-1 text-[13px] font-semibold`)
- [x] Unit tests in `transaction-status-badge.component.spec.ts` verify the new Sapphire Blue classes and labels
- [x] Gate check passes: `cd frontend && npm test -- --watch=false`
- [x] Test count: >= 18 unit tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `style(frontend): update status badge to sapphire blue and enlarged font`

---

### T5: Create non-green categorical chart palette and color resolver utility

**What**: Create `frontend/src/app/shared/utils/chart-palette.ts` exporting the 10-color non-green categorical palette (`LUMO_CHART_PALETTE`) and `resolveChartColors()` helper that replaces legacy green hex codes (`#10B981`, `#22C55E`) or duplicate colors with distinct palette colors, accompanied by unit tests.
**Where**: `frontend/src/app/shared/utils/chart-palette.ts`
**Depends on**: T4
**Reuses**: `frontend/src/app/core/models/api.models.ts`
**Requirement**: DASH-01

**Done when**:
- [x] `LUMO_CHART_PALETTE` defines 10 distinct high-contrast non-green hex colors (`#4F46E5`, `#0284C7`, `#E11D48`, `#D97706`, `#7C3AED`, `#0891B2`, `#DB2777`, `#EA580C`, `#2563EB`, `#9333EA`)
- [x] `resolveChartColors()` guarantees distinct colors across items even when input items have `null`, duplicate `#6366F1`, or legacy green (`#10B981`, `#22C55E`) colors
- [x] Unit tests in `chart-palette.spec.ts` verify color uniqueness and legacy green replacement
- [x] Gate check passes: `cd frontend && npm test -- --watch=false`
- [x] Test count: >= 21 unit tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(frontend): add non-green chart categorical palette resolver`

---

### T6: Create dedicated DashboardPageComponent with multi-color charts and monthly evolution

**What**: Create `DashboardPageComponent` in `frontend/src/app/features/dashboard/dashboard-page.component.ts` featuring a competence month selector, shortcut to `/budgets/:id`, executive KPI cards, and 4 multi-color Chart.js analytics panels (Despesas por Categoria with `%` breakdown list, Despesas por Beneficiário with distinct categorical colors, Status de Liquidação, and Evolução Mensal across budgets), plus unit tests.
**Where**: `frontend/src/app/features/dashboard/dashboard-page.component.ts`
**Depends on**: T5
**Reuses**: `frontend/src/app/features/budgets/budgets-store.service.ts`, `frontend/src/app/shared/utils/chart-palette.ts`
**Requirement**: DASH-01, DASH-02

**Done when**:
- [x] `DashboardPageComponent` renders a guided empty state with link to `/budgets` when no monthly budget exists
- [x] When budgets exist, selects the latest budget (or query param `budgetId`), displays executive KPIs (`text-3xl font-extrabold tabular-nums`), month selector, and `"Ver lançamentos do mês"` button
- [x] Renders 4 multi-color analytical panels: Despesas por Categoria (`chart-category` + ranked `%` list), Despesas por Beneficiário (`chart-beneficiary` with distinct colors per beneficiary), Status de Liquidação (`chart-status`), and Evolução Mensal (`chart-evolution` ordered `competenceMonth ASC`)
- [x] Unit tests in `dashboard-page.component.spec.ts` verify empty state, selected budget KPIs, and chronological evolution data sorting
- [x] Gate check passes: `cd frontend && npm test -- --watch=false`
- [x] Test count: >= 24 unit tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(frontend): create dedicated multi-color analytics dashboard page`

---

### T7: Register `/dashboard` as default route in `app.routes.ts`

**What**: Update `frontend/src/app/app.routes.ts` to register `/dashboard` loading `DashboardPageComponent` and redirect `''` and `'**'` to `'dashboard'`.
**Where**: `frontend/src/app/app.routes.ts`
**Depends on**: T6
**Reuses**: `frontend/src/app/features/dashboard/dashboard-page.component.ts`
**Requirement**: DASH-01

**Done when**:
- [x] Route `''` redirects to `'dashboard'` (`pathMatch: 'full'`)
- [x] Route `'dashboard'` lazy-loads `DashboardPageComponent`
- [x] Gate check passes: `cd frontend && npm run lint && npm run build`

**Tests**: none
**Gate**: build
**Commit**: `feat(frontend): set dashboard as default application route`

---

### T8: Clean up BudgetDetailPageComponent (`/budgets/:id`), remove charts and add Status tooltip

**What**: Remove `<app-budget-charts>` from `BudgetDetailPageComponent`, add a `"Ver Gráficos no Dashboard"` link button, replace the `"Status (1-clique)"` table header with `"Status"` + info icon and PrimeNG `pTooltip`, add contextual `pTooltip` to each row's status toggle button, apply the Royal Indigo & Sapphire Blue palette, and scale up table/card typography.
**Where**: `frontend/src/app/features/budgets/budget-detail-page.component.ts`
**Depends on**: T7
**Reuses**: `primeng/tooltip`, `frontend/src/app/shared/components/transaction-status-badge.component.ts`
**Requirement**: UI-01, UI-02, BUD-02

**Done when**:
- [x] `<app-budget-charts>` is removed from `BudgetDetailPageComponent` and a `"Ver Gráficos no Dashboard"` action navigates to `/dashboard`
- [x] Table column header displays `"Status"` with `pi-info-circle` and `pTooltip` explaining the 1-click toggle (`data-testid="status-column-header"`)
- [x] Each row's status button binds a contextual `pTooltip` (`"Clique para marcar como Pago/Recebido"` or `"Clique para reverter para Pendente"`)
- [x] Table cells use `15px–16px` (`text-[15px]` / `text-base`), KPI cards use `text-3xl`, and all `emerald-*` classes are replaced by `indigo-*` (controls) and `sky-*` (income/positive balance/progress)
- [x] Unit tests verify removal of charts and presence of status header tooltip in `BudgetDetailPageComponent`
- [x] Gate check passes: `cd frontend && npm test -- --watch=false`
- [x] Test count: >= 26 unit tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(frontend): remove charts from budget detail and add status tooltip`

---

### T9: Overhaul BudgetListPageComponent, RecurrencesPageComponent and CatalogPageComponent palette and typography

**What**: Update `BudgetListPageComponent` (and align `RecurrencesPageComponent`, `CatalogPageComponent`, and seed/default category color in `CatalogPageComponent`) to replace all `emerald-*` classes with Royal Indigo (`indigo-*`) for interactive elements and Sapphire Blue (`sky-*`) for positive/income financial metrics, use full-width responsive grids (`xl:grid-cols-3 2xl:grid-cols-4`), and enlarge font sizes.
**Where**: `frontend/src/app/features/budgets/budget-list-page.component.ts`
**Depends on**: T8
**Reuses**: `frontend/src/app/features/recurrences/recurrences-page.component.ts`, `frontend/src/app/features/catalog/catalog-page.component.ts`
**Requirement**: UI-01, UI-02

**Done when**:
- [x] Zero `emerald-*` classes remain across `frontend/src/app/`
- [x] `BudgetListPageComponent`, `RecurrencesPageComponent`, and `CatalogPageComponent` use enlarged typography (`text-3xl` page headers, `text-xl` card headers, `text-base` body/controls) and full-width responsive grids
- [x] Gate check passes: `cd frontend && npm test -- --watch=false && npm run lint && npm run build`
- [x] Test count: >= 26 unit tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `style(frontend): apply royal indigo and sapphire palette across all pages`

---

### T10: Update Playwright E2E suite for `/dashboard`, multi-color charts, full-width layout and Status tooltip

**What**: Update `frontend/e2e/lumo-mvp.spec.ts` to verify `/dashboard` as the default landing page, competence month selection and multi-color charts on `/dashboard`, absence of charts on `/budgets/:id`, `"Status"` column header with tooltip (`data-testid="status-column-header"`), full-width fluid `<main>` container, and zero console errors on desktop (`1440x900`) and mobile (`390x844`).
**Where**: `frontend/e2e/lumo-mvp.spec.ts`
**Depends on**: T9
**Reuses**: `frontend/playwright.config.ts`
**Requirement**: UI-01, UI-02, DASH-01, DASH-02, BUD-02

**Done when**:
- [x] E2E suite verifies `/` redirects to `/dashboard` and renders multi-color Category, Beneficiary, Status, and Evolution charts
- [x] E2E suite verifies `/budgets/:id` has no embedded charts and renders the `"Status"` header with tooltip and 1-click toggle
- [x] Desktop (`1440x900`) and mobile (`390x844`) tests pass with zero console/page errors
- [x] Gate check passes: `cd frontend && npx playwright test --reporter=list`
- [x] Test count: >= 10 E2E scenarios pass

**Tests**: e2e
**Gate**: full
**Commit**: `test(e2e): verify analytics dashboard full width layout and status tooltip`

---

## Checks

**C1** - PrimeNG Aura preset uses `indigo` primary palette and zero `emerald-*` classes exist in frontend templates (UI-01, AC 1)
Proof: run frontend-unit | AppShellComponent

**C2** - Positive financial values and `SETTLED` badges use Sapphire Blue (`sky-*`), expenses use Coral (`rose-*`), and `ESTIMATED` uses Amber (`amber-*`) (UI-01, AC 2)
Proof: run frontend-unit | TransactionStatusBadgeComponent

**C3** - `Plus Jakarta Sans` and `JetBrains Mono` are loaded and base table/body typography is scaled up (UI-01, AC 3)
Proof: run e2e | dashboard and typography scale

**C4** - `AppShellComponent` `<main>` container uses fluid full width (`w-full` without `max-w-7xl`) across all pages (UI-02, AC 4)
Proof: run frontend-unit | AppShellComponent

**C5** - Dark Mode (`.dark`) renders layered dark surfaces and persists across reloads (UI-01, AC 5)
Proof: run e2e | dark mode persistence

**C6** - `/dashboard` is the default route (`'' -> '/dashboard'`) and first navigation item in the sidebar (DASH-01, AC 1)
Proof: run e2e | dashboard default route and navigation

**C7** - `/dashboard` selects the latest budget by default, allows switching competence month, and links to `/budgets/:id` (DASH-01, AC 2)
Proof: run frontend-unit | DashboardPageComponent

**C8** - `/dashboard` displays executive KPI cards for the selected monthly budget (DASH-01, AC 3)
Proof: run frontend-unit | DashboardPageComponent

**C9** - `/dashboard` renders multi-color **Despesas por Categoria** doughnut chart and ranked `%` list using the 10-color non-green palette (DASH-01, AC 4)
Proof: run frontend-unit | chart-palette

**C10** - `/dashboard` renders multi-color **Despesas por Beneficiário** horizontal bar chart with distinct palette colors (DASH-01, AC 5)
Proof: run e2e | dashboard multi-color charts

**C11** - `/dashboard` renders **Status de Liquidação** chart across Liquidado, Pendente, and Estimado (DASH-02, AC 6)
Proof: run e2e | dashboard multi-color charts

**C12** - `/dashboard` renders **Evolução Mensal** chart ordered chronologically (`competenceMonth ASC`) (DASH-02, AC 7)
Proof: run frontend-unit | DashboardPageComponent

**C13** - `/dashboard` displays a guided empty state when no `MonthlyBudget` exists (DASH-01, AC 8)
Proof: run frontend-unit | DashboardPageComponent

**C14** - `/budgets/:id` removes embedded `<app-budget-charts>` and offers a shortcut to `/dashboard` (BUD-02, AC 1)
Proof: run frontend-unit | BudgetDetailPageComponent

**C15** - `/budgets/:id` renders `"Status"` column header with info icon and `pTooltip` instead of `"Status (1-clique)"` (BUD-02, AC 2)
Proof: run frontend-unit | BudgetDetailPageComponent

**C16** - `/budgets/:id` renders contextual `pTooltip` on each transaction status badge button and toggles status in 1 click (BUD-02, AC 3)
Proof: run e2e | budget detail settle and confirm estimate

---

## Handoff

The feature's live state, written as it happens - a compaction gives no warning.

**Settled mid-build:** none
**Dispatched:** batch-1 (Phases 1-2: T1..T7) returned; batch-2 (Phase 3: T8..T10) returned; Verifier at HEAD
**Walked:** P1 Royal Indigo & Sapphire Blue palette, Plus Jakarta Sans & JetBrains Mono typography, full-width `<main>` (`w-full`, no `max-w-7xl`), and Dark Mode persistence verified on `http://localhost:4200` at `1440x900` and `390x844`; P1 `/dashboard` default route verified with competence month selector, executive KPIs, 4 multi-color charts (Categorias, Beneficiários, Status de Liquidação, Evolução Mensal) and shortcut to `/budgets/:id`; P1 `/budgets/:id` verified without embedded charts, with `"Status"` header tooltip (`[data-testid="status-column-header"]`), row status tooltips, and 1-click toggle with 0 console errors.

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3

Phase 1:  T1 ------→ T2 ------→ T3 ------→ T4
Phase 2:  T5 ------→ T6 ------→ T7
Phase 3:  T8 ------→ T9 ------→ T10
```

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: Configure typography and global CSS scale | 1 stylesheet + font links | ✅ Granular |
| T2: Configure PrimeNG Aura Royal Indigo preset | 1 config file (`app.config.ts`) | ✅ Granular |
| T3: Redesign `AppShellComponent` full-width & nav | 1 component + spec | ✅ Granular |
| T4: Update `TransactionStatusBadgeComponent` palette | 1 component + spec | ✅ Granular |
| T5: Create non-green chart palette resolver | 1 utility + spec | ✅ Granular |
| T6: Create `DashboardPageComponent` | 1 component + spec | ✅ Granular |
| T7: Register `/dashboard` default route | 1 routes file (`app.routes.ts`) | ✅ Granular |
| T8: Clean up `BudgetDetailPageComponent` & status tooltip | 1 component + spec | ✅ Granular |
| T9: Overhaul remaining pages palette & typography | Cohesive palette sweep | ✅ Granular |
| T10: Update Playwright E2E suite | 1 E2E spec file | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | Phase 1 start | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1: Configure typography and global CSS scale | Theme / Styles / Routing Config | none | none | ✅ OK |
| T2: Configure PrimeNG Aura Royal Indigo preset | Theme / Styles / Routing Config | none | none | ✅ OK |
| T3: Redesign `AppShellComponent` | Frontend Utilities & Services (`core/**`) | unit | unit | ✅ OK |
| T4: Update `TransactionStatusBadgeComponent` | Frontend Utilities & Services (`shared/**`) | unit | unit | ✅ OK |
| T5: Create non-green chart palette resolver | Frontend Utilities & Services (`shared/**`) | unit | unit | ✅ OK |
| T6: Create `DashboardPageComponent` | Frontend Feature Pages (`features/**`) | unit | unit | ✅ OK |
| T7: Register `/dashboard` default route | Theme / Styles / Routing Config | none | none | ✅ OK |
| T8: Clean up `BudgetDetailPageComponent` & status tooltip | Frontend Feature Pages (`features/**`) | unit | unit | ✅ OK |
| T9: Overhaul remaining pages palette & typography | Frontend Feature Pages (`features/**`) | unit | unit | ✅ OK |
| T10: Update Playwright E2E suite | Full-Stack UI Flows (`frontend/e2e/**`) | e2e | e2e | ✅ OK |
