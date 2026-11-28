# 06 — UI Polish: Selects, Budget KPI Alignment, Recurrence Cards & Scrollbars Specification

**Status**: Approved
**Approved**: 2026-11-28 - user: "aprovado"

## Problem Statement

Quatro pontos de acabamento de interface prejudicam o uso diário do Lumo: (1) ao abrir qualquer `<z-select>` dentro de um modal (`<z-dialog>`), o popover absoluto estoura o container interno e ativa scroll vertical indesejado no modal, além de listas longas (Categoria, Beneficiário, Mês) não possuírem busca; (2) na tela de detalhe do orçamento (`/budgets/:id`), a barra de progresso `% pago` abaixo do divisor desloca o footer `Realizado (Pago)` do KPI de Despesas para fora da linha dos demais KPIs; (3) os cards de `/recurrences` amontoam título, três badges e metadados concatenados, dificultando leitura e manutenção; e (4) as barras de rolagem padrão do navegador destoam do visual moderno do aplicativo.

## Goals

- [x] Garantir que 100% dos `<z-select>` abram em camada flutuante fixa na viewport sem alterar o `scrollHeight` nem ativar `overflow-y` do modal pai, e oferecer filtro textual nos selects de listas dinâmicas (Categoria, Beneficiário e Mês no Dashboard).
- [x] Alinhar horizontalmente o divisor e o footer `Realizado (...)` / `Saldo Realizado` nos 3 cards de KPI da tela `/budgets/:id` em viewports desktop/tablet (`>= 768px`).
- [x] Reorganizar os cards de `/recurrences` em 3 zonas claras (topo, metadados estruturados e rodapé compacto alinhado na base), preservando todas as operações de manutenção.
- [x] Aplicar estilização global, fina e consistente para todas as barras de rolagem (`overflow-x` e `overflow-y`) em Light Mode, Dark Mode e na sidebar escura.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Alterações no backend, schema SQL ou endpoints REST | Todas as melhorias são puramente de apresentação e interação no frontend com dados já retornados pela API atual. |
| Criação inline de novas categorias/beneficiários pelo `<z-select>` | Escopo atual cobre apenas seleção e busca entre opções existentes. |
| Conversão da página de Recorrências para tabela desktop | Usuário optou por manter cards reorganizados em 3 zonas limpas. |
| Busca interna em selects fixos de 2–3 opções (Tipo, Status, Modo, Situação) | Usuário optou por habilitar `[searchable]` apenas nas listas dinâmicas (Categoria, Beneficiário e Mês no Dashboard). |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Escopo do filtro interno em `<z-select>` | Prop `[searchable]="true"` (padrão `false`) habilitada nos selects de Categoria, Beneficiário e Mês no Dashboard | Decisão explícita do usuário para manter selects curtos limpos e facilitar busca em listas dinâmicas | y |
| Posição da barra `% pago` no KPI de Despesas (`/budgets/:id`) | Mover a barra de progresso para acima do divisor do footer, ancorando `Realizado (...)` na base dos 3 cards | Decisão explícita do usuário para alinhar os 3 footers mantendo o indicador visual de quitação | y |
| Organização dos cards de Recorrências (`/recurrences`) | Card em 3 zonas: topo (título + situação / valor + tipo de valor), corpo (metadados estruturados com dot de categoria e observação) e rodapé com `Editar` + ações secundárias compactas com ícone e tooltip | Decisão explícita do usuário para reduzir ruído visual e melhorar leitura e manutenção | y |
| Correspondência de texto no filtro do `<z-select>` | Substring case-insensitive e sem diferenciação de acentos (ex.: `alimentacao` encontra `Alimentação`) | Evita fricção ao digitar termos em português sem acentuação | y |
| Escape com `<z-select>` aberto dentro de `<z-dialog>` | Pressionar `Escape` fecha apenas o popover do `<z-select>` aberto, sem fechar o `<z-dialog>` pai | Previne perda acidental de formulário preenchido ao dispensar apenas o dropdown | y |
| Estilo das barras de rolagem globais | Scrollbars finas (`6px`), thumb arredondado em tons Slate sem setas, trilha transparente, com tokens específicos para Light Mode, Dark Mode e sidebar escura (`aside`) | Mantém coerência com o design system ZardUI/Tailwind v4 (`AD-010`) sem interferir no layout | y |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Popover flutuante e busca em `<z-select>` ⭐ MVP

