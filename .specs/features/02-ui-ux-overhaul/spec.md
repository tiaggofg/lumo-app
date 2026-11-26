# Lumo UI/UX Overhaul & Analytics Dashboard Specification

**Status**: Approved
**Approved**: 2026-11-26 - user: "sim, pode aprovar a spec"

## Problem Statement

A interface atual do Lumo utiliza uma paleta monocromática dominada por verde (`emerald-600`) tanto para elementos de navegação/marca quanto para valores financeiros, possui fontes pequenas (`11px`–`12px`) que prejudicam a leitura, desperdiça espaço horizontal em monitores largos devido ao container `max-w-7xl`, exibe um cabeçalho poluído `"Status (1-clique)"` na tabela de lançamentos e posiciona gráficos de visualização dentro da página operacional de detalhe do orçamento mensal (`/budgets/:id`) com renderização frequentemente monocromática. Esta especificação define a reformulação completa da UI/UX do Lumo com a identidade visual **Royal Indigo & Azul Safira (zero verde)**, escala tipográfica ampliada (**Plus Jakarta Sans** + **JetBrains Mono**), layout fluido em tela cheia (`w-full`), tooltip explicativo na coluna `Status` e uma página dedicada de **Dashboard (`/dashboard`)** com gráficos analíticos multicoloridos e evolução mensal.

## Goals

- [ ] Substituir completamente o esquema de cores verde por uma paleta **Royal Indigo & Azul Safira (Estilo Stripe/Linear)**, usando Indigo (`#4F46E5`) para identidade/controles, Azul Safira (`#0284C7`) para receitas/saldos positivos/itens liquidados, Coral/Rose (`#E11D48`) para despesas/saldos negativos e Âmbar (`#D97706`) para estimativas, com suporte completo a Light e Dark Mode.
- [ ] Ampliar a escala tipográfica global adotando **Plus Jakarta Sans** e **JetBrains Mono** (`tabular-nums`), elevando textos de tabela e controles para `15px–16px` e eliminando micro-fontes de difícil leitura.
- [ ] Aproveitar 100% da largura útil da tela (`w-full` ao lado da sidebar, removendo `max-w-7xl`) em todas as páginas da aplicação.
- [ ] Criar a página dedicada de **Dashboard (`/dashboard`)** como rota inicial e primeiro item do menu lateral, contendo seletor de mês, atalho para os lançamentos do orçamento, KPIs executivos, gráficos multicoloridos (Categorias, Beneficiários, Status de Liquidação) e gráfico de Evolução Mensal entre orçamentos.
- [ ] Remover os gráficos da página de detalhe do orçamento mensal (`/budgets/:id`) e limpar o cabeçalho `"Status (1-clique)"` para `"Status"` com ícone informativo e tooltip PrimeNG (`pTooltip`).

## Out of Scope

Explicitly excluded to prevent scope creep.

| Feature | Reason |
| --- | --- |
| Novos endpoints de backend ou alterações no schema do banco de dados PostgreSQL | Todos os dados necessários para os gráficos do mês e evolução mensal já são fornecidos pelos endpoints existentes (`/api/v1/monthly-budgets` e `/api/v1/monthly-budgets/{id}`) |
| Exportação de gráficos em PDF/PNG | Fora do escopo de reformulação de UI/UX desta entrega |
| Customização de cores de tema pelo usuário final via banco de dados | A identidade visual Royal Indigo & Azul Safira (Light/Dark) é padronizada no design system da aplicação |

---

## Implicit-Requirement Dimensions

