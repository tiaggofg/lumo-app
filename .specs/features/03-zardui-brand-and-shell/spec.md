# ZardUI Migration, Visual Depth, Collapsible Shell & Brand Identity Specification

**Status**: Approved
**Approved**: 2026-11-26 - user: "está aprovado"

## Problem Statement

O frontend Angular v22 do Lumo ainda depende do pacote `primeng` e `@primeuix/themes` (que exibem o aviso de licença proprietária `"Invalid PrimeUI License"`), apresenta baixo contraste no Modo Claro (fundo `slate-50`, sidebar branca e cards brancos que criam um aspecto excessivamente branco e chapado), possui uma sidebar desktop que estica junto com o scroll da página em vez de manter altura fixa na viewport (`100dvh`) e não pode ser minimizada para um rail de ícones, além de utilizar um quadrado genérico com a letra `"L"` no lugar de uma identidade de marca completa. Esta especificação define a remoção total do PrimeNG e sua substituição por componentes **ZardUI (estilo shadcn/ui para Angular, 100% MIT)** em `frontend/src/app/shared/ui/`, a reformulação dos 4 gráficos do `/dashboard` para o padrão visual **ZardUI / shadcn Charts**, a nova hierarquia de superfícies com Dark Sidebar (`slate-900`) no Light Mode e fundo `slate-100`, a sidebar fixa (`h-dvh sticky top-0`) com modo recolhido (`w-20`) persistido em `localStorage`, e a identidade de marca vetorial completa do **Lumo** (logotipo SVG "Prisma de Luz & Camadas", ícone compacto, favicon SVG/ICO e Web Manifest).

## Goals

- [x] Eliminar 100% das dependências `primeng` e `@primeuix/themes` do `frontend/package.json` e `app.config.ts`, erradicando o banner `"Invalid PrimeUI License"` e substituindo todos os componentes por primitivos e serviços **ZardUI (`z-button`, `z-dialog`, `z-confirm-dialog`, `z-toast-viewport`, `z-select`, `z-input`, `z-input-number`, `z-checkbox`, `z-textarea`, `z-tooltip`, `z-badge`)** em `frontend/src/app/shared/ui/`.
- [x] Reformular os 4 painéis gráficos de `/dashboard` (**Despesas por Categoria**, **Despesas por Beneficiário**, **Status de Liquidação** e **Evolução Mensal**) para o padrão **ZardUI / shadcn Charts (`<z-chart-container>`)**, com tooltips customizados no estilo shadcn, legendas interativas clicáveis, indicador central de total nos gráficos Doughnut e integração com os tokens de superfície Light/Dark.
- [x] Elevar a profundidade visual e o contraste de superfícies: adotar no **Light Mode** fundo de aplicação `bg-slate-100` (`#F1F5F9`), **Dark Sidebar** contrastante `bg-slate-900` (`#0F172A`), cards brancos elevados (`bg-white border-slate-200/90 shadow-sm`) e cabeçalhos de tabela/filtros em `bg-slate-100/80`; e no **Dark Mode** fundo `bg-slate-950`, sidebar `bg-slate-900` e cards `bg-slate-900` com bordas `border-slate-800`.
- [x] Tornar a sidebar desktop fixa na altura da viewport (`h-dvh sticky top-0 overflow-y-auto`) para que jamais cresça com o scroll do conteúdo principal, adicionando modo recolhido (**Collapsible Icon-Only Rail**, `w-20`) com persistência em `localStorage` (`lumo-sidebar-collapsed`) e tooltips ZardUI nos ícones.
- [x] Criar e aplicar a identidade visual completa da marca **Lumo** com o emblema vetorial **"Prisma de Luz & Camadas"** (losango/prisma facetado em gradiente Royal Indigo `#4F46E5` → Azul Safira `#0284C7` com feixe ascendente) + wordmark geométrico `"Lumo"`, incluindo `<app-lumo-logo>`, `favicon.svg`, `favicon.ico`, `apple-touch-icon.png` e `site.webmanifest`.

## Out of Scope

Explicitly excluded to prevent scope creep.

