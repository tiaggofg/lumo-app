# 02-ui-ux-overhaul proofs

**HEAD**: 7cdd904
**Tree**: clean
**Shell**: /bin/sh
**Result**: 17 pass, 0 fail

| Check | Proof | Result |
| --- | --- | --- |
| C1 | `run frontend-unit / AppShellComponent` | pass |
| C2 | `run frontend-unit / TransactionStatusBadgeComponent` | pass |
| C3 | `run e2e / dashboard and typography scale` | pass |
| C4 | `run frontend-unit / AppShellComponent` | pass |
| C5 | `run e2e / dark mode persistence` | pass |
| C6 | `run e2e / dashboard default route and navigation` | pass |
| C7 | `run frontend-unit / DashboardPageComponent` | pass |
| C8 | `run frontend-unit / DashboardPageComponent` | pass |
| C9 | `run frontend-unit / chart-palette` | pass |
| C10 | `run e2e / dashboard multi-color charts` | pass |
| C11 | `run e2e / dashboard multi-color charts` | pass |
| C12 | `run frontend-unit / DashboardPageComponent` | pass |
| C13 | `run frontend-unit / DashboardPageComponent` | pass |
| C14 | `run frontend-unit / BudgetDetailPageComponent` | pass |
| C15 | `run frontend-unit / BudgetDetailPageComponent` | pass |
| C16 | `run e2e / budget detail settle and confirm estimate` | pass |
| Build | `cd frontend && npm run lint && npm run build` | pass |

## Output

`Run frontend-unit` - exit 0

```
   Duration  5.24s (environment 48%, setup 22%, import 18%, tests 10%, transform 1%, worker 1%)

stderr | src/app/features/budgets/budget-charts.component.spec.ts > BudgetChartsComponent > should render both category and beneficiary canvases and react to theme toggle
Failed to create chart: can't acquire context from the given item
Failed to create chart: can't acquire context from the given item

stderr | src/app/features/budgets/budget-charts.component.spec.ts > BudgetChartsComponent > should render both category and beneficiary canvases and react to theme toggle
Failed to create chart: can't acquire context from the given item
Failed to create chart: can't acquire context from the given item

stderr | src/app/features/dashboard/dashboard-page.component.spec.ts > DashboardPageComponent > should select latest budget, render executive KPIs, category % share, and sort evolution chronologically
Failed to create chart: can't acquire context from the given item
Failed to create chart: can't acquire context from the given item
Failed to create chart: can't acquire context from the given item
Failed to create chart: can't acquire context from the given item
```

`Run e2e` - exit 0

```

  ✓   1 [desktop] › e2e/lumo-mvp.spec.ts:61:3 › Lumo MVP Full-Stack E2E › dashboard default route and navigation, dashboard and typography scale (842ms)
  ✓   2 [desktop] › e2e/lumo-mvp.spec.ts:84:3 › Lumo MVP Full-Stack E2E › budgets list and create flow (1.5s)
  ✓   3 [desktop] › e2e/lumo-mvp.spec.ts:97:3 › Lumo MVP Full-Stack E2E › catalog categories and beneficiaries (5.2s)
  ✓   4 [desktop] › e2e/lumo-mvp.spec.ts:119:3 › Lumo MVP Full-Stack E2E › recurrences lifecycle and automatic materialization (3.1s)
  ✓   5 [desktop] › e2e/lumo-mvp.spec.ts:163:3 › Lumo MVP Full-Stack E2E › budget detail settle and confirm estimate (2.1s)
  ✓   6 [desktop] › e2e/lumo-mvp.spec.ts:262:3 › Lumo MVP Full-Stack E2E › dashboard multi-color charts and dark mode persistence (1.5s)
  ✓   7 [mobile] › e2e/lumo-mvp.spec.ts:61:3 › Lumo MVP Full-Stack E2E › dashboard default route and navigation, dashboard and typography scale (984ms)
  ✓   8 [mobile] › e2e/lumo-mvp.spec.ts:84:3 › Lumo MVP Full-Stack E2E › budgets list and create flow (1.3s)
  ✓   9 [mobile] › e2e/lumo-mvp.spec.ts:97:3 › Lumo MVP Full-Stack E2E › catalog categories and beneficiaries (3.2s)
  ✓  10 [mobile] › e2e/lumo-mvp.spec.ts:119:3 › Lumo MVP Full-Stack E2E › recurrences lifecycle and automatic materialization (3.0s)
  ✓  11 [mobile] › e2e/lumo-mvp.spec.ts:163:3 › Lumo MVP Full-Stack E2E › budget detail settle and confirm estimate (2.0s)
  ✓  12 [mobile] › e2e/lumo-mvp.spec.ts:262:3 › Lumo MVP Full-Stack E2E › dashboard multi-color charts and dark mode persistence (1.8s)

  12 passed (29.0s)
```