| Dimension | Resolution |
| --- | --- |
| Input validation & bounds | Coberto por `DASH-01`: seleção de competência no Dashboard valida a existência de orçamentos carregados e exibe estado vazio guiado caso nenhum orçamento exista |
| Failure / partial-failure states | Coberto por `DASH-01`: falhas de carregamento da API exibem notificação Toast RFC 9457 existente e mantêm a interface navegável sem quebrar a renderização dos canvas Chart.js |
| Idempotency / retry / duplicate handling | Coberto por `DASH-01`: instâncias do Chart.js são destruídas (`chart.destroy()`) antes de cada re-renderização ao trocar de mês ou alternar tema Light/Dark |
| Auth boundaries & rate limits | N/A because a aplicação opera sem camada de autenticação conforme `AD-007` |
| Concurrency / ordering | Coberto por `DASH-01`: o gráfico de Evolução Mensal ordena os orçamentos cronologicamente (`competenceMonth ASC`) independentemente da ordem descendente da listagem |
| Data lifecycle / expiry | N/A because esta feature altera exclusivamente a camada de apresentação e rotas do frontend sem criar novos dados persistidos |
| Observability | N/A because não há novos fluxos de backend; verificações visuais e de console browser zero-error são cobertas pelos testes E2E Playwright |
| External-dependency failure | Coberto por `UI-01`: fallback tipográfico (`system-ui, -apple-system, sans-serif` e `monospace`) caso o carregamento de Google Fonts esteja indisponível offline |
| State-transition integrity | Coberto por `BUD-02`: o clique rápido em 1-clique no badge de status continua alternando entre `PENDING` e `SETTLED` com tooltip dinâmico refletindo a próxima transição |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Paleta de cores e identidade visual (Zero Verde) | **Royal Indigo & Azul Safira (Estilo Stripe/Linear)**: Marca em Indigo (`#4F46E5`), Receitas/Pago em Azul Safira (`#0284C7`), Despesas em Coral (`#E11D48`), Estimado em Âmbar (`#D97706`) | Escolha explícita do usuário para eliminar o verde e elevar o nível visual com semântica financeira clara | y |
| Escopo da nova página de Dashboard (`/dashboard`) | Visão do mês selecionado (Categorias, Beneficiários, Status de Liquidação) + Evolução Mensal (Receitas vs. Despesas entre meses) | Escolha explícita do usuário para concentrar toda a análise visual em uma tela dedicada e rica | y |
| Rota inicial (Landing Page) e ordem do menu | `/dashboard` como primeiro item da sidebar e rota padrão (`/` redireciona para `/dashboard`), com atalho direto para abrir os lançamentos do orçamento selecionado | Escolha explícita do usuário | y |
| Aproveitamento de tela e escala de fontes | Layout full-width fluido (`w-full`, sem `max-w-7xl`) em todas as páginas + fonte base ampliada (`15px–16px`) e números tabulares maiores | Escolha explícita do usuário | y |
| Cabeçalho e interação da coluna Status na tabela | Cabeçalho `"Status"` com ícone informativo e `pTooltip` explicando a baixa em 1-clique, além de tooltip em cada badge de status | Solicitação explícita do usuário na abertura da spec | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Identidade Visual Royal Indigo & Azul Safira (Zero Verde), Tipografia Ampliada e Layout Full-Width (`UI-01`, `UI-02`) ⭐ MVP

**User Story**: Como usuário do Lumo, quero uma interface com esquema de cores profissional sem verde (Royal Indigo & Azul Safira), fontes maiores e leitura confortável que utilize toda a largura da tela em qualquer página.

**Why P1**: Resolve as queixas centrais sobre o esquema de cores atual, o tamanho reduzido da fonte e o desperdício de espaço de tela.

**Acceptance Criteria**:

1. The system SHALL configure the PrimeNG Aura theme preset with `indigo` as the primary color palette and apply Royal Indigo (`#4F46E5` in Light mode, `#6366F1` in Dark mode) to brand elements, primary buttons, active navigation links, and active filter tabs across the application, replacing all `emerald-*` brand and semantic classes.
2. The system SHALL represent positive financial semantics (income values, positive balances, `SETTLED` status badges `Pago`/`Recebido`, and settlement progress bars) using Sapphire/Sky Blue (`sky-600` / `#0284C7` in Light mode, `sky-400` / `#38BDF8` in Dark mode), expenses and negative balances using Coral/Rose (`rose-600` / `#E11D48` in Light mode, `rose-400` / `#FB7185` in Dark mode), and `ESTIMATED` status badges using Amber (`amber-600` / `#D97706` in Light mode, `amber-400` / `#FBBF24` in Dark mode).
3. The system SHALL load `Plus Jakarta Sans` as the primary UI/heading typeface and `JetBrains Mono` (with `font-variant-numeric: tabular-nums`) for monetary values, percentages, dates, and installment counters, applying a base body/table font size of at least `15px` (`0.9375rem` / `1rem`), page titles of at least `28px` (`text-2xl` / `text-3xl`), and KPI card values of at least `28px–32px`.
4. The system SHALL render the `<main>` content container in `AppShellComponent` with fluid full width (`w-full` without `max-w-7xl`), utilizing the full horizontal viewport alongside the desktop sidebar across `/dashboard`, `/budgets`, `/budgets/:id`, `/recurrences`, and `/catalog`.
5. WHILE Dark Mode (`.dark`) is active, the system SHALL render layered dark surfaces (`slate-950` background, `slate-900` cards, `slate-800` subtle borders) with high-contrast typography and adapted chart label/grid colors.

