# 06 — UI Polish: Selects, Budget KPI Alignment, Recurrence Cards & Scrollbars Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, the walk, check_proofs, the Verifier and the screens sub-agent).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/06-ui-polish-selects-kpis-recurrences/spec.md`
**Design**: skipped (scope Medium — refinamentos localizados em componentes Angular/ZardUI existentes e folha de estilos global, sem novos padrões arquiteturais)
**Status**: Completed (approved 2026-11-28)
**Build**: `cd frontend && npm run lint; cd frontend && npm run build; cd frontend && npm test -- --watch=false`
**Run unit**: `cd frontend && npm test -- --watch=false`

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md`, `frontend/package.json`, `frontend/angular.json`, `frontend/src/app/shared/ui/select/z-select.component.spec.ts`, `frontend/src/app/shared/ui/dialog/z-dialog.component.spec.ts`, `frontend/src/app/features/budgets/budget-detail-page.component.spec.ts`, `frontend/src/app/features/recurrences/recurrences-page.component.spec.ts`, `frontend/e2e/lumo-mvp.spec.ts`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Shared UI Components (`shared/ui/`) | unit | 1:1 para critérios de posicionamento fixo, flip vertical, busca case/accent-insensitive, limpeza de busca, estado vazio/sem resultados e tratamento coordenado de `Escape` | `frontend/src/app/shared/ui/**/*.spec.ts` | `cd frontend && npx ng test --watch=false --include=src/app/shared/ui/select/z-select.component.spec.ts --include=src/app/shared/ui/dialog/z-dialog.component.spec.ts` |
| Feature UI Components (`features/`) | unit | 1:1 para props `[searchable]` nos selects de listas dinâmicas, estrutura dos 3 cards KPI em `/budgets/:id` (barra `% pago` acima do divisor) e cards de recorrências em 3 zonas com ações e tooltips | `frontend/src/app/features/**/*.spec.ts` | `cd frontend && npm test -- --watch=false` |
| Global Stylesheet (`styles.css`) | none | - (build gate + verificação E2E real) | `frontend/src/styles.css` | build gate only |
| Frontend E2E (`e2e/`) | e2e | Desktop e Mobile: popover de `<z-select>` sem `overflow-y` no modal, busca sem acento, alinhamento <= `2px` do footer KPI em `/budgets/:id`, cards de recorrências em 3 zonas e scrollbars estilizadas | `frontend/e2e/*.spec.ts` | `cd frontend && npx playwright test --reporter=list` |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | After tasks with unit tests only | `cd frontend && npm test -- --watch=false` |
| Full | After tasks with e2e tests | `cd frontend && npm test -- --watch=false && npx playwright test --reporter=list` |
| Build | After phase completion or stylesheet-only tasks | `cd frontend && npm run lint && npm run build && npm test -- --watch=false` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Shared UI Primitives, Feature Polish & E2E Verification

```
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8
```

---

## Task Breakdown

### T1: Upgrade `ZSelectComponent` to viewport-fixed popover with auto-flip and opt-in `[searchable]`

**What**: Refatorar `ZSelectComponent` para renderizar o painel do popover em posicionamento `fixed` relativo à viewport (`z-[70]`) calculado a partir de `getBoundingClientRect()` do gatilho (com flip automático para cima quando faltar espaço abaixo, contenção dentro dos limites da viewport em mobile/desktop, e reposicionamento/fechamento em scroll externo ou resize), adicionar entrada opt-in `[searchable]="false"` e `[searchPlaceholder]="'Buscar...'"` com input fixo no topo do painel, foco automático ao abrir, filtragem case-insensitive e sem diferenciação de acentos, limpeza da busca ao fechar/selecionar, estado `"Nenhum resultado encontrado"`, e `event.preventDefault()` / `stopImmediatePropagation()` ao fechar via `Escape`, com testes unitários co-localizados em `z-select.component.spec.ts`.
**Where**: `frontend/src/app/shared/ui/select/z-select.component.ts`
**Depends on**: None
**Reuses**: `frontend/src/app/shared/ui/select/z-select.component.ts`, Angular Signals (`computed`, `signal`, `viewChild`), Tailwind CSS v4 tokens
**Requirement**: UI-01, UI-02, UI-03

**Done when**:

- [x] Painel do popover (`[data-testid="z-select-panel"]` contendo `[data-testid="z-select-listbox"]`) usa `position: fixed` com `top`/`left`/`width` derivados do gatilho, `z-[70]` acima de `<z-dialog>`, e faz flip para cima quando o espaço abaixo for insuficiente e houver mais espaço acima.
- [x] Popover se mantém dentro dos limites horizontais e verticais da viewport (inclusive em `375px`) e reposiciona/fecha ao rolar container ancestral externo ao listbox ou redimensionar a janela.
- [x] Quando `[searchable]="true"`, exibe campo de busca fixo no topo do painel (`[data-testid="z-select-search"]`) com foco automático, filtra opções de forma insensível a caixa e acentos (`alimentacao` → `Alimentação`), mostra `"Nenhum resultado encontrado"` quando o filtro não encontra correspondências, mantém `"Nenhuma opção disponível"` quando `options` está vazio, e limpa o termo de busca ao selecionar ou fechar.
- [x] Quando `[searchable]="false"` (padrão), não renderiza campo de busca.
- [x] Clicar no campo de busca ou dentro do painel não fecha o popover; pressionar `Escape` fecha o popover e sinaliza o evento (`preventDefault()`) para não fechar um `<z-dialog>` pai.
- [x] Testes unitários co-localizados em `frontend/src/app/shared/ui/select/z-select.component.spec.ts` cobrem posicionamento fixo, flip vertical, busca com/sem acentos, limpeza de busca, estado `"Nenhum resultado encontrado"`, omissão da busca quando `searchable=false` e consumo de `Escape`.
- [x] Gate check passes: `cd frontend && npm test -- --watch=false`
- [x] Test count: >= 10 tests pass in `z-select.component.spec.ts` (no silent deletions)

**Tests**: unit
**Gate**: quick
**Commit**: `feat(ui): make z-select viewport-fixed and searchable`

---

### T2: Guard `ZDialogComponent` Escape key handling when an inner popover consumes Escape

**What**: Atualizar o listener `document:keydown.escape` em `ZDialogComponent` para ignorar o evento quando já tratado (`event.defaultPrevented`) por um popover filho aberto (como `<z-select>`), garantindo que `Escape` feche apenas o dropdown mantendo o modal aberto, com testes unitários co-localizados em `z-dialog.component.spec.ts`.
**Where**: `frontend/src/app/shared/ui/dialog/z-dialog.component.ts`
**Depends on**: T1
**Reuses**: `frontend/src/app/shared/ui/dialog/z-dialog.component.ts`, `frontend/src/app/shared/ui/dialog/z-dialog.component.spec.ts`
**Requirement**: UI-01

**Done when**:

- [x] `ZDialogComponent.onEscapeKey(event: KeyboardEvent)` não fecha o diálogo se `event.defaultPrevented` for `true`, mantendo fechamento normal quando `Escape` não foi consumido.
- [x] Teste unitário em `frontend/src/app/shared/ui/dialog/z-dialog.component.spec.ts` valida que um `<z-select>` aberto dentro de `<z-dialog>` consome o primeiro `Escape` mantendo o diálogo visível e o segundo `Escape` fecha o diálogo.
- [x] Gate check passes: `cd frontend && npm test -- --watch=false`
- [x] Test count: all existing + new tests pass in `z-dialog.component.spec.ts` (no silent deletions)

**Tests**: unit
**Gate**: quick
**Commit**: `fix(ui): keep z-dialog open when z-select handles escape`

---

### T3: Add global modern slim scrollbar styling for Light Mode, Dark Mode, and dark sidebar surfaces

**What**: Adicionar estilização global moderna e fina de scrollbars em `frontend/src/styles.css` com tokens CSS dedicados para Light Mode (`:root`), Dark Mode (`:root.dark`) e superfícies escuras fixas da sidebar (`aside, [data-testid="mobile-drawer"]`), cobrindo WebKit (`::-webkit-scrollbar` `6px`, track transparente, thumb `9999px` sem setas, hover suave) e padrão Firefox (`scrollbar-width: thin`, `scrollbar-color`).
**Where**: `frontend/src/styles.css`
**Depends on**: T2
**Reuses**: `frontend/src/styles.css` variáveis de tema `:root` e `:root.dark`
**Requirement**: UI-07

**Done when**:

- [x] `frontend/src/styles.css` define `--lumo-scrollbar-thumb`, `--lumo-scrollbar-thumb-hover` e `--lumo-scrollbar-track` em `:root`, `:root.dark` e `aside, [data-testid="mobile-drawer"]`.
- [x] Regras globais aplicam `scrollbar-width: thin`, `scrollbar-color`, `::-webkit-scrollbar` (`6px`), `::-webkit-scrollbar-track` transparente, `::-webkit-scrollbar-thumb` arredondado (`9999px`) e `::-webkit-scrollbar-button { display: none }`.
- [x] Gate check passes: `cd frontend && npm run lint && npm run build && npm test -- --watch=false`

**Tests**: none
**Gate**: build
**Commit**: `style(ui): add slim modern global scrollbar styling`

---

### T4: Enable searchable selects for Category and Beneficiary in `TransactionFormDrawerComponent`

**What**: Habilitar `[searchable]="true"` (com placeholders claros) nos `<z-select>` de Categoria e Beneficiário em `TransactionFormDrawerComponent`, mantendo Tipo e Status sem busca, com testes unitários co-localizados em `transaction-form-drawer.component.spec.ts`.
**Where**: `frontend/src/app/features/budgets/transaction-form-drawer.component.ts`
**Depends on**: T3
**Reuses**: `ZSelectComponent` (`searchable`, `searchPlaceholder`), `TransactionFormDrawerComponent`
**Requirement**: UI-02, UI-03

**Done when**:

- [x] `<z-select inputId="txn-category">` e `<z-select inputId="txn-beneficiary">` configuram `[searchable]="true"`.
- [x] `<z-select inputId="txn-type">` e `<z-select inputId="txn-status">` mantêm busca desativada (`searchable=false`).
- [x] Testes unitários em `frontend/src/app/features/budgets/transaction-form-drawer.component.spec.ts` validam busca nos selects de Categoria/Beneficiário e ausência de busca em Tipo/Status.
- [x] Gate check passes: `cd frontend && npm test -- --watch=false`
- [x] Test count: all existing + new tests pass in `transaction-form-drawer.component.spec.ts` (no silent deletions)

**Tests**: unit
**Gate**: quick
**Commit**: `feat(budgets): make transaction form selects searchable`

---

### T5: Align Expense KPI footer above progress bar and enable searchable filter selects in `BudgetDetailPageComponent`

**What**: Reestruturar os 3 cards de KPI (`[data-testid="budget-summary-cards"]`) em `BudgetDetailPageComponent` movendo a barra de progresso `% pago` do card de Despesas para acima do divisor e ancorando o bloco de footer (`Realizado (Recebido)`, `Realizado (Pago)` e `Saldo Realizado`) na base (`mt-auto`) com `data-testid="kpi-footer-income|expense|balance"`, e habilitar `[searchable]="true"` nos filtros de Categoria e Beneficiário (mantendo Status sem busca), atualizando `budget-detail-page.component.spec.ts`.
**Where**: `frontend/src/app/features/budgets/budget-detail-page.component.ts`
**Depends on**: T4
**Reuses**: `BudgetDetailPageComponent`, `ZSelectComponent`
**Requirement**: UI-02, UI-03, UI-04

**Done when**:

- [x] No card de Despesas de `BudgetDetailPageComponent`, a barra de progresso (`expensePaidPercent()`) é renderizada acima da linha de footer `Realizado (Pago)`.
- [x] Os 3 cards de KPI usam layout flex vertical consistente com o bloco de footer (`border-t`) ancorado na base (`mt-auto`) e `data-testid` explícitos para validação de alinhamento.
- [x] Os filtros de Categoria e Beneficiário em `BudgetDetailPageComponent` ativam `[searchable]="true"`, enquanto o filtro de Status mantém `searchable=false`.
- [x] Testes unitários em `frontend/src/app/features/budgets/budget-detail-page.component.spec.ts` verificam a ordem DOM (progresso antes do footer de Despesas), a presença dos 3 footers com `mt-auto` e a busca nos filtros de Categoria/Beneficiário.
- [x] Gate check passes: `cd frontend && npm test -- --watch=false`
- [x] Test count: all existing + new tests pass in `budget-detail-page.component.spec.ts` (no silent deletions)

**Tests**: unit
**Gate**: quick
**Commit**: `fix(budgets): align expense KPI footer and filter search`

---

### T6: Enable searchable month selector in `DashboardPageComponent`

**What**: Habilitar `[searchable]="true"` no `<z-select>` seletor de mês em `DashboardPageComponent` (`[data-testid="dashboard-month-selector"]`) com `searchPlaceholder="Buscar mês..."`, atualizando `dashboard-page.component.spec.ts`.
**Where**: `frontend/src/app/features/dashboard/dashboard-page.component.ts`
**Depends on**: T5
**Reuses**: `DashboardPageComponent`, `ZSelectComponent`
**Requirement**: UI-02

**Done when**:

- [x] `<z-select>` dentro de `[data-testid="dashboard-month-selector"]` habilita `[searchable]="true"` com `searchPlaceholder`.
- [x] Teste unitário em `frontend/src/app/features/dashboard/dashboard-page.component.spec.ts` valida que o seletor de mês abre com campo de busca e filtra meses corretamente.
- [x] Gate check passes: `cd frontend && npm test -- --watch=false`
- [x] Test count: all existing + new tests pass in `dashboard-page.component.spec.ts` (no silent deletions)

**Tests**: unit
**Gate**: quick
**Commit**: `feat(dashboard): enable searchable month selector`

---

### T7: Reorganize recurrence cards into 3 clean zones and enable searchable modal selects in `RecurrencesPageComponent`

**What**: Reorganizar o template dos cards de recorrências em `RecurrencesPageComponent` em 3 zonas claras com altura uniforme (`h-full flex flex-col`): (1) topo com título limpo + indicador discreto de situação (`Ativa`/`Inativa`) à esquerda e valor em `tabular-nums` + rótulo `Fixo`/`Estimado` à direita; (2) corpo com metadados estruturados (modo/vigência, início formatado via `competenceMonth`, vencimento opcional, categoria com dot colorido `categoryColor`, beneficiário opcional e `notes` truncada em 1 linha sem separadores soltos); e (3) rodapé ancorado na base (`mt-auto border-t`) com tipo (`Receita`/`Despesa`) à esquerda e botão compacto `Editar` + botões secundários compactos com ícone, `aria-label` e `zTooltip` para `Desativar`/`Reativar` e `Excluir` à direita; além de habilitar `[searchable]="true"` nos selects de Categoria e Beneficiário do modal (mantendo Tipo, Valor, Modo e barra de filtros curtos sem busca), atualizando `recurrences-page.component.spec.ts`.
**Where**: `frontend/src/app/features/recurrences/recurrences-page.component.ts`
**Depends on**: T6
**Reuses**: `CompetenceMonthPipe`, `BrlCurrencyPipe`, `ZTooltipDirective`, `ZButtonComponent`, `ZSelectComponent`, design tokens `AD-009` / `AD-010` (100% sem verde)
**Requirement**: UI-02, UI-03, UI-05, UI-06

**Done when**:

- [x] Cada card `[data-testid="recurrence-card-<description>"]` exibe as 3 zonas (topo, metadados estruturados, rodapé com `mt-auto`), omitindo campos opcionais nulos sem separadores soltos (`•`), exibindo `categoryColor` em dot circular e `notes` truncada quando presente.
- [x] Rodapé exibe botão `Editar` e botões secundários com ícone, `aria-label` acessível e `zTooltip` para `Desativar` (ativa) / `Reativar` (inativa) e `Excluir`, mantendo contraste legível em cards inativos e zero classes `emerald-*` / `green-*`.
- [x] Selects de Categoria (`rec-cat`) e Beneficiário (`rec-ben`) no modal habilitam `[searchable]="true"`; selects de Tipo, Valor, Modo e filtros da barra mantêm `searchable=false`.
- [x] Testes unitários em `frontend/src/app/features/recurrences/recurrences-page.component.spec.ts` validam as 3 zonas, omissão de metadados ausentes, exibição de categoria/observações, ações de manutenção em cards ativos e inativos, e `[searchable]` apenas em Categoria/Beneficiário.
- [x] Gate check passes: `cd frontend && npm run lint && npm run build && npm test -- --watch=false`
- [x] Test count: >= 6 tests pass in `recurrences-page.component.spec.ts` (no silent deletions)

**Tests**: unit
**Gate**: build
**Commit**: `feat(recurrences): redesign cards into 3 clean zones`

---

### T8: Add Playwright E2E regression tests for fixed/searchable selects, KPI footer alignment, 3-zone recurrence cards, and scrollbars

**What**: Adicionar cenários E2E em `frontend/e2e/lumo-mvp.spec.ts` (desktop e mobile) que comprovam na aplicação em execução: (a) abrir `<z-select>` de Categoria e Beneficiário dentro do modal de Novo Lançamento sem alterar `scrollHeight`/`overflow-y` do modal, filtrando com texto sem acento e fechando apenas o select ao pressionar `Escape`; (b) diferença vertical `<= 2px` entre `getBoundingClientRect().top` dos 3 footers KPI em `/budgets/:id` no desktop; (c) renderização das 3 zonas e execução de ações nos cards de `/recurrences`; e (d) propriedades CSS de scrollbar estilizada em Light Mode, Dark Mode e sidebar escura.
**Where**: `frontend/e2e/lumo-mvp.spec.ts`
**Depends on**: T7
**Reuses**: `frontend/e2e/lumo-mvp.spec.ts` (helpers de login dev e criação de orçamento/lançamento/recorrência)
**Requirement**: UI-01, UI-02, UI-04, UI-05, UI-06, UI-07

**Done when**:

- [x] Cenário E2E valida no modal de Novo Lançamento que abrir Categoria/Beneficiário usa `position: fixed`, não incrementa `scrollHeight` do corpo do diálogo, filtra sem acento e `Escape` mantém o modal aberto.
- [x] Cenário E2E mede `getBoundingClientRect().top` dos 3 footers KPI em `/budgets/:id` no desktop e confirma diferença `<= 2px`.
- [x] Cenário E2E valida os cards de `/recurrences` em 3 zonas com categoria/metadados/ações (Editar, Desativar/Reativar, Excluir).
- [x] Cenário E2E valida `scrollbarWidth === 'thin'` e variáveis CSS de scrollbar em Light Mode, Dark Mode e sidebar.
- [x] Gate check passes: `cd frontend && npm test -- --watch=false && npx playwright test --reporter=list`
- [x] Test count: full Vitest + Playwright desktop & mobile suites pass with 0 failures

**Tests**: e2e
**Gate**: full
**Commit**: `test(e2e): verify select popover, KPI alignment and cards`

---

## Checks

**C1** - Abrir `<z-select>` renderiza o popover em `position: fixed` acima de `<z-dialog>` sem aumentar o `scrollHeight` do corpo do modal (UI-01, AC 1)
Proof: run unit | should render popover with fixed viewport positioning and keep dialog scroll unchanged

**C2** - Quando falta espaço abaixo do gatilho e há mais espaço acima, o `<z-select>` abre posicionado acima do gatilho dentro da viewport (UI-01, AC 2)
Proof: run unit | should flip popover above trigger when viewport space below is insufficient

**C3** - Com `[searchable]="true"`, `<z-select>` exibe campo de busca no topo com foco automático e filtra opções de forma case-insensitive e sem acentos (UI-02, AC 3)
Proof: run unit | should filter options case-insensitively and accent-insensitively when searchable is true

**C4** - Com `[searchable]="false"` (padrão), `<z-select>` omite o campo de busca (UI-03, AC 4)
Proof: run unit | should omit search input when searchable is false

**C5** - Selecionar opção ou fechar o popover limpa o termo de busca para a próxima abertura (UI-02, AC 5)
Proof: run unit | should clear search query after selecting an option or closing popover

**C6** - Pressionar `Escape` com `<z-select>` aberto dentro de `<z-dialog>` fecha apenas o popover mantendo o diálogo aberto (UI-01, AC 6)
Proof: run unit | should keep dialog open when Escape is consumed by an inner open select

**C7** - Rolar container externo ou redimensionar a janela reposiciona/fecha o popover mantendo alinhamento com o gatilho (UI-01, AC 7)
Proof: run unit | should reposition or close popover on external scroll or window resize

**C8** - Busca sem correspondências em `<z-select>` exibe `"Nenhum resultado encontrado"` mantendo o popover aberto (UI-02, Edge Case 1)
Proof: run unit | should display no-results message when search matches no options

**C9** - Selects de Categoria e Beneficiário no formulário de lançamento ativam `[searchable]="true"`, enquanto Tipo e Status mantêm `searchable=false` (UI-02, UI-03)
Proof: run unit | should enable search on category and beneficiary selects while keeping type and status non-searchable

**C10** - Seletor de Mês no Dashboard ativa `[searchable]="true"` e filtra competências (UI-02, AC 3)
Proof: run unit | should enable searchable month selector in dashboard header

**C11** - Em `/budgets/:id`, a barra de progresso `% pago` do card de Despesas fica acima do divisor e os 3 footers KPI ficam alinhados com diferença `<= 2px` em desktop (UI-04, AC 1 & AC 2)
Proof: `cd frontend && npx playwright test e2e/lumo-mvp.spec.ts -g "UI polish"`

**C12** - Cards de `/recurrences` exibem 3 zonas organizadas (topo, metadados com `categoryColor`/vigência/observações sem separadores soltos, e rodapé ancorado na base) com ações Editar, Desativar/Reativar e Excluir acessíveis com tooltip (UI-05, UI-06, AC 1–4)
Proof: run unit | should render recurrence cards in three clean zones with metadata and maintenance actions

**C13** - Scrollbars globais finas (`scrollbar-width: thin`) e tokens de Light Mode, Dark Mode e sidebar escura aplicados em `styles.css` e verificados no navegador (UI-07, AC 1 & AC 2)
Proof: `cd frontend && npx playwright test e2e/lumo-mvp.spec.ts -g "UI polish"`

---

## Handoff

The feature's live state, written as it happens - a compaction gives no warning.

**Settled mid-build:** none
**Dispatched:** none
**Walked:** none