| Feature | Reason |
| --- | --- |
| Alterações de contrato na API REST Quarkus ou banco PostgreSQL | Todos os 5 pilares desta feature são exclusivos da camada de apresentação, design system e identidade visual no `frontend/` |
| Criação de novos tipos de gráficos financeiros além dos 4 painéis existentes no `/dashboard` | O escopo de gráficos concentra-se em elevar os 4 gráficos existentes para o padrão ZardUI / shadcn Charts |
| Editor customizado de logotipo ou seletor de múltiplas paletas de marca pelo usuário | A identidade visual Prisma de Luz & Camadas em Royal Indigo e Azul Safira é a marca oficial padronizada do produto |

---

## Implicit-Requirement Dimensions

| Dimension | Resolution |
| --- | --- |
| Input validation & bounds | Coberto por `ZARD-02`: `ZInputNumberComponent` valida limites `min`/`max`, formatação monetária `BRL` (`pt-BR`) e impede submissão de valores nulos ou menores/iguais a zero nos formulários de lançamento, estimativa e recorrência |
| Failure / partial-failure states | Coberto por `ZARD-03`: falhas HTTP interceptadas por `problemDetailInterceptor` disparam notificações via `ZToastService` no `<z-toast-viewport>` sem depender de `MessageService` do PrimeNG |
| Idempotency / retry / duplicate handling | Coberto por `CHART-01`: `<z-chart-container>` e `DashboardPageComponent` destroem instâncias anteriores do Chart.js antes de recriar os gráficos ao alternar mês, série ativa na legenda ou tema Light/Dark |
| Auth boundaries & rate limits | N/A because a aplicação não possui camada de autenticação na Fase 1 (`AD-007`) |
| Concurrency / ordering | Coberto por `ZARD-03`: fila de toasts no `ZToastService` remove automaticamente alertas após `life` (5000ms) sem colisão de IDs, e diálogos modais gerenciam pilha de foco e fechamento por `Escape` |
| Data lifecycle / expiry | Coberto por `SHELL-02`: preferência de colapso da sidebar é persistida no `localStorage` sob a chave `lumo-sidebar-collapsed` (`'true'` / `'false'`), com fallback seguro em ambientes sem `localStorage` |
| Observability | N/A because não há novos fluxos de backend; a verificação de zero erros de console e ausência total do aviso de licença PrimeUI é validada via Vitest e Playwright E2E |
| External-dependency failure | Coberto por `BRAND-01` e `ZARD-01`: todos os componentes ZardUI, logotipo SVG e ícones operam localmente no bundle sem chamadas de licença externas |
| State-transition integrity | Coberto por `SHELL-02` e `ZARD-02`: alternância entre sidebar expandida (`w-68`) e minimizada (`w-20`), abertura/fechamento de `z-dialog`, `z-confirm-dialog` e `z-select`, e toggle de status de lançamento em 1-clique mantêm consistência de estado via Angular Signals |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Contraste de superfícies no Light Mode | **Dark Sidebar mesmo no Light Mode** (`bg-slate-900` / `#0F172A` estilo Linear/Stripe) + fundo de página `bg-slate-100` (`#F1F5F9`) + cards brancos (`bg-white`) com borda `border-slate-200/90` e sombra sutil `shadow-sm` | Escolha explícita do usuário para eliminar o visual branco chapado e dar profundidade imediata entre navegação, canvas da página e cards | y |
| Conceito visual do logotipo SVG e favicon do Lumo | **Emblema "Prisma de Luz & Camadas"** (losango/prisma facetado em gradiente Royal Indigo `#4F46E5` → Azul Safira `#0284C7` com feixe ascendente) + wordmark `"Lumo"` geométrico | Escolha explícita do usuário para representar clareza financeira e camadas de orçamento | y |
| Comportamento padrão e persistência da sidebar recolhível | **Expandida por padrão (`w-68` / 272px)** com botão no cabeçalho da sidebar para recolher para rail de ícones (`w-20` / 80px), persistindo em `localStorage` (`lumo-sidebar-collapsed`) | Escolha explícita do usuário | y |
| Estratégia de implementação ZardUI no Angular v22 | Componentes Standalone ZardUI (`z-button`, `z-dialog`, `z-confirm-dialog`, `z-toast-viewport`, `z-select`, `z-input`, `z-input-number`, `z-checkbox`, `z-textarea`, `z-tooltip`, `z-badge`) em `frontend/src/app/shared/ui/` com Tailwind CSS v4 + Signals, removendo `primeng` e `@primeuix/themes` do `package.json` | Segue a arquitetura copy-paste/own-your-components do ZardUI (`zardui.com`) e shadcn/ui, 100% MIT e sem dependências proprietárias | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Migração Completa de PrimeNG para Componentes ZardUI 100% MIT (`ZARD-01`, `ZARD-02`, `ZARD-03`) ⭐ MVP