**Independent Test**: Abrir qualquer rota do aplicativo em desktop (`1440x900`) e mobile (`390x844`) nos modos Claro e Escuro, verificando ausência de classes `emerald-*`, uso de 100% da largura útil do `<main>`, fonte base ampliada (`Plus Jakarta Sans` / `JetBrains Mono`) e contraste adequado.

---

### P1: Página Dedicada de Dashboard Analítico Multicolorido (`/dashboard`) (`DASH-01`, `DASH-02`) ⭐ MVP

**User Story**: Como usuário do Lumo, quero acessar uma página dedicada de Dashboard (`/dashboard`) ao abrir o aplicativo para visualizar gráficos multicoloridos do mês selecionado e a evolução financeira entre meses, sem poluir a tela de lançamentos do orçamento.

**Why P1**: Entrega a visão analítica dedicada solicitada pelo usuário e corrige o problema dos gráficos monocromáticos.

**Acceptance Criteria**:

1. The system SHALL register `/dashboard` as the default application route (`'' -> '/dashboard'`) and display `Dashboard` (`pi pi-chart-pie`) as the first navigation item in both the desktop sidebar and mobile navigation drawer.
2. WHEN the user navigates to `/dashboard` and at least one `MonthlyBudget` exists THEN the system SHALL select the most recent competence month by default, allow switching the active month via a competence month selector, and provide a quick action button (`"Ver lançamentos do mês"`) that navigates directly to `/budgets/:id`.
3. WHEN `/dashboard` renders a selected `MonthlyBudget` THEN the system SHALL display executive KPI cards (Receita Prevista & Realizada, Despesa Prevista & Realizada, Saldo do Mês Previsto & Realizado, and Progresso de Quitação) above the analytics grid.
4. WHEN `/dashboard` renders the **Despesas por Categoria** chart THEN the system SHALL plot a multi-color Doughnut chart and an adjacent ranked list showing each category's color indicator, name, planned/realized amount in `BRL`, and percentage share (`%`), guaranteeing distinct colors from a curated 10-color non-green categorical palette (`#4F46E5`, `#0284C7`, `#E11D48`, `#D97706`, `#7C3AED`, `#0891B2`, `#DB2777`, `#EA580C`, `#2563EB`, `#9333EA`) even when categories share the same stored color or have no color.
5. WHEN `/dashboard` renders the **Despesas por Beneficiário** chart THEN the system SHALL plot a multi-color horizontal bar chart where each beneficiary bar uses a distinct categorical palette color (or distinct paired colors for Previsto vs. Realizado with visible value breakdown) so the chart is never rendered in a single flat color when `realizedAmount` is zero.
6. WHEN `/dashboard` renders the **Status de Liquidação** chart THEN the system SHALL display the distribution of transactions across `Liquidado (Pago/Recebido)` (`#0284C7`), `Pendente` (`#6366F1`), and `Estimado` (`#D97706`) with counts and monetary totals.
7. WHEN `/dashboard` renders the **Evolução Mensal** chart THEN the system SHALL plot the chronological comparison (`competenceMonth ASC`) of Receitas vs. Despesas (and resulting balance) across the available monthly budgets.
8. IF no `MonthlyBudget` exists when visiting `/dashboard` THEN the system SHALL display a guided empty state with a primary button to navigate to `/budgets` and create the first monthly budget.

**Independent Test**: Acessar `/dashboard`, alternar entre meses no seletor, verificar a renderização dos 4 blocos gráficos multicoloridos (Categorias, Beneficiários, Status de Liquidação e Evolução Mensal) e clicar no atalho para abrir `/budgets/:id`.

---

### P1: Limpeza da Página de Detalhe do Orçamento Mensal (`/budgets/:id`) e Tooltip de Status (`BUD-02`) ⭐ MVP

**User Story**: Como usuário do Lumo, quero que a página de detalhe do orçamento mensal (`/budgets/:id`) exiba apenas os cards de resumo, filtros e a tabela de lançamentos em largura total, sem gráficos atrapalhando a visão e com um tooltip elegante no cabeçalho e nos badges da coluna `Status`.

