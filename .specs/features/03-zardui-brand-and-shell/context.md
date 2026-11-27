# ZardUI Migration, Visual Depth, Collapsible Shell & Brand Identity Context

**Gathered:** 2026-11-26
**Spec:** `.specs/features/03-zardui-brand-and-shell/spec.md`
**Status:** Ready for design

---

## Feature Boundary

Esta feature entrega a migração completa dos componentes PrimeNG (`primeng` e `@primeuix/themes`) para uma biblioteca de componentes próprios no padrão **ZardUI (`zardui.com` / shadcn-angular, 100% MIT)** sob `frontend/src/app/shared/ui/`, a reformulação dos 4 gráficos analíticos do `/dashboard` para o padrão visual ZardUI / shadcn Charts (`z-chart-container`), o aumento da profundidade visual e contraste de superfícies no Light e Dark Mode (com Dark Sidebar no Light Mode estilo Linear/Stripe e fundo de página `slate-100` `#F1F5F9`), a sidebar desktop com altura fixa na viewport (`h-dvh sticky top-0`) e modo minimizado recolhível para rail de ícones (`w-20`) persistido em `localStorage`, e a criação da identidade de marca completa do **Lumo** (logotipo SVG "Prisma de Luz & Camadas", ícone compacto, `favicon.svg`, `favicon.ico`, `apple-touch-icon` e `site.webmanifest`).

---

## Implementation Decisions

### 1. Contraste de Superfícies no Light Mode & Dark Mode

- **Decisão do usuário**: *"Dark Sidebar mesmo no Light Mode (slate-900 / #0F172A estilo Linear/Stripe) + fundo de página slate-100 (#F1F5F9) + cards brancos com borda e sombra sutil"*.
- No **Light Mode**:
  - Fundo da aplicação (`body` e área `<main>`): `bg-slate-100` (`#F1F5F9`), eliminando o aspecto "tudo branco chapado".
  - Sidebar desktop e drawer mobile: superfície escura contrastante `bg-slate-900` (`#0F172A`) com borda `border-slate-800`, texto `text-slate-200`, item ativo `bg-indigo-600/20 text-indigo-300 border border-indigo-500/30` (ou pill `bg-indigo-600 text-white`).
  - Cards e painéis: `bg-white` (`#FFFFFF`) com borda definida `border-slate-200/90` e sombra sutil `shadow-sm`.
  - Cabeçalhos de tabelas e barras de filtros secundárias: `bg-slate-100/80` (`#F1F5F9`) com bordas `border-slate-200`.
- No **Dark Mode**:
  - Fundo da aplicação: `bg-slate-950` (`#020617`).
  - Sidebar: `bg-slate-900/95` (`#0F172A`) com borda `border-slate-800`.
  - Cards e painéis: `bg-slate-900` (`#0F172A`) com borda `border-slate-800` e destaque sutil.

### 2. Identidade Visual e Logotipo SVG do Lumo

- **Decisão do usuário**: *"Emblema 'Prisma de Luz & Camadas' (losango/prisma facetado em gradiente Royal Indigo #4F46E5 → Azul Safira #0284C7 com feixe ascendente) + wordmark 'Lumo' geométrico"*.
- Criar componente Angular reutilizável `<app-lumo-logo>` (com variantes `full` para símbolo + wordmark e `mark` apenas para o símbolo vetorial) e arquivos estáticos em `frontend/public/`:
  - `favicon.svg` (vetorial com o emblema Prisma de Luz & Camadas).
  - `favicon.ico` e `apple-touch-icon.png` (ou SVG/PNG compatível) + `site.webmanifest` com `theme_color: "#4F46E5"` e `background_color: "#0F172A"`.

### 3. Sidebar com Altura Fixa (`100dvh`) e Modo Minimizado (Collapsible Rail)

