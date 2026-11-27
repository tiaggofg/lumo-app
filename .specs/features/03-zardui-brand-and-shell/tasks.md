# ZardUI Migration, Visual Depth, Collapsible Shell & Brand Identity Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, the walk, check_proofs, the Verifier and the screens sub-agent).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/03-zardui-brand-and-shell/design.md`
**Status**: Approved
**Approved**: 2026-11-26 - user: "sim está aprovado"
**Build**: `cd frontend && npm run lint && npm run build`
**Run frontend-unit**: `cd frontend && npm test -- --watch=false`
**Run e2e**: `cd frontend && npx playwright test --reporter=list`

---

## Test Coverage Matrix

> Generated from codebase, project guidelines (`AGENTS.md`, `.agents/rules/post-implementation-testing.md`, `.agents/rules/feature-naming-and-quality.md`), and `.specs/features/03-zardui-brand-and-shell/spec.md` - confirm before Execute.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| ZardUI Primitives, Services & Brand Logo (`frontend/src/app/shared/ui/**`) | unit | All branches; `ControlValueAccessor` bindings (`z-select`, `z-input-number`, `z-checkbox`), modal/confirm/toast lifecycles, tooltip attribute & popover, `<app-lumo-logo>` variants (`full`/`mark`), `<z-chart-container>` legend toggle | `frontend/src/app/shared/ui/**/*.spec.ts` | `cd frontend && npm test -- --watch=false` |
| App Shell & Core Interceptors (`frontend/src/app/core/**`) | unit | Fixed `h-dvh sticky top-0` sidebar classes, Dark Sidebar surface (`bg-slate-900`), sidebar collapse toggle (`w-68` ↔ `w-20`) & `localStorage` persistence (`lumo-sidebar-collapsed`), `problemDetailInterceptor` → `ZToastService` | `frontend/src/app/core/**/*.spec.ts` | `cd frontend && npm test -- --watch=false` |
| Feature Pages (`frontend/src/app/features/**`) | unit | Zero PrimeNG dependencies, ZardUI controls integration, `<z-chart-container>` rendering & doughnut center summaries in `/dashboard`, surface depth classes | `frontend/src/app/features/**/*.spec.ts` | `cd frontend && npm test -- --watch=false` |
| Full-Stack UI Flows (`frontend/e2e/**`) | e2e | Desktop (`1440x900`) and mobile (`390x844`) critical flows: zero `"Invalid PrimeUI License"` banner, collapsible fixed sidebar (`100dvh`), Dark Sidebar + `slate-100` canvas in Light Mode, `<app-lumo-logo>` SVG & `favicon.svg`, ZardUI dialogs/selects/charts, zero console errors | `frontend/e2e/**/*.spec.ts` | `cd frontend && npx playwright test --reporter=list` |
| Static Assets, Styles & Package Config (`frontend/public/**`, `frontend/src/index.html`, `frontend/src/styles.css`, `frontend/package.json`) | none | Build and lint gate only | `frontend/public/**`, `frontend/src/styles.css`, `frontend/package.json` | build gate only |

## Gate Check Commands

> Generated from codebase (`AGENTS.md`, `frontend/package.json`) - confirm before Execute.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | After frontend unit tasks | `cd frontend && npm test -- --watch=false` |
| Full | After E2E tasks | `cd frontend && npx playwright test --reporter=list` |
| Build | After phase completion or static asset / style / package config tasks | `cd frontend && npm run lint && npm run build` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Brand Identity ("Prisma de Luz & Camadas"), Surface Tokens & ZardUI Core Primitives

```
T1 → T2 → T3 → T4 → T5
```

### Phase 2: ZardUI Form Controls, Overlays (`z-dialog`, `z-confirm-dialog`, `z-toast`) & Chart Container

```
T5 → T6 → T7 → T8
```

### Phase 3: Collapsible Fixed-Height Shell, Feature Pages Migration to ZardUI & PrimeNG Removal