**Why P1**: Atende diretamente às reclamações sobre os gráficos atrapalhando a visão no orçamento mensal e sobre o texto ruim `"Status (1-clique)"` no cabeçalho da tabela.

**Acceptance Criteria**:

1. The system SHALL remove `<app-budget-charts>` from `BudgetDetailPageComponent` (`/budgets/:id`) and replace it with a header action button/link (`"Ver Gráficos no Dashboard"`) that navigates to `/dashboard?month=<competenceMonth>` (or `/dashboard` pre-selecting that budget).
2. The system SHALL render the status column header in the transactions table of `/budgets/:id` as `"Status"` accompanied by an info icon (`pi pi-info-circle`) with a PrimeNG tooltip (`pTooltip`) explaining `"Clique no status de qualquer lançamento para alternar entre Pendente e Pago/Recebido"`.
3. WHEN a user hovers or focuses the status badge button of a transaction row in `/budgets/:id` THEN the system SHALL display a contextual tooltip (`pTooltip`) indicating `"Clique para marcar como Pago"` (or `"Recebido"` for `INCOME`) when `status !== 'SETTLED'`, or `"Clique para reverter para Pendente"` when `status === 'SETTLED'`.
4. WHEN a user clicks the status badge button of a transaction row in `/budgets/:id` THEN the system SHALL toggle the transaction status between `PENDING`/`ESTIMATED` and `SETTLED` in 1 click and immediately refresh the budget summary cards.

**Independent Test**: Abrir `/budgets/:id`, verificar que não há gráficos na página, inspecionar o cabeçalho `"Status"` com ícone e tooltip, passar o mouse sobre o badge de status de um lançamento para ver o tooltip e clicar para alternar o status.

---

## Edge Cases

- IF a category has `#10B981` or `#22C55E` (legacy green from initial seed) or duplicate default `#6366F1` colors THEN the chart palette resolver in `/dashboard` SHALL assign distinct harmonious colors from the curated non-green categorical palette when rendering chart slices/bars so charts never appear monochrome.
- IF a selected `MonthlyBudget` in `/dashboard` has zero expenses (`expensesByCategory.length === 0`) THEN the system SHALL display a clear empty-chart placeholder card inside the category and beneficiary panels instead of an empty blank `<canvas>`.
- WHEN only one `MonthlyBudget` exists in the system THEN the **Evolução Mensal** chart in `/dashboard` SHALL render that single month's Receitas vs. Despesas bars cleanly without axis distortion.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| UI-01 | P1: Paleta Royal Indigo & Azul Safira (Zero Verde) e Tipografia Ampliada | Tasks | In Tasks |
| UI-02 | P1: Layout Full-Width Fluido em todas as páginas | Tasks | In Tasks |
| DASH-01 | P1: Página `/dashboard` como rota padrão com seletor de mês e gráficos multicoloridos | Tasks | In Tasks |
| DASH-02 | P1: Gráfico de Evolução Mensal e Composição por Status no `/dashboard` | Tasks | In Tasks |
| BUD-02 | P1: Remoção de gráficos de `/budgets/:id` e cabeçalho `Status` com `pTooltip` | Tasks | In Tasks |

**Coverage:** 5 total, 5 mapped to tasks, 0 unmapped

---

## Sources

- Solicitação do usuário no chat e decisões confirmadas em `.specs/features/02-ui-ux-overhaul/context.md`.

---

## Success Criteria

- [ ] Zero uso de verde esmeralda (`emerald-*`) na interface, substituído pela paleta **Royal Indigo (`#4F46E5`) & Azul Safira (`#0284C7`)** tanto no modo Claro quanto no Escuro.
- [ ] Fonte base ampliada (`Plus Jakarta Sans` + `JetBrains Mono`) e layout ocupando 100% da largura disponível (`w-full`) em todas as páginas.
- [ ] Nova página `/dashboard` funcionando como rota inicial com seletor de mês, gráficos multicoloridos (Categorias, Beneficiários, Status) e Evolução Mensal.
- [ ] Página `/budgets/:id` limpa (sem gráficos embutidos) e com coluna `"Status"` dotada de `pTooltip` explicativo.
- [ ] Todos os testes unitários (Vitest), build Angular, lint, SonarQube Quality Gate e testes E2E Playwright (desktop e mobile) passando com zero erros no console.