- **Decisão do usuário**: *"Expandida por padrão (w-68 / 272px) com botão no cabeçalho da sidebar para recolher para rail de ícones (w-20 / 80px), salvando em localStorage (lumo-sidebar-collapsed)"*.
- A sidebar desktop (`<aside>`) usa `h-dvh sticky top-0 overflow-y-auto shrink-0`, permanecendo 100% fixa na altura da janela enquanto apenas o `<main>` rola.
- Quando **expandida** (`w-68` / `272px`): mostra `<app-lumo-logo variant="full">`, subtítulo `"Controle Financeiro"`, botão de recolher no cabeçalho, links com ícone + texto e botão de alternância de tema com rótulo.
- Quando **minimizada** (`w-20` / `80px`): mostra `<app-lumo-logo variant="mark">`, botão para expandir, itens de navegação centralizados apenas com ícone e tooltip ZardUI (`zTooltip`) exibindo o nome da rota (`Dashboard`, `Orçamentos`, `Recorrências`, `Cadastros`), e botão compacto de tema com tooltip.

### 4. Migração Completa de PrimeNG para ZardUI (`shared/ui/`) e Gráficos ZardUI / shadcn Charts

- Remover `primeng` e `@primeuix/themes` de `frontend/package.json` e `app.config.ts` (eliminando 100% o aviso `"Invalid PrimeUI License"`).
- Construir os primitivos e serviços ZardUI em `frontend/src/app/shared/ui/`:
  - `z-button` (`ZButtonComponent` / diretiva `z-button` com variantes `default`, `secondary`, `outline`, `ghost`, `destructive`, `warn` e suporte a `loading`, `icon`, `size`).
  - `z-dialog` (`ZDialogComponent` modal acessível com backdrop blur, focus trap/ESC, header, content e footer).
  - `z-alert-dialog` + `ZConfirmService` + `<z-confirm-dialog />` (substituindo `ConfirmationService` e `<p-confirmdialog />`).
  - `z-toast` + `ZToastService` + `<z-toast-viewport />` (substituindo `MessageService` e `<p-toast />`, mantendo integração com `problemDetailInterceptor`).
  - `z-select` (`ZSelectComponent` com `ControlValueAccessor`, suporte a `options`, `optionLabel`, `optionValue`, `placeholder`, `showClear` e `inputId`).
  - `z-input` (`zInput` directive / component) e `z-input-number` (`ZInputNumberComponent` com `ControlValueAccessor`, formatação numérica e moeda `BRL` `pt-BR`, `min`, `max`, `inputId`).
  - `z-checkbox` (`ZCheckboxComponent` com `ControlValueAccessor`, `binary`, `inputId`).
  - `z-textarea` (`zTextarea` directive).
  - `z-tooltip` (`zTooltip` directive que mantém `data-tooltip` e exibe popover estilizado no padrão shadcn/ZardUI ao hover/focus).
  - `z-badge` (`ZBadgeComponent`).
- Reformular os 4 gráficos do `/dashboard` com o wrapper `<z-chart-container>` no padrão ZardUI / shadcn Charts: cards com header padronizado, legenda interativa clicável (permitindo ocultar/destacar séries), tooltip HTML/canvas customizado estilo shadcn (fundo escuro/claro com indicador colorido, valor em `BRL` com fonte mono e percentual), barras com cantos arredondados e preenchimento refinado, e centro informativo nos gráficos Doughnut (total de despesas no centro de Categorias e percentual/total de lançamentos no centro de Status de Liquidação).

### Agent's Discretion

- Manter `primeicons` (100% MIT) para os ícones existentes (`pi pi-*`) e combinar com SVGs inline onde apropriado (logo, ícones de colapso da sidebar, chevrons de select).
- Remover `BudgetChartsComponent` (`budget-charts.component.ts` e `.spec.ts`) caso não seja mais referenciado em nenhuma rota, mantendo o código limpo.

### Declined / Undiscussed Gray Areas → Assumptions

- Nenhuma área cinzenta foi recusada; todas as 3 decisões principais de UX/UI foram confirmadas pelo usuário.

---

## Specific References

- **ZardUI (`zardui.com`) / shadcn/ui**: estética de bordas sutis (`rounded-xl` / `rounded-2xl`), tipografia limpa, selects e dialogs minimalistas sem dependência de licença proprietária, gráficos estilo shadcn Charts com centro de doughnut informativo e tooltips estilizados.
- **Linear / Stripe Dashboard**: sidebar escura fixa (`slate-900`) contrastando com a área de conteúdo clara (`slate-100`) e cards brancos elevados (`bg-white shadow-sm border-slate-200/90`).

---

## Deferred Ideas

- None — discussion stayed within feature scope.
