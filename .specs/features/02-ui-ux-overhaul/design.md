# Lumo UI/UX Overhaul & Analytics Dashboard Design

**Spec**: `.specs/features/02-ui-ux-overhaul/spec.md`
**Context**: `.specs/features/02-ui-ux-overhaul/context.md`
**Status**: Approved

---

## 1. Design System & Theme Architecture (`UI-01`, `UI-02`)

### 1.1 Color Palette (Royal Indigo & Sapphire Blue — Zero Green)

To eliminate the generic green-dominated aesthetic, the application separates **brand/interactive controls** from **financial semantics**:

| Token Role | Light Mode | Dark Mode | Tailwind / Hex |
| --- | --- | --- | --- |
| **Brand Primary** (Buttons, Active Nav, Active Tabs, Focus Ring) | `#4F46E5` | `#6366F1` | `indigo-600` / `indigo-500` |
| **Brand Surface Tint** (Active Nav BG, Subtle Badges) | `#EEF2FF` | `rgba(49, 46, 129, 0.45)` | `indigo-50` / `indigo-950/60` |
| **Financial Positive / Income / Settled (`Pago`/`Recebido`)** | `#0284C7` | `#38BDF8` | `sky-600` / `sky-400` |
| **Financial Positive Surface** | `#E0F2FE` | `rgba(12, 74, 110, 0.45)` | `sky-100` / `sky-900/45` |
| **Financial Negative / Expense / Danger** | `#E11D48` | `#FB7185` | `rose-600` / `rose-400` |
| **Financial Negative Surface** | `#FFE4E6` | `rgba(136, 19, 55, 0.45)` | `rose-100` / `rose-900/45` |
| **Financial Estimated / Warning (`ESTIMATED`)** | `#D97706` | `#FBBF24` | `amber-600` / `amber-400` |
| **App Background** | `#F8FAFC` | `#020617` | `slate-50` / `slate-950` |
| **Card Surface** | `#FFFFFF` | `#0F172A` | `white` / `slate-900` |

**PrimeNG Theme Preset (`app.config.ts`)**:
Use `definePreset(Aura, { semantic: { primary: { 50: '{indigo.50}', ..., 950: '{indigo.950}' } } })` from `@primeuix/themes` so all PrimeNG buttons (`p-button`), inputs (`pInputText`, `p-inputnumber`), selects (`p-select`), checkboxes (`p-checkbox`) and dialogs (`p-dialog`) automatically use Royal Indigo instead of Aura's default emerald green.

### 1.2 Typography Scale (`index.html`, `styles.css`)

- **Google Fonts**:
  - `Plus Jakarta Sans:wght@400;500;600;700;800` for headings, labels, navigation, and body text.
  - `JetBrains Mono:wght@500;600;700` for `.font-mono` / `.tabular-nums` currency values, percentages, dates, and installment badges.
- **Scale Rules**:
  - Base body size: `16px` (`1rem`), line-height `1.5`.
  - Table cells (`<td>`), filter inputs, nav items, buttons: `0.9375rem–1rem` (`15px–16px`, `text-[15px]` / `text-base`).
  - Table headers (`<th>`), secondary subtitles, badges: `0.8125rem–0.875rem` (`13px–14px`, `text-xs`/`text-sm` with `font-semibold`).
  - Card titles / competence month headers: `1.125rem–1.25rem` (`18px–20px`, `text-lg`/`text-xl`).
  - Page titles (`<h1>`): `1.75rem–2rem` (`28px–32px`, `text-2xl sm:text-3xl font-extrabold`).
  - KPI primary numbers: `1.875rem–2.25rem` (`30px–36px`, `text-3xl font-extrabold tabular-nums`).

### 1.3 Full-Width Fluid Workspace (`AppShellComponent`)

- Remove `max-w-7xl mx-auto` from `<main>` in `frontend/src/app/core/layout/app-shell.component.ts`.
- Use `<main class="flex-1 min-w-0 w-full p-5 sm:p-6 lg:px-10 lg:py-8">` so 100% of the viewport width next to the sidebar (`lg:w-68`) is utilized.

---

## 2. Routing & Navigation Architecture (`DASH-01`)

- **`frontend/src/app/app.routes.ts`**:
  - `''` redirects to `'dashboard'` (`pathMatch: 'full'`).
  - `'dashboard'` loads `DashboardPageComponent` (`./features/dashboard/dashboard-page.component`).
  - Existing routes `/budgets`, `/budgets/:id`, `/recurrences`, `/catalog` remain intact.