```
T8 → T9 → T10 → T11 → T12
```

---

## Task Breakdown

### T1: Create Lumo SVG brand assets (`favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, `site.webmanifest`) and update surface tokens in `index.html` and `styles.css`

**What**: Create the **"Prisma de Luz & Camadas"** vector brand assets in `frontend/public/` (`favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, `site.webmanifest`), link them in `frontend/src/index.html` with `<meta name="theme-color" content="#4F46E5">`, and configure the Light/Dark surface depth tokens (`bg-slate-100` Light Mode canvas, `bg-slate-950` Dark Mode canvas, ZardUI CSS custom properties) in `frontend/src/styles.css`.
**Where**: `frontend/src/styles.css`
**Depends on**: None
**Reuses**: `frontend/src/index.html`, `frontend/public/favicon.ico`
**Requirement**: BRAND-01, SHELL-01

**Done when**:
- [x] `frontend/public/favicon.svg`, `frontend/public/favicon.ico`, `frontend/public/apple-touch-icon.png`, and `frontend/public/site.webmanifest` exist with the Lumo Prism emblem (`#4F46E5` → `#0284C7`) and `theme_color: "#4F46E5"`
- [x] `frontend/src/index.html` references `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, `site.webmanifest`, `<meta name="theme-color" content="#4F46E5">`, and sets `body` background to `bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100`
- [x] `frontend/src/styles.css` defines ZardUI surface tokens (`--z-bg-canvas`, `--z-bg-sidebar`, `--z-bg-card`, `--z-border`, `--z-ring`) for Light and Dark modes
- [x] Gate check passes: `cd frontend && npm run lint && npm run build`

**Tests**: none
**Gate**: build
**Commit**: `feat(brand): add lumo prism svg favicon webmanifest and surface tokens`

---

### T2: Create `<app-lumo-logo>` SVG component ("Prisma de Luz & Camadas") with `full` and `mark` variants

**What**: Create `LumoLogoComponent` (`<app-lumo-logo>`) in `frontend/src/app/shared/ui/logo/lumo-logo.component.ts` rendering the custom **"Prisma de Luz & Camadas"** SVG emblem and geometric `"Lumo"` wordmark with `variant` (`'full' | 'mark'`), `size` (`'sm' | 'md' | 'lg'`), and `subtitle` inputs, accompanied by unit tests.
**Where**: `frontend/src/app/shared/ui/logo/lumo-logo.component.ts`
**Depends on**: T1
**Reuses**: `frontend/src/styles.css`
**Requirement**: BRAND-01

**Done when**:
- [x] `<app-lumo-logo variant="full" />` renders the faceted prism SVG emblem (`#4F46E5` → `#0284C7` gradient with ascending light beam) alongside the `"Lumo"` wordmark and optional subtitle
- [x] `<app-lumo-logo variant="mark" />` renders only the compact centered SVG emblem without wordmark text for the collapsed sidebar rail
- [x] Unit tests in `lumo-logo.component.spec.ts` verify `full` and `mark` variants, SVG gradient rendering, and subtitle display
- [x] Gate check passes: `cd frontend && npm test -- --watch=false`
- [x] Test count: >= 32 unit tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(ui): create lumo prism svg logo component with full and mark variants`

---

### T3: Create ZardUI `ZButtonComponent`, `ZBadgeComponent`, and `ZTooltipDirective`

**What**: Create `ZButtonComponent` (`z-button`), `ZBadgeComponent` (`z-badge`), and `ZTooltipDirective` (`[zTooltip]`) in `frontend/src/app/shared/ui/`, update `TransactionStatusBadgeComponent` to use ZardUI badge styling, and add unit tests covering variants, loading state, and tooltip `data-tooltip` / popover behavior.
**Where**: `frontend/src/app/shared/ui/button/z-button.component.ts`
**Depends on**: T2
**Reuses**: `frontend/src/app/shared/components/transaction-status-badge.component.ts`
**Requirement**: ZARD-02

**Done when**:
- [x] `ZButtonComponent` (`z-button`) supports `label`, `icon`, `variant` (`default`, `secondary`, `outline`, `ghost`, `destructive`, `warn`, `success`), `size`, `loading`, `disabled`, and click emission
- [x] `ZBadgeComponent` (`z-badge`) supports semantic financial variants (`default`, `sky`, `rose`, `amber`, `slate`)
- [x] `ZTooltipDirective` (`[zTooltip]`) sets `attr.data-tooltip` on the host element and shows/hides a floating ZardUI tooltip popover on hover and focus
- [x] Unit tests verify `ZButtonComponent`, `ZBadgeComponent`, and `ZTooltipDirective`
- [x] Gate check passes: `cd frontend && npm test -- --watch=false`
- [x] Test count: >= 38 unit tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(ui): add zardui button badge and tooltip primitives`

---

### T4: Create ZardUI `ZToastService` and `ZToastViewportComponent` and migrate `problemDetailInterceptor`

**What**: Create `ZToastService` and `ZToastViewportComponent` (`<z-toast-viewport />`) in `frontend/src/app/shared/ui/toast/` and update `problemDetailInterceptor` (`frontend/src/app/core/interceptors/problem-detail.interceptor.ts`) and its spec to dispatch RFC 9457 error notifications through `ZToastService` instead of PrimeNG's `MessageService`.
**Where**: `frontend/src/app/shared/ui/toast/z-toast.service.ts`
**Depends on**: T3
**Reuses**: `frontend/src/app/core/interceptors/problem-detail.interceptor.ts`
**Requirement**: ZARD-03

**Done when**:
- [x] `ZToastService` exposes `.add({ severity, summary, detail, life })` and `.dismiss(id)` backed by a reactive signal list of active toasts
- [x] `<z-toast-viewport />` renders floating ZardUI toast cards in the top-right viewport with semantic colors (`success`, `info`, `warn`, `error`) and dismiss button
- [x] `problemDetailInterceptor` and `problem-detail.interceptor.spec.ts` use `ZToastService` with zero imports from `primeng/api`
- [x] Unit tests verify `ZToastService`, `ZToastViewportComponent`, and `problemDetailInterceptor`
- [x] Gate check passes: `cd frontend && npm test -- --watch=false`
- [x] Test count: >= 42 unit tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(ui): add zardui toast service viewport and migrate problem interceptor`

---

### T5: Create ZardUI `ZDialogComponent`, `ZConfirmService`, and `ZConfirmDialogComponent`

**What**: Create `ZDialogComponent` (`<z-dialog>`) in `frontend/src/app/shared/ui/dialog/z-dialog.component.ts` and `ZConfirmService` + `ZConfirmDialogComponent` (`<z-confirm-dialog />`) in `frontend/src/app/shared/ui/alert-dialog/` with backdrop blur, `Escape` dismissal, footer actions, and unit tests.
**Where**: `frontend/src/app/shared/ui/dialog/z-dialog.component.ts`
**Depends on**: T4
**Reuses**: `frontend/src/app/shared/ui/button/z-button.component.ts`
**Requirement**: ZARD-02, ZARD-03

**Done when**:
- [x] `<z-dialog>` renders a modal overlay when `visible()` is true, supports `header`, close button, `Escape` key dismissal, body projection, and footer template/projection
- [x] `ZConfirmService.confirm(...)` opens `<z-confirm-dialog />`, executing `accept()` on confirmation or closing on cancel
- [x] Unit tests verify `<z-dialog>` open/close/Escape and `ZConfirmService` + `<z-confirm-dialog />` accept/reject flows
- [x] Gate check passes: `cd frontend && npm test -- --watch=false`
- [x] Test count: >= 47 unit tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(ui): add zardui dialog and alert confirm dialog components`

---

### T6: Create ZardUI form controls (`ZInputDirective`, `ZTextareaDirective`, `ZInputNumberComponent`, `ZCheckboxComponent`)

**What**: Create `ZInputDirective` (`[zInput]`), `ZTextareaDirective` (`[zTextarea]`), `ZInputNumberComponent` (`z-input-number` with `ControlValueAccessor`, `inputId` propagation, and `BRL` currency / integer support), and `ZCheckboxComponent` (`z-checkbox` with `ControlValueAccessor` and `inputId` propagation) under `frontend/src/app/shared/ui/`, with unit tests.
**Where**: `frontend/src/app/shared/ui/input-number/z-input-number.component.ts`
**Depends on**: T5
**Reuses**: `frontend/src/styles.css`
**Requirement**: ZARD-02

**Done when**:
- [x] `input[zInput]` and `textarea[zTextarea]` apply ZardUI surface, border, and indigo focus-ring styles
- [x] `ZInputNumberComponent` (`z-input-number`) implements `ControlValueAccessor`, binds `[id]="inputId()"` on the inner `<input>`, supports `mode="currency"` (`R$` prefix, `pt-BR` comma/decimal parsing like `'195,64'` and `'800'`) and integer limits (`min`, `max`)
- [x] `ZCheckboxComponent` (`z-checkbox`) implements `ControlValueAccessor` and toggles boolean state cleanly
- [x] Unit tests verify `ZInputNumberComponent` (including comma decimal input and `min`/`max`) and `ZCheckboxComponent`
- [x] Gate check passes: `cd frontend && npm test -- --watch=false`
- [x] Test count: >= 53 unit tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(ui): add zardui input input-number textarea and checkbox controls`

---

### T7: Create ZardUI `ZSelectComponent` (`z-select`) with `ControlValueAccessor` and barrel export `shared/ui/index.ts`

**What**: Create `ZSelectComponent` (`z-select`) in `frontend/src/app/shared/ui/select/z-select.component.ts` supporting `ngModel`, `options`, `optionLabel`, `optionValue`, `placeholder`, `showClear`, `inputId`, keyboard `Escape`, and outside-click dismissal, and export the entire ZardUI suite from `frontend/src/app/shared/ui/index.ts` with unit tests.
**Where**: `frontend/src/app/shared/ui/select/z-select.component.ts`
**Depends on**: T6
**Reuses**: `frontend/src/app/shared/ui/button/z-button.component.ts`
**Requirement**: ZARD-02

**Done when**:
- [x] `ZSelectComponent` implements `ControlValueAccessor`, renders trigger button with selected option label or `placeholder`, optional clear button (`showClear`), and dropdown listbox (`role="listbox"`)
- [x] Selecting an option emits the new value through `ngModelChange`, closes the dropdown, and supports `Escape` / outside-click dismissal
- [x] `frontend/src/app/shared/ui/index.ts` re-exports all ZardUI components, directives, and services
- [x] Unit tests verify `ZSelectComponent` selection, clear button, and keyboard/outside dismissal
- [x] Gate check passes: `cd frontend && npm test -- --watch=false`
- [x] Test count: >= 58 unit tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(ui): add zardui select component and barrel exports`

---

### T8: Create `ZChartContainerComponent` (`<z-chart-container>`) for ZardUI / shadcn Charts

**What**: Create `ZChartContainerComponent` (`<z-chart-container>`) in `frontend/src/app/shared/ui/chart/z-chart-container.component.ts` providing a shadcn/ZardUI chart card with title, description, `<z-badge>` counter, interactive clickable legend pills (`legendItems`, `legendToggle`), and chart canvas slot, plus remove unused `BudgetChartsComponent` (`budget-charts.component.ts` and `.spec.ts`).
**Where**: `frontend/src/app/shared/ui/chart/z-chart-container.component.ts`
**Depends on**: T7
**Reuses**: `frontend/src/app/shared/ui/badge/z-badge.component.ts`
**Requirement**: CHART-01

**Done when**:
- [x] `<z-chart-container>` renders elevated card surface (`bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm`), header, badge counter, and clickable legend pills that emit `legendToggle`
- [x] Unused `frontend/src/app/features/budgets/budget-charts.component.ts` and `budget-charts.component.spec.ts` are removed
- [x] Unit tests in `z-chart-container.component.spec.ts` verify header, badge, and interactive legend pill toggling
- [x] Gate check passes: `cd frontend && npm test -- --watch=false`
- [x] Test count: >= 60 unit tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(ui): add zardui chart container component and remove legacy budget charts`

---

### T9: Redesign `AppShellComponent` with Dark Sidebar, fixed viewport height (`h-dvh sticky top-0`), collapsible icon-only rail (`w-20`), `<app-lumo-logo>`, and ZardUI overlays

**What**: Update `AppShellComponent` (`frontend/src/app/core/layout/app-shell.component.ts`) to replace `<p-toast>` and `<p-confirmdialog>` with `<z-toast-viewport />` and `<z-confirm-dialog />`, apply the Dark Sidebar (`bg-slate-900 text-slate-100`) and `bg-slate-100 dark:bg-slate-950` canvas, enforce fixed viewport height (`h-dvh sticky top-0 overflow-y-auto`), integrate `<app-lumo-logo>` (`full` when expanded, `mark` when collapsed), and implement the collapsible sidebar rail (`w-68` ↔ `w-20`) persisted in `localStorage` (`lumo-sidebar-collapsed`) with `[zTooltip]` on nav icons.
**Where**: `frontend/src/app/core/layout/app-shell.component.ts`
**Depends on**: T8
**Reuses**: `frontend/src/app/shared/ui/index.ts`, `frontend/src/app/core/services/theme.service.ts`
**Requirement**: SHELL-01, SHELL-02, BRAND-01, ZARD-03

**Done when**:
- [x] `AppShellComponent` has zero PrimeNG imports and renders `<z-toast-viewport />` and `<z-confirm-dialog />`
- [x] Desktop `<aside>` uses `h-dvh sticky top-0 overflow-y-auto shrink-0 bg-slate-900 text-slate-100 border-r border-slate-800` and toggles width between `lg:w-68` (expanded default) and `lg:w-20` (collapsed rail) via `data-testid="sidebar-collapse-toggle"`
- [x] Collapsed state is persisted in `localStorage` under `lumo-sidebar-collapsed`, displays `<app-lumo-logo variant="mark" />`, hides link text labels, and attaches `[zTooltip]` with each item's label
- [x] Page container uses `bg-slate-100 dark:bg-slate-950` for visual depth against white cards
- [x] Unit tests in `app-shell.component.spec.ts` verify fixed `h-dvh sticky top-0` classes, Dark Sidebar classes, `<app-lumo-logo>`, collapse toggle, and `localStorage` persistence
- [x] Gate check passes: `cd frontend && npm test -- --watch=false`
- [x] Test count: >= 64 unit tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(shell): add fixed-height collapsible dark sidebar with lumo svg logo`

---

### T10: Upgrade `DashboardPageComponent` to ZardUI (`z-select`, `<z-chart-container>`, shadcn chart tooltips, interactive legends, and doughnut center metrics)

**What**: Migrate `DashboardPageComponent` (`frontend/src/app/features/dashboard/dashboard-page.component.ts`) from PrimeNG to ZardUI (`z-select`, `z-badge`, `<z-chart-container>`), enhance the 4 Chart.js panels with shadcn-styled tooltips, interactive legend toggling, rounded arcs/bars (`cutout: '72%'`, `borderRadius: 6`), centered doughnut summary overlays (Total Planned Expense in Categories, Settlement `%` in Status), and elevated card surfaces (`shadow-sm border-slate-200/90`).
**Where**: `frontend/src/app/features/dashboard/dashboard-page.component.ts`
**Depends on**: T9
**Reuses**: `frontend/src/app/shared/ui/index.ts`, `frontend/src/app/shared/utils/chart-palette.ts`
**Requirement**: CHART-01, ZARD-02, SHELL-01

**Done when**:
- [x] `DashboardPageComponent` has zero PrimeNG imports and uses `<z-select>` for the competence month selector and `<z-chart-container>` for all 4 analytical panels
- [x] **Despesas por Categoria** and **Status de Liquidação** render a centered metric overlay inside the doughnut ring and interactive breakdown/legend items
- [x] All 4 charts configure shadcn-styled tooltips and interactive legend toggling
- [x] Unit tests in `dashboard-page.component.spec.ts` verify `<z-chart-container>` rendering, doughnut center metrics, and legend toggle state
- [x] Gate check passes: `cd frontend && npm test -- --watch=false`
- [x] Test count: >= 66 unit tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(dashboard): upgrade analytics charts to zardui shadcn chart containers`

---

### T11: Migrate Budgets, Recurrences, and Catalog pages/dialogs to ZardUI and remove `primeng` & `@primeuix/themes` from the project

**What**: Migrate `BudgetListPageComponent`, `BudgetDetailPageComponent`, `TransactionFormDrawerComponent`, `ConfirmEstimateDialogComponent`, `RecurrencesPageComponent`, and `CatalogPageComponent` from PrimeNG to ZardUI (`z-button`, `z-dialog`, `z-select`, `[zInput]`, `z-input-number`, `z-checkbox`, `[zTextarea]`, `[zTooltip]`, `ZToastService`, `ZConfirmService`), apply `bg-slate-100/80` table/filter surface depth, and remove `primeng` and `@primeuix/themes` from `frontend/package.json` and `frontend/src/app/app.config.ts`.
**Where**: `frontend/src/app/features/budgets/budget-detail-page.component.ts`
**Depends on**: T10
**Reuses**: `frontend/src/app/shared/ui/index.ts`
**Requirement**: ZARD-01, ZARD-02, ZARD-03, SHELL-01

**Done when**:
- [x] All 6 components (`BudgetListPageComponent`, `BudgetDetailPageComponent`, `TransactionFormDrawerComponent`, `ConfirmEstimateDialogComponent`, `RecurrencesPageComponent`, `CatalogPageComponent`) and their `.spec.ts` files use ZardUI primitives and services with zero imports from `primeng/*` or `@primeuix/*`
- [x] `app.config.ts` and `package.json` no longer contain `primeng` or `@primeuix/themes`
- [x] Cards use elevated surface tokens (`bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm`) and table headers use `bg-slate-100/80 dark:bg-slate-800/60`
- [x] Gate check passes: `cd frontend && npm test -- --watch=false && npm run lint && npm run build`
- [x] Test count: >= 66 unit tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(frontend): migrate all pages to zardui and remove primeng dependency`

---

### T12: Update Playwright E2E suite to verify zero PrimeNG license banner, collapsible fixed-height sidebar, Lumo SVG brand, surface contrast, and ZardUI flows

**What**: Update `frontend/e2e/lumo-mvp.spec.ts` to assert zero `"Invalid PrimeUI License"` text anywhere in the DOM, verify the Dark Sidebar (`#0F172A`) and `slate-100` (`#F1F5F9`) canvas in Light Mode, test fixed-height sidebar (`h-dvh sticky top-0`) and collapse/expand persistence (`sidebar-collapse-toggle` → `w-20` rail with tooltips), verify `<app-lumo-logo>` SVG and `/favicon.svg`, and run all full-stack E2E flows across desktop (`1440x900`) and mobile (`390x844`).
**Where**: `frontend/e2e/lumo-mvp.spec.ts`
**Depends on**: T11
**Reuses**: `frontend/playwright.config.ts`
**Requirement**: ZARD-01, ZARD-02, ZARD-03, CHART-01, SHELL-01, SHELL-02, BRAND-01

**Done when**:
- [x] E2E suite asserts `expect(await page.locator('body').innerText()).not.toContain('Invalid PrimeUI License')`
- [x] E2E suite verifies desktop sidebar fixed viewport height (`100dvh`), collapse toggle to `80px` (`w-20`), persistence across reload, and `<app-lumo-logo>` SVG rendering
- [x] E2E suite verifies ZardUI dialogs, selects, currency input-number, confirm dialogs, toasts, and `<z-chart-container>` charts on desktop and mobile with zero console/page errors
- [x] Gate check passes: `cd frontend && npx playwright test --reporter=list`
- [x] Test count: >= 12 E2E scenarios pass

**Tests**: e2e
**Gate**: full
**Commit**: `test(e2e): verify zardui components collapsible sidebar and lumo svg brand`

---

## Checks

**C1** - `primeng` and `@primeuix/themes` are removed and the application renders zero `"Invalid PrimeUI License"` banners or console errors (ZARD-01, AC 1)
Proof: run e2e | dashboard default route and navigation

**C2** - ZardUI primitives (`z-button`, `z-badge`, `[zTooltip]`) render variants and synchronize `data-tooltip` with popover tooltips (ZARD-02, AC 2, AC 8)
Proof: run frontend-unit | z-button

**C3** - `ZSelectComponent` (`z-select`) binds `ngModel`, opens/closes the listbox, selects options, and clears values (ZARD-02, AC 3)
Proof: run frontend-unit | ZSelectComponent

**C4** - `ZInputNumberComponent` (`z-input-number`) formats and parses `BRL` currency (`pt-BR`) and numeric bounds via `ControlValueAccessor` (ZARD-02, AC 4)
Proof: run frontend-unit | ZInputNumberComponent

**C5** - `ZDialogComponent` (`z-dialog`) and `ZConfirmService` (`<z-confirm-dialog />`) handle modal open/close, `Escape` dismissal, and destructive confirmation callbacks (ZARD-02, AC 5, ZARD-03, AC 6)
Proof: run frontend-unit | ZDialogComponent

**C6** - `ZToastService` and `<z-toast-viewport />` render semantic notifications and display RFC 9457 HTTP errors from `problemDetailInterceptor` (ZARD-03, AC 7)
Proof: run frontend-unit | problemDetailInterceptor

**C7** - `<z-chart-container>` wraps the 4 `/dashboard` charts with interactive clickable legend pills, shadcn tooltips, and centered doughnut summary metrics (CHART-01, AC 1, AC 2, AC 3, AC 4)
Proof: run frontend-unit | DashboardPageComponent

**C8** - Light Mode renders `bg-slate-100` page canvas, `bg-slate-900` Dark Sidebar, elevated white cards (`bg-white shadow-sm`), and `bg-slate-100/80` table headers, while Dark Mode renders `bg-slate-950` canvas and `bg-slate-900` cards (SHELL-01, AC 1, AC 2)
Proof: run frontend-unit | AppShellComponent

**C9** - Desktop sidebar uses fixed viewport height (`h-dvh sticky top-0`), toggles between expanded (`w-68`) and collapsed icon-only rail (`w-20`) with `[zTooltip]`, and persists `lumo-sidebar-collapsed` in `localStorage` (SHELL-02, AC 3, AC 4, AC 5)
Proof: run frontend-unit | AppShellComponent

**C10** - `<app-lumo-logo>` renders the custom **"Prisma de Luz & Camadas"** SVG emblem in `full` and `mark` variants, and `favicon.svg` + `site.webmanifest` are configured (BRAND-01, AC 1, AC 2, AC 3, AC 4)
Proof: run frontend-unit | LumoLogoComponent

---

## Handoff

The feature's live state, written as it happens - a compaction gives no warning.

**Settled mid-build:** none
**Dispatched:** none
**Walked:** none

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3

Phase 1:  T1 ------→ T2 ------→ T3 ------→ T4 ------→ T5
Phase 2:  T6 ------→ T7 ------→ T8
Phase 3:  T9 ------→ T10 -----→ T11 -----→ T12
```

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: Brand static assets (`favicon.svg`, manifest) & surface CSS tokens | Static assets + `styles.css` | ✅ Granular |
| T2: Create `<app-lumo-logo>` SVG component (`full` & `mark`) | 1 component + spec | ✅ Granular |
| T3: Create ZardUI `z-button`, `z-badge`, `[zTooltip]` | Cohesive display primitives + spec | ✅ Granular |
| T4: Create `ZToastService`, `<z-toast-viewport>` & migrate interceptor | 1 toast subsystem + interceptor spec | ✅ Granular |
| T5: Create `<z-dialog>`, `ZConfirmService` & `<z-confirm-dialog>` | 1 dialog/confirm subsystem + spec | ✅ Granular |
| T6: Create `[zInput]`, `[zTextarea]`, `z-input-number`, `z-checkbox` | Cohesive form inputs + spec | ✅ Granular |
| T7: Create `z-select` & `shared/ui/index.ts` barrel | 1 select component + spec + barrel | ✅ Granular |
| T8: Create `<z-chart-container>` & remove unused `BudgetChartsComponent` | 1 chart container component + spec | ✅ Granular |
| T9: Redesign `AppShellComponent` (Dark Sidebar, `h-dvh`, collapsible rail, logo) | 1 shell component + spec | ✅ Granular |
| T10: Upgrade `DashboardPageComponent` to `<z-chart-container>` & ZardUI | 1 feature page + spec | ✅ Granular |
| T11: Migrate Budgets, Recurrences & Catalog pages to ZardUI & remove PrimeNG | Cohesive PrimeNG removal cutover | ✅ Granular |
| T12: Update Playwright E2E suite for ZardUI, collapsible sidebar & brand | 1 E2E spec file | ✅ Granular |

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
| T11 | T10 | T10 → T11 | ✅ Match |
| T12 | T11 | T11 → T12 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1: Brand static assets & surface CSS tokens | Static Assets, Styles & Package Config | none | none | ✅ OK |
| T2: Create `<app-lumo-logo>` SVG component | ZardUI Primitives, Services & Brand Logo (`shared/ui/**`) | unit | unit | ✅ OK |
| T3: Create ZardUI `z-button`, `z-badge`, `[zTooltip]` | ZardUI Primitives, Services & Brand Logo (`shared/ui/**`) | unit | unit | ✅ OK |
| T4: Create `ZToastService`, `<z-toast-viewport>` & migrate interceptor | ZardUI Primitives & Core Interceptors | unit | unit | ✅ OK |
| T5: Create `<z-dialog>`, `ZConfirmService` & `<z-confirm-dialog>` | ZardUI Primitives, Services & Brand Logo (`shared/ui/**`) | unit | unit | ✅ OK |
| T6: Create `[zInput]`, `[zTextarea]`, `z-input-number`, `z-checkbox` | ZardUI Primitives, Services & Brand Logo (`shared/ui/**`) | unit | unit | ✅ OK |
| T7: Create `z-select` & `shared/ui/index.ts` barrel | ZardUI Primitives, Services & Brand Logo (`shared/ui/**`) | unit | unit | ✅ OK |
| T8: Create `<z-chart-container>` & remove `BudgetChartsComponent` | ZardUI Primitives, Services & Brand Logo (`shared/ui/**`) | unit | unit | ✅ OK |
| T9: Redesign `AppShellComponent` | App Shell & Core Interceptors (`core/**`) | unit | unit | ✅ OK |
| T10: Upgrade `DashboardPageComponent` | Feature Pages (`features/**`) | unit | unit | ✅ OK |
| T11: Migrate Budgets, Recurrences & Catalog pages & remove PrimeNG | Feature Pages (`features/**`) | unit | unit | ✅ OK |
| T12: Update Playwright E2E suite | Full-Stack UI Flows (`frontend/e2e/**`) | e2e | e2e | ✅ OK |
