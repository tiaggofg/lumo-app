# 06 — UI Polish: Selects, Budget KPI Alignment, Recurrence Cards & Scrollbars Context

**Gathered:** 2026-11-28
**Spec:** `.specs/features/06-ui-polish-selects-kpis-recurrences/spec.md`
**Status:** Ready for spec confirmation

---

## Feature Boundary

Esta feature entrega quatro melhorias de UX e acabamento visual no frontend Angular/ZardUI do Lumo, sem alterações no backend ou em contratos REST:
1. Popover flutuante (viewport-aware) em todo `<z-select>` para nunca estourar ou ativar `overflow-y` dentro de modais (`<z-dialog>`), somado a busca/filtro interno nos selects de listas dinâmicas.
2. Alinhamento horizontal da linha de footer (`Realizado (...)` / `Saldo Realizado`) nos 3 cards de KPI da tela de detalhe do orçamento (`/budgets/:id`).
3. Reorganização da hierarquia visual e das ações de manutenção dos cards na tela de Recorrências (`/recurrences`).
4. Estilização global, fina e elegante das barras de rolagem (`overflow-x` / `overflow-y`) adaptadas para Light Mode, Dark Mode e superfícies escuras (sidebar).

---

## Implementation Decisions

### 1. Escopo do filtro interno em `<z-select>`

- Escolha do usuário: *"Apenas nos selects de listas dinâmicas (Categoria, Beneficiário e seletor de Mês no Dashboard), mantendo selects curtos (Tipo, Status, Modo) limpos"*.
- O componente `<z-select>` expõe entrada booleana opt-in (`[searchable]="true"`, padrão `false`) ativada nos selects de **Categoria**, **Beneficiário** (modal de lançamento, filtros de orçamento, modal de recorrência) e **seletor de Mês no Dashboard**.
- A correção de posicionamento do popover (não estourar/ativar scroll em modais) vale para **todos** os `<z-select>` do aplicativo, independentemente de `[searchable]`.

### 2. Alinhamento do footer do KPI de Despesas (`/budgets/:id`)

- Escolha do usuário: *"Mover a barra de progresso ("% pago") para acima do divisor do footer, mantendo a linha "Realizado (...)" alinhada na base dos 3 cards"*.
- Nos 3 cards de resumo (`RECEITAS`, `DESPESAS`, `SALDO DO MÊS`), o bloco do footer (`border-t` + rótulo `Realizado (...)` / `Saldo Realizado` + valor) permanece ancorado na mesma linha de base (`mt-auto`), com a barra de progresso `% pago` posicionada acima do divisor no card de Despesas.

### 3. Reorganização dos cards de Recorrências (`/recurrences`)

- Escolha do usuário: *"Card em 3 zonas limpas: topo (título + status discreto à esquerda, valor em destaque à direita), corpo com metadados organizados (categoria com bolinha de cor, beneficiário, vencimento, modo/vigência) e rodapé com ações compactas (botões com ícones/tooltip ou Editar + ações secundárias)"*.
- Elimina o amontoado de 3 badges competindo com o título e a linha única concatenada com `•`.
- Estrutura o card em 3 zonas com rodapé alinhado na base (`mt-auto`): topo (título + situação discreta / valor + tipo de valor), corpo (metadados estruturados com ícones e dot colorido de categoria + observação truncada quando houver) e rodapé (modo/tipo discreto à esquerda + botão `Editar` e ações secundárias compactas com ícone e tooltip à direita).

### Agent's Discretion

- Estilização global das scrollbars (`styles.css`): barra fina (`6px`), thumb arredondado sem setas, trilha transparente, paleta Slate adaptada a Light Mode, Dark Mode e sidebar escura (`aside`), com fallback padrão Firefox (`scrollbar-width: thin`, `scrollbar-color`).
- Normalização de acentos e caixa alta/baixa na busca do `<z-select>` (ex.: `"alimentacao"` encontra `"Alimentação"`).

### Declined / Undiscussed Gray Areas → Assumptions

- Nenhuma área foi recusada pelo usuário; os detalhes de menor impacto estão registrados em `Assumptions & Open Questions` na `spec.md`.

---

## Specific References

- Design system atual do Lumo: Royal Indigo (`#4F46E5`), Azul Safira (`#0284C7`), Rose para despesas, Slate para superfícies, 100% sem verde (`AD-009` / `AD-010`).

---

## Deferred Ideas

- None - discussion stayed within feature scope.