- **`AppShellComponent.navItems`**:
  1. `{ label: 'Dashboard', route: '/dashboard', icon: 'pi pi-chart-pie' }`
  2. `{ label: 'Orçamentos', route: '/budgets', icon: 'pi pi-wallet' }`
  3. `{ label: 'Recorrências', route: '/recurrences', icon: 'pi pi-sync' }`
  4. `{ label: 'Cadastros', route: '/catalog', icon: 'pi pi-tags' }`

---

## 3. Dedicated Analytics Dashboard (`DashboardPageComponent`, `DASH-01`, `DASH-02`)

### 3.1 Data Flow
- Injects `BudgetsStoreService`.
- On init: loads `store.loadBudgets()`. If query parameter `?budgetId=` or `?month=` is present, selects that budget; otherwise selects the most recent budget (`store.budgets()[0]`) and calls `store.loadBudgetDetail(selectedBudgetId)`.
- Header controls:
  - Competence month selector (`p-select` over `store.budgets()`) to switch the analyzed month at any time.
  - Primary button `"Ver lançamentos do mês"` (`[routerLink]="['/budgets', selectedId]"`).
  - Secondary button `"Novo Orçamento"` (`routerLink="/budgets"`).

### 3.2 Curated 10-Color Non-Green Categorical Palette (`chart-palette.ts`)
```ts
export const LUMO_CHART_PALETTE = [
  '#4F46E5', // Royal Indigo
  '#0284C7', // Sapphire Sky
  '#E11D48', // Coral Rose
  '#D97706', // Warm Amber
  '#7C3AED', // Vivid Violet
  '#0891B2', // Deep Cyan
  '#DB2777', // Magenta Pink
  '#EA580C', // Burnt Orange
  '#2563EB', // Cobalt Blue
  '#9333EA', // Amethyst Purple
] as const;
```
- **Smart Color Resolver (`resolveCategoryColors`)**:
  - Replaces legacy emerald green hexes (`#10B981`, `#22C55E`) or duplicate colors across items in the same chart with distinct colors from `LUMO_CHART_PALETTE` by index so no two slices/bars collide or render monochrome.

### 3.3 Four Analytical Chart Panels
1. **Despesas por Categoria (`chart-category`)**:
   - Doughnut chart (`cutout: '68%'`) + adjacent ranked breakdown list with color dot, category name, amount (`R$`), and percentage share (`%`).
2. **Despesas por Beneficiário (`chart-beneficiary`)**:
   - Multi-color horizontal bar chart where each beneficiary bar uses a distinct color from `LUMO_CHART_PALETTE` for Planned expenses alongside a side-by-side/overlaid Realized indicator and ranked breakdown list.
3. **Status de Liquidação (`chart-status`)**:
   - Doughnut/Bar breakdown of `statusCounts` (`Liquidado` `#0284C7`, `Pendente` `#4F46E5`, `Estimado` `#D97706`) with count badges and progress bar.
4. **Evolução Mensal (`chart-evolution`)**:
   - Vertical grouped bar chart comparing chronological (`competenceMonth ASC`) `Receitas Previstas` (`#0284C7`), `Despesas Previstas` (`#E11D48`), and `Saldo Previsto` (`#4F46E5`) across up to the last 12 budgets in `store.budgets()`.

---

## 4. Monthly Budget Detail Cleanup & Status Tooltip (`BUD-02`)

- **`BudgetDetailPageComponent` (`/budgets/:id`)**:
  - Remove `<app-budget-charts>` import and template usage completely.
  - Add `"Ver Gráficos no Dashboard"` button in the top action bar navigating to `['/dashboard']` with `[queryParams]="{ budgetId: d.id }"`.
  - Import PrimeNG `TooltipModule` (`pTooltip`).
  - Replace `<th>Status (1-clique)</th>` with:
    ```html
    <th class="px-5 py-4">
      <span
        class="inline-flex items-center gap-1.5 cursor-help"
        pTooltip="Clique no status de qualquer lançamento para alternar em 1 clique entre Pendente e Pago/Recebido"
        tooltipPosition="top"
        data-testid="status-column-header"
      >
        <span>Status</span>
        <i class="pi pi-info-circle text-indigo-500 text-xs"></i>
      </span>
    </th>
    ```
  - On each row's status toggle button, bind `pTooltip` dynamically:
    `[pTooltip]="txn.status === 'SETTLED' ? 'Clique para reverter para Pendente' : (txn.type === 'INCOME' ? 'Clique para marcar como Recebido' : 'Clique para marcar como Pago')"`