**User Story**: Como usuário e mantenedor do Lumo, quero que toda a interface utilize componentes ZardUI (estilo shadcn/ui para Angular, 100% MIT) sem qualquer dependência de `primeng` ou `@primeuix/themes`, para que o aplicativo tenha visual coeso estilo shadcn e nunca exiba o banner `"Invalid PrimeUI License"`.

**Why P1**: Elimina definitivamente a dependência de licença proprietária do PrimeNG e padroniza todos os controles interativos da aplicação no design system ZardUI.

**Acceptance Criteria**:

1. The system SHALL remove `primeng` and `@primeuix/themes` from `frontend/package.json` and remove `providePrimeNG`, `MessageService`, and `ConfirmationService` from `frontend/src/app/app.config.ts`, resulting in zero imports from `primeng/*` or `@primeuix/*` anywhere in `frontend/src/` and zero `"Invalid PrimeUI License"` banners or messages in the DOM or browser console.
2. The system SHALL provide a ZardUI component suite under `frontend/src/app/shared/ui/` comprising `ZButtonComponent` (`z-button`), `ZDialogComponent` (`z-dialog`), `ZConfirmDialogComponent` (`z-confirm-dialog`) + `ZConfirmService`, `ZToastViewportComponent` (`z-toast-viewport`) + `ZToastService`, `ZSelectComponent` (`z-select`), `ZInputDirective` (`[zInput]`), `ZInputNumberComponent` (`z-input-number`), `ZCheckboxComponent` (`z-checkbox`), `ZTextareaDirective` (`[zTextarea]`), `ZTooltipDirective` (`[zTooltip]`), and `ZBadgeComponent` (`z-badge`).
3. WHEN a form or filter uses `z-select` THEN the system SHALL render a shadcn/ZardUI-styled trigger button and dropdown listbox supporting `ngModel` (`ControlValueAccessor`), `options`, `optionLabel`, `optionValue`, `placeholder`, `showClear`, keyboard navigation (`Escape` to close), and click-outside dismissal across `/dashboard`, `/budgets/:id`, `/recurrences`, and `/catalog`.
4. WHEN a form uses `z-input-number` THEN the system SHALL support `ngModel` (`ControlValueAccessor`), `inputId`, `min`, `max`, integer mode, and `BRL` currency formatting (`pt-BR`, decimal comma or numeric input) in `TransactionFormDrawerComponent`, `ConfirmEstimateDialogComponent`, and `RecurrencesPageComponent`.
5. WHEN a user triggers a modal action (create/edit budget, transaction, recurrence, deactivate recurrence, confirm estimate, category, or beneficiary) THEN `z-dialog` SHALL render an accessible modal overlay with backdrop blur, header title, close button, body content, footer actions, and `Escape` key dismissal.
6. WHEN a user triggers a destructive confirmation (delete budget, transaction, recurrence, category, or beneficiary) THEN `ZConfirmService` and `<z-confirm-dialog />` SHALL display a ZardUI AlertDialog with header, message, cancel button, and destructive confirm button, executing the `accept` callback only upon confirmation.
7. WHEN an operation succeeds or `problemDetailInterceptor` catches an HTTP error (`application/problem+json`) THEN `ZToastService` and `<z-toast-viewport />` SHALL render a floating ZardUI toast card in the top-right viewport with semantic styling (`success`, `info`, `warn`, `error`), summary, optional detail, dismiss button, and auto-dismiss timer.
8. WHEN a user hovers or focuses an element decorated with `[zTooltip]` THEN the system SHALL set the `data-tooltip` attribute and display a floating ZardUI tooltip popover with the configured text.