**User Story**: As a usuário do Lumo preenchendo formulários ou filtrando dados, I want que todo `<z-select>` abra em popover flutuante sem estourar o modal e que listas dinâmicas possuam campo de busca so that eu selecione categorias, beneficiários e meses rapidamente sem quebrar o layout do modal.

**Why P1**: Corrige o bug de UX mais recorrente relatado em todos os selects dentro de modais e desbloqueia seleção rápida em catálogos grandes.

**Acceptance Criteria**:

1. WHEN o usuário abre qualquer `<z-select>` dentro de um `<z-dialog>` THEN o sistema SHALL renderizar o painel do popover em posicionamento fixo relativo à viewport (`position: fixed`) acima do modal, sem aumentar o `scrollHeight` nem ativar `overflow-y` no corpo do modal.
2. WHEN o espaço disponível abaixo do botão gatilho do `<z-select>` for menor que a altura necessária do popover e houver mais espaço acima THEN o sistema SHALL abrir o popover posicionado acima do gatilho mantendo-o totalmente dentro da viewport.
3. WHERE `[searchable]="true"` estiver ativo no `<z-select>` (Categoria e Beneficiário em `TransactionFormDrawerComponent`, `BudgetDetailPageComponent` e `RecurrencesPageComponent`, e seletor de Mês em `DashboardPageComponent`), WHEN o usuário abrir o popover THEN o sistema SHALL exibir um campo de busca fixo no topo do painel com foco automático e filtrar as opções em tempo real de forma insensível a maiúsculas, minúsculas e acentos.
4. WHERE `[searchable]="false"` (padrão) estiver configurado no `<z-select>` (Tipo, Status, Modo, Situação e Ícone), WHILE o popover estiver aberto o sistema SHALL omitir o campo de busca mantendo a listagem compacta.
5. WHEN o usuário fechar o popover ou selecionar uma opção em um `<z-select>` com busca THEN o sistema SHALL limpar o termo digitado na busca para a próxima abertura.
6. WHILE um `<z-select>` estiver aberto dentro de um `<z-dialog>`, WHEN o usuário pressionar `Escape` THEN o sistema SHALL fechar apenas o popover do `<z-select>` mantendo o `<z-dialog>` aberto.
7. IF o usuário rolar um container ancestral externo ao listbox ou redimensionar a janela enquanto o popover estiver aberto THEN o sistema SHALL reposicionar o popover junto ao gatilho ou fechá-lo caso o gatilho saia da área visível, mantendo o alinhamento visual.

**Independent Test**: Abrir o modal "Novo Lançamento" com 15+ categorias/beneficiários, abrir o select de Categoria, confirmar que o modal não ganha barra de rolagem vertical nem corta o dropdown, digitar `"alimentacao"` e selecionar `"Alimentação"`.

---

### P1: Alinhamento do footer nos KPIs do detalhe do orçamento ⭐ MVP

**User Story**: As a usuário acompanhando um orçamento mensal em `/budgets/:id`, I want que o divisor e o footer `Realizado (...)` dos cards de Receitas, Despesas e Saldo do Mês fiquem perfeitamente alinhados na mesma linha horizontal so that a leitura comparativa dos 3 KPIs seja imediata e visualmente equilibrada.

**Why P1**: Corrige o desalinhamento visual direto apontado na tela principal de acompanhamento mensal.

**Acceptance Criteria**:

1. WHILE a página `/budgets/:id` for exibida em viewport tablet ou desktop (`>= 768px`) com os 3 cards de resumo visíveis THEN o sistema SHALL renderizar a barra de progresso `% pago` do card de Despesas acima do divisor do footer e alinhar horizontalmente a linha superior do footer (`Realizado (Recebido)`, `Realizado (Pago)` e `Saldo Realizado`) na mesma posição vertical nos 3 cards (tolerância máxima de `2px`).
2. The system SHALL manter visíveis no card de Despesas de `/budgets/:id` o valor previsto, a barra de progresso com o percentual pago (`expensePaidPercent()`) e a linha de rodapé `Realizado (Pago)` com o valor realizado.

**Independent Test**: Abrir `/budgets/:id` em desktop (`>= 1024px`) e tablet (`768px`), comparar `getBoundingClientRect().top` do bloco de footer nos 3 cards dentro de `[data-testid="budget-summary-cards"]` e confirmar alinhamento com diferença <= `2px`.

---

### P1: Cards de Recorrências reorganizados em 3 zonas ⭐ MVP

**User Story**: As a usuário gerenciando contas fixas, variáveis e parcelamentos em `/recurrences`, I want que cada card organize as informações em 3 zonas claras (topo, metadados estruturados e rodapé compacto de ações) so that eu leia rapidamente valor, categoria, vencimento e vigência e realize manutenção sem poluição visual.

**Why P1**: Melhora diretamente a escaneabilidade e manutenção da tela de recorrências, que hoje concentra texto e badges sem hierarquia.

**Acceptance Criteria**:

1. The system SHALL estruturar cada card em `/recurrences` (`[data-testid="recurrence-card-<description>"]`) em três zonas distintas: (a) cabeçalho com título limpo e indicador discreto de situação (`Ativa`/`Inativa`) à esquerda e valor em `tabular-nums` com rótulo discreto do tipo de valor (`Fixo`/`Estimado`) à direita; (b) corpo com metadados estruturados exibindo modo/vigência, mês de início formatado, dia de vencimento (quando informado), categoria com indicador circular na `categoryColor` (quando informada), beneficiário (quando informado) e observação truncada em 1 linha (quando informada); e (c) rodapé ancorado na base (`mt-auto`) com borda superior separando o tipo (`Receita`/`Despesa`) à esquerda e as ações de manutenção à direita.
2. WHEN o usuário interagir com o rodapé de um card de recorrência THEN o sistema SHALL disponibilizar o botão compacto `Editar` e botões de ação secundária com ícone, `aria-label` acessível e `zTooltip` para `Desativar` (quando ativa) ou `Reativar` (quando inativa) e `Excluir`, disparando os respectivos fluxos existentes.
3. WHILE uma recorrência estiver inativa (`active === false`) o sistema SHALL exibir o card com diferenciação visual atenuada preservando contraste legível dos textos e exibindo o indicador `Inativa` e a ação `Reativar`.
4. WHILE vários cards de recorrência forem exibidos lado a lado na grade em desktop (`>= 1024px`) o sistema SHALL manter todos os cards da mesma linha com altura uniforme e seus rodapés ancorados na base.

**Independent Test**: Abrir `/recurrences` com recorrências ativas e inativas (modos `INDEFINITE`, `FIXED_TERM` e `INSTALLMENT`, com e sem categoria/beneficiário/vencimento/observações) em desktop e mobile e validar leitura, tooltips e execução de Editar, Desativar, Reativar e Excluir.

---

### P2: Estilização moderna e elegante de scrollbars (overflows)

**User Story**: As a usuário navegando pelo Lumo em Light Mode ou Dark Mode, I want que todas as áreas com rolagem apresentem barras de rolagem finas, arredondadas e discretas so that tabelas, modais, selects e menus laterais mantenham visual moderno e coeso.

**Why P2**: Eleva o acabamento visual transversal de toda a aplicação em todos os containers com overflow.

**Acceptance Criteria**:

1. The system SHALL definir em `frontend/src/styles.css` estilização global de scrollbars finas (`6px` de largura/altura), trilha transparente, thumb arredondado (`border-radius: 9999px`) sem botões de seta, e propriedades padrão `scrollbar-width: thin` e `scrollbar-color` usando variáveis CSS dedicadas para Light Mode (`:root`) e Dark Mode (`:root.dark`).
2. WHILE a aplicação estiver em Light Mode, o sistema SHALL aplicar tokens de scrollbar para superfície escura nos containers roláveis da sidebar (`aside`) para manter contraste harmônico com o fundo `slate-900`.

