# UI/UX Overhaul & Dedicated Analytics Dashboard Context

**Gathered:** 2026-11-26
**Spec:** `.specs/features/02-ui-ux-overhaul/spec.md`
**Status:** Ready for design

---

## Feature Boundary

Redesenhar a experiência visual (UI/UX) do Lumo no frontend Angular v22 + Tailwind CSS + PrimeNG v22, adotando uma paleta de cores editorial fintech 100% sem verde (**Royal Indigo & Azul Safira**), tipografia ampliada e legível (**Plus Jakarta Sans** + **JetBrains Mono**), layout fluido em tela cheia (`w-full` sem restrição `max-w-7xl`), criação de uma página dedicada de **Dashboard (`/dashboard`)** com gráficos multicoloridos e evolução mensal, remoção dos gráficos da página de detalhe do orçamento mensal (`/budgets/:id`), e substituição do cabeçalho `"Status (1-clique)"` por `"Status"` com tooltip explicativo.

---

## Implementation Decisions

### Paleta de Cores e Identidade Visual (Zero Verde)

- **Decisão do usuário**: *"Mas não quero verde, quero outra cor"* → Selecionado: **"Royal Indigo & Azul Safira (Estilo Stripe/Linear) — Marca em Indigo (#4F46E5), Receitas/Pago em Azul Safira (#0284C7), Despesas em Coral (#E11D48) e Estimado em Âmbar (Zero verde)"**.
- Cor institucional primária (botões primários, links ativos, foco, logo, PrimeNG Aura primary preset): **Royal Indigo** (`indigo-600` `#4F46E5` no Light / `indigo-500` `#6366F1` no Dark).
- Semântica financeira positiva (Receitas, Saldo Positivo, Status `SETTLED` Pago/Recebido, barras de progresso de quitação): **Azul Safira / Sky** (`sky-600` `#0284C7` no Light / `sky-400` `#38BDF8` no Dark).
- Semântica financeira de saída (Despesas, Saldo Negativo, ações destrutivas): **Coral / Rose** (`rose-600` `#E11D48` no Light / `rose-400` `#FB7185` no Dark).
- Semântica de previsão variável (Status `ESTIMATED`, alertas suaves): **Âmbar** (`amber-600` `#D97706` no Light / `amber-400` `#FBBF24` no Dark).
- Superfícies neutras: Camadas refinadas em `slate`/`zinc` com contraste limpo, bordas sutis e sombras suaves no modo claro e escuro.

### Nova Página de Dashboard (`/dashboard`) e Gráficos Multicoloridos

- **Decisão do usuário**: **"Visão do mês selecionado (Categorias, Beneficiários, Status de Liquidação) + Evolução Mensal (Receitas vs. Despesas entre meses)"**.
- Os gráficos saem completamente da tela `/budgets/:id` (Detalhe do Orçamento Mensal), deixando a página do orçamento rápida, limpa e 100% focada na operação da tabela de lançamentos.
- A nova rota `/dashboard` exibe:
  1. Seletor de competência mensal (padrão: orçamento mais recente ou mês atual) + botão de ação rápida `"Abrir lançamentos do mês"` que navega para `/budgets/:id`.
  2. KPIs executivos do mês selecionado (Receita Prevista/Realizada, Despesa Prevista/Realizada, Saldo Previsto/Realizado e Taxa de Quitação).
  3. Gráfico **Despesas por Categoria** (Doughnut multicolorido + lista ranqueada lateral com cor, valor `R$` e percentual `%` sobre o total).
  4. Gráfico **Despesas por Beneficiário** (Barras horizontais multicoloridas onde cada beneficiário recebe uma cor distinta da paleta categórica quando exibindo distribuição, além de comparativo Previsto vs. Realizado com legenda clara).
  5. Gráfico **Composição por Status de Liquidação** (Estimado, Pendente, Liquidado em valores/quantidades com cores distintas: Âmbar, Indigo/Slate e Azul Safira).
  6. Gráfico **Evolução Mensal** (Comparativo de Receitas vs. Despesas e Saldo ao longo dos meses cadastrados em `store.budgets()`).

### Navegação e Rota Inicial (Landing Page)

- **Decisão do usuário**: **"Dashboard (/dashboard) como primeiro item do menu e página inicial, com atalho direto para o orçamento do mês atual"**.
- A rota raiz `''` redireciona para `/dashboard`.
- Ordem da navegação principal na sidebar desktop e drawer mobile:
  1. `Dashboard` (`/dashboard`, ícone `pi pi-chart-pie`)
  2. `Orçamentos` (`/budgets`, ícone `pi pi-wallet`)
  3. `Recorrências` (`/recurrences`, ícone `pi pi-sync`)
  4. `Cadastros` (`/catalog`, ícone `pi pi-tags`)

### Aproveitamento de Tela Cheia (Full-Width) e Tipografia Ampliada

- **Decisão do usuário**: **"Full-width fluido em todas as páginas (100% da área útil ao lado da sidebar) + fonte base ampliada (15-16px) e números tabulares maiores"**.
- Remoção de `max-w-7xl` no `<main>` do `AppShellComponent`, utilizando `w-full` com padding responsivo (`p-5 sm:p-6 lg:px-10 lg:py-8`).
- Carregamento das fontes **Plus Jakarta Sans** (interface e títulos) e **JetBrains Mono** (valores monetários/numéricos tabulares) no `index.html` / `styles.css`.
- Escala tipográfica ampliada: células de tabela, inputs e textos principais em `0.9375rem–1rem` (`15px–16px`), cabeçalhos de seção e cards em `1.125rem–1.25rem`, títulos de página em `1.75rem–2rem` e números de KPI em `1.875rem–2.25rem`.

### Cabeçalho da Coluna Status e Tooltip de 1-Clique

- **Decisão do usuário**: *"Lá na listagem do orçamento tem header na tabela Status (1-clique), isso tá ruim, pode ser um tooltip descrevendo que muda com o clique."*
- O cabeçalho da tabela em `/budgets/:id` passa a exibir apenas **`Status`** acompanhado de um ícone discreto `pi pi-info-circle` com `pTooltip="Clique no status do lançamento para alternar entre Pendente e Pago/Recebido"`.
- O botão do badge de status em cada linha também exibe `pTooltip` contextual (`"Clique para marcar como Pago/Recebido"` ou `"Clique para reverter para Pendente"`).

### Agent's Discretion

- Curadoria exata dos 10 tons hexadecimais da paleta categórica dos gráficos (garantindo harmonia com Royal Indigo/Sapphire Blue/Coral/Amber e zero dependência de verde esmeralda).
- Design dos estados vazios (Empty States) no `/dashboard` quando ainda não houver orçamento mensal criado ou quando o orçamento selecionado não possuir despesas lançadas.

### Declined / Undiscussed Gray Areas → Assumptions

- Nenhuma área cinzenta foi recusada; todas as 4 decisões de produto foram respondidas pelo usuário.

---

## Specific References

- Estilo visual inspirado em **Stripe / Linear** (superfícies limpas em camadas, tipografia forte, Royal Indigo `#4F46E5` como cor de marca e Azul Safira `#0284C7` para indicadores positivos/receitas, sem uso de verde).

---

## Deferred Ideas

- None - discussion stayed within feature scope.