**Independent Test**: Executar `npm run build`, `npm test` e abrir todas as rotas (`/dashboard`, `/budgets`, `/budgets/:id`, `/recurrences`, `/catalog`), verificando que não há qualquer texto `"Invalid PrimeUI License"` na página e que todos os diálogos, selects, inputs monetários, checkboxes, tooltips, confirmações de exclusão e toasts funcionam integralmente.

---

### P1: Gráficos Analíticos no Padrão ZardUI / shadcn Charts (`CHART-01`) ⭐ MVP

**User Story**: Como usuário do Lumo, quero que os 4 gráficos do `/dashboard` sigam o padrão visual e interativo do ZardUI / shadcn Charts, com containers padronizados, centro informativo nos gráficos Doughnut, legendas interativas e tooltips customizados no estilo shadcn.

**Why P1**: Alinha a experiência analítica do `/dashboard` à estética da nova biblioteca de UI ZardUI.

**Acceptance Criteria**:

1. The system SHALL wrap each of the 4 analytical charts in `/dashboard` (**Despesas por Categoria**, **Despesas por Beneficiário**, **Status de Liquidação**, and **Evolução Mensal**) using a reusable ZardUI chart card component (`<z-chart-container>`) that standardizes the header, subtitle, badge counter, interactive legend bar, and canvas area.
2. WHEN `/dashboard` renders the **Despesas por Categoria** and **Status de Liquidação** doughnut charts THEN the system SHALL render a crisp shadcn-style ring (`cutout: '72%'`, rounded arc segments `borderRadius: 6`, `spacing: 2`) with a centered summary overlay inside the doughnut displaying the total planned expenses in `BRL` (for Categories) and the settlement percentage / total transactions count (for Settlement Status).
3. WHEN a user hovers over any slice or bar in the 4 `/dashboard` charts THEN the system SHALL render a ZardUI / shadcn-styled tooltip showing the category/month/series title, color indicator dot, formatted monetary value in `BRL` (or count), and percentage share, adapting surface and border tokens to Light and Dark Mode.
4. WHEN a user clicks a legend item in `<z-chart-container>` (or series filter pill in **Despesas por Beneficiário** / **Evolução Mensal**) THEN the system SHALL toggle the visibility of that dataset/segment in the chart and visually dim the inactive legend pill.

**Independent Test**: Acessar `/dashboard` com lançamentos cadastrados, verificar o container `<z-chart-container>` nos 4 gráficos, o valor total centralizado no anel dos gráficos Doughnut, o tooltip estilo shadcn e a interação de clique nas legendas.

---

### P1: Profundidade Visual de Superfícies, Sidebar Fixa (`100dvh`) e Modo Minimizado (`SHELL-01`, `SHELL-02`) ⭐ MVP

**User Story**: Como usuário do Lumo, quero um Modo Claro com contraste real entre o fundo da página (`slate-100`), a sidebar escura (`slate-900`) e os cards brancos elevados, além de uma sidebar que mantenha altura fixa na tela durante o scroll e possa ser minimizada para uma barra compacta de ícones.

**Why P1**: Resolve diretamente o aspecto "tudo branco chapado" no modo Claro, o bug da sidebar esticando com o scroll da página e a falta de opção para recolher o menu lateral.

**Acceptance Criteria**:

1. WHILE Light Mode is active, the system SHALL render the application page canvas (`body` and `<main>`) with a cool soft slate background (`bg-slate-100` / `#F1F5F9`), the desktop sidebar and mobile navigation drawer with a high-contrast dark slate surface (`bg-slate-900` / `#0F172A`, `text-slate-100`, `border-slate-800`), content cards with elevated white surfaces (`bg-white`, `border-slate-200/90`, `shadow-sm`), and table headers / secondary filter bars with subtle contrasting fills (`bg-slate-100/80`).
2. WHILE Dark Mode (`.dark`) is active, the system SHALL render the application page canvas with `bg-slate-950` (`#020617`), the sidebar with `bg-slate-900` (`#0F172A`) and `border-slate-800`, and content cards with `bg-slate-900` and `border-slate-800`.
3. The system SHALL render the desktop sidebar (`<aside>` in `AppShellComponent`) with fixed viewport height and sticky positioning (`h-dvh sticky top-0 overflow-y-auto shrink-0`) so that scrolling a long `<main>` page never stretches the sidebar beyond the viewport height (`100dvh`) and keeps the navigation items and theme/collapse footer permanently visible.
4. The system SHALL render a sidebar collapse toggle button (`data-testid="sidebar-collapse-toggle"`) in the desktop sidebar that switches between **Expanded mode** (`w-68` / `272px`, default) and **Collapsed Icon-Only Rail mode** (`w-20` / `80px`), persisting the state in `localStorage` under the key `lumo-sidebar-collapsed`.
5. WHILE the desktop sidebar is in **Collapsed Icon-Only Rail mode** (`w-20`), the system SHALL display the compact Lumo logo mark (`variant="mark"`), hide navigation text labels, center navigation icons, attach a `[zTooltip]` with each item's label (`Dashboard`, `Orçamentos`, `Recorrências`, `Cadastros`), and render a compact icon-only theme toggle button with tooltip.

**Independent Test**: Abrir `/budgets/:id` ou `/dashboard` em desktop (`1440x900`), verificar que a sidebar é escura (`#0F172A`), o fundo da página é `#F1F5F9` e os cards são `#FFFFFF`; rolar a página e confirmar que a sidebar permanece com altura igual à viewport (`100dvh`); clicar em `sidebar-collapse-toggle`, verificar que a largura reduz para `80px` (`w-20`) exibindo apenas ícones com tooltips e o símbolo da logo, recarregar a página e confirmar que o estado minimizado persiste.

---

### P1: Identidade da Marca Lumo — Logotipo SVG "Prisma de Luz & Camadas", Favicon e Web Manifest (`BRAND-01`) ⭐ MVP

**User Story**: Como usuário do Lumo, quero ver um logotipo vetorial autoral ("Prisma de Luz & Camadas") na sidebar, no cabeçalho mobile, na aba do navegador (`favicon.svg` / `favicon.ico`) e nos metadados da aplicação, substituindo o placeholder genérico com a letra `"L"`.

**Why P1**: Consolida a identidade profissional do produto Lumo em toda a interface e no navegador.

**Acceptance Criteria**:

1. The system SHALL provide a reusable `<app-lumo-logo>` component (`frontend/src/app/shared/ui/logo/lumo-logo.component.ts`) rendering the custom **"Prisma de Luz & Camadas"** SVG emblem (faceted prism/diamond in a Royal Indigo `#4F46E5` to Sapphire Sky `#0284C7` gradient with an ascending light beam) and geometric `"Lumo"` wordmark.
2. WHEN `<app-lumo-logo variant="full" />` is rendered in the expanded desktop sidebar, mobile header, or mobile drawer THEN the system SHALL display both the SVG prism emblem and the `"Lumo"` wordmark (with optional subtitle `"Controle Financeiro"` in the desktop sidebar).
3. WHEN `<app-lumo-logo variant="mark" />` is rendered in the collapsed desktop sidebar (`w-20`) THEN the system SHALL display only the centered SVG prism emblem at `36px x 36px` (`w-9 h-9`).
4. The system SHALL provide `frontend/public/favicon.svg` (with the Lumo Prism SVG emblem), an updated `frontend/public/favicon.ico`, `frontend/public/apple-touch-icon.png`, and `frontend/public/site.webmanifest` (with `name: "Lumo — Controle Financeiro"`, `short_name: "Lumo"`, `theme_color: "#4F46E5"`, `background_color: "#0F172A"`), and reference them in `frontend/src/index.html` alongside `<meta name="theme-color" content="#4F46E5">`.