**Independent Test**: Verificar em Light Mode e Dark Mode containers com overflow (listbox do `<z-select>`, corpo de `<z-dialog>`, lista de breakdown do Dashboard, tabela horizontal de lançamentos e navegação da sidebar) confirmando scrollbars finas, arredondadas e sem setas padrão.

---

## Edge Cases

- IF a busca digitada em um `<z-select>` com `[searchable]="true"` não corresponder a nenhuma opção THEN o sistema SHALL exibir a mensagem `"Nenhum resultado encontrado"` dentro da listagem sem fechar o popover.
- IF a lista `options` fornecida ao `<z-select>` estiver vazia THEN o sistema SHALL exibir `"Nenhuma opção disponível"`.
- IF um lançamento ou recorrência tiver categoria/beneficiário sem valor, sem dia de vencimento ou sem observações THEN o card de recorrência SHALL omitir os itens ausentes sem exibir separadores soltos (`•`) nem espaços vazios quebrados.
- WHEN a janela for muito estreita (mobile `375px`) e um `<z-select>` estiver próximo da borda inferior ou direita da tela THEN o sistema SHALL manter o popover contido dentro dos limites horizontais e verticais da viewport sem causar scroll horizontal na página.
- IF o usuário clicar dentro do campo de busca do `<z-select>` ou na barra de rolagem do popover THEN o sistema SHALL manter o popover aberto.

*(Implicit-requirement dimensions sweep: Escopo Medium exclusivamente de UI frontend — dimensões aplicáveis cobertas acima em input validation/bounds de busca e limites de viewport + state transitions de abertura/fechamento/escape; remaining dimensions N/A for this scope porque não há novas chamadas externas, autenticação, persistência ou concorrência.)*

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| UI-01 | P1: Popover flutuante e busca em `<z-select>` | Tasks | In Tasks |
| UI-02 | P1: Popover flutuante e busca em `<z-select>` | Tasks | In Tasks |
| UI-03 | P1: Popover flutuante e busca em `<z-select>` | Tasks | In Tasks |
| UI-04 | P1: Alinhamento do footer nos KPIs do detalhe do orçamento | Tasks | In Tasks |
| UI-05 | P1: Cards de Recorrências reorganizados em 3 zonas | Tasks | In Tasks |
| UI-06 | P1: Cards de Recorrências reorganizados em 3 zonas | Tasks | In Tasks |
| UI-07 | P2: Estilização moderna e elegante de scrollbars (overflows) | Tasks | In Tasks |

**Coverage:** 7 total, 7 mapped to tasks, 0 unmapped

---

## Sources

- Solicitação do usuário em 2026-11-28 e respostas de clarificação registradas em `.specs/features/06-ui-polish-selects-kpis-recurrences/context.md`.
- Decisões arquiteturais ativas `AD-009` e `AD-010` em `.specs/STATE.md`.

---

## Success Criteria

- [x] Nenhum `<z-select>` aumenta o `scrollHeight` ou dispara `overflow-y` em `<z-dialog>` ao abrir em desktop ou mobile.
- [x] Busca em `<z-select>` filtra corretamente com e sem acentos nos selects de Categoria, Beneficiário e Mês no Dashboard.
- [x] Diferença vertical entre o topo do footer dos 3 cards KPI em `/budgets/:id` é `<= 2px` em desktop e tablet.
- [x] Cards de `/recurrences` exibem as 3 zonas organizadas com rodapés alinhados e todas as ações (Editar, Desativar/Reativar, Excluir) funcionando em desktop e mobile.
- [x] Scrollbars finas e estilizadas funcionam consistentemente em Light Mode, Dark Mode e sidebar escura, sem erros de console ou regressões nos testes unitários e E2E Playwright.