**Independent Test**: Inspecionar o cabeçalho da sidebar expandida, recolher a sidebar para ver o símbolo compacto `<app-lumo-logo variant="mark" />`, verificar `index.html` e requisitar `/favicon.svg` e `/site.webmanifest` confirmando que os arquivos existem e carregam sem erro.

---

## Edge Cases

- IF `localStorage` throws a security or quota exception when reading or saving `lumo-sidebar-collapsed` THEN `AppShellComponent` SHALL fall back to the in-memory signal (`collapsed = false`) without throwing an unhandled error.
- IF a user opens a `z-select` dropdown and presses `Escape` or clicks outside the component THEN `ZSelectComponent` SHALL close the listbox immediately and restore focus cleanly.
- IF all datasets in a `<z-chart-container>` legend are clicked except the last visible one THEN the chart container SHALL either keep at least one series visible or allow toggling back on with a single click without crashing Chart.js.
- WHEN the viewport width is below `1024px` (`lg` breakpoint) THEN the mobile slide-out drawer SHALL always render the full navigation labels and `<app-lumo-logo variant="full" />` regardless of whether the desktop sidebar is collapsed in `localStorage`.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| ZARD-01 | P1: Remoção total de `primeng` e `@primeuix/themes` e zero banner de licença | Execute | Verified |
| ZARD-02 | P1: Suite de componentes ZardUI (`z-button`, `z-dialog`, `z-select`, `z-input`, `z-input-number`, `z-checkbox`, `z-textarea`, `z-tooltip`, `z-badge`) | Execute | Verified |
| ZARD-03 | P1: Serviços e overlays ZardUI (`ZToastService` + `<z-toast-viewport>` e `ZConfirmService` + `<z-confirm-dialog>`) | Execute | Verified |
| CHART-01 | P1: Gráficos do `/dashboard` no padrão ZardUI / shadcn Charts (`<z-chart-container>`, centro no doughnut, legendas interativas e tooltip shadcn) | Execute | Verified |
| SHELL-01 | P1: Profundidade visual de superfícies (Light Mode com fundo `slate-100`, Dark Sidebar `slate-900` e cards brancos elevados) | Execute | Verified |
| SHELL-02 | P1: Sidebar desktop fixa (`h-dvh sticky top-0`) com modo minimizado (`w-20`) persistido em `localStorage` | Execute | Verified |
| BRAND-01 | P1: Identidade da marca Lumo (`<app-lumo-logo>` SVG "Prisma de Luz & Camadas", `favicon.svg`, `favicon.ico` e `site.webmanifest`) | Execute | Verified |

**Coverage:** 7 total, 7 mapped to tasks, 0 unmapped

---

## Sources

- Solicitação detalhada do usuário na abertura da sessão e decisões de UX/UI confirmadas em `.specs/features/03-zardui-brand-and-shell/context.md`.

---

## Success Criteria

- [x] `primeng` e `@primeuix/themes` completamente removidos de `package.json` e `node_modules`, com zero ocorrências de `"Invalid PrimeUI License"` em toda a aplicação.
- [x] Todos os componentes e fluxos migrados para `frontend/src/app/shared/ui/` no padrão ZardUI (botões, selects, inputs monetários, checkboxes, textareas, dialogs, confirm dialogs, toasts e tooltips).
- [x] Os 4 gráficos do `/dashboard` renderizando dentro de `<z-chart-container>` com visual ZardUI / shadcn Charts, centro informativo nos doughnuts, legendas clicáveis e tooltips estilizados.
- [x] Modo Claro com contraste nítido entre Dark Sidebar (`#0F172A`), fundo da página (`#F1F5F9`) e cards brancos (`#FFFFFF`), e sidebar desktop fixa (`100dvh`) com botão de minimizar/expandir persistido em `localStorage`.
- [x] Novo logotipo SVG **"Prisma de Luz & Camadas"** (`<app-lumo-logo>`), `favicon.svg`, `favicon.ico` e `site.webmanifest` ativos e validados por testes unitários (Vitest) e E2E (Playwright).
