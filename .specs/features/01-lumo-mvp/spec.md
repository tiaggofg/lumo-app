# Lumo MVP Specification

**Status**: Approved
**Approved**: 2026-11-26 - user: "está aprovado"

## Problem Statement

O controle financeiro mensal atual depende de uma planilha manual por mês, exigindo recriar despesas fixas, ajustar contas variáveis (água, faturas de cartão) e rastrear prazos ("Até Novembro") manualmente a cada virada de mês. O **Lumo** substitui essa planilha por uma aplicação web full-stack estruturada em Clean Architecture e DDD, oferecendo orçamentos mensais independentes, lançamentos manuais, motor de recorrências (fixas, estimadas, prazo definido e parceladas) e categorização por categoria e beneficiário.

## Goals

- [ ] Permitir criar e gerenciar orçamentos mensais únicos por competência (`YYYY-MM`) com cálculo dinâmico de receitas, despesas e saldo (Previsto vs. Realizado).
- [ ] Eliminar retrabalho mensal via motor de `RecurringTransaction` (`INDEFINITE`, `FIXED_TERM` e `INSTALLMENT`) com materialização automática e sem duplicação.
- [ ] Oferecer operação diária rápida no detalhe do orçamento: baixa em 1 clique (`Pago`/`Recebido`), ajuste rápido de contas `ESTIMATED`, filtros e gráficos leves por categoria e beneficiário.
- [ ] Entregar base arquitetural limpa (`domain` 100% Java puro em Quarkus 3.33 LTS + Angular v22) verificada por ArchUnit, Testcontainers, testes unitários e E2E Playwright.

## Out of Scope

Explicitly excluded from Phase 1 (MVP) to keep delivery focused while preserving architectural extensibility for future phases.

| Feature | Reason |
| --- | --- |
| Autenticação, login e gestão multi-usuário/Household | Fase 1 foca uso pessoal/familiar local ou protegido externamente; Auth entra na Fase 2 |
| Entidade `CreditCard` e faturas detalhadas por compra | Na Fase 1 cartões entram como `Transaction` manual com `notes` livre; modelagem dedicada entra na Fase 2 |
| Importação automática de extratos (OFX/CSV) e faturas (PDF) | Planejado para Fase 2 após consolidação do core manual e recorrente |
| Motor de projeção financeira mês a mês (futuro não materializado) | Planejado para fase futura sobre os dados de `RecurringTransaction` |
| Classificação automática de categorias via ML/LLM | Planejado para fase futura (ex: Quarkus LangChain4j) |
| Carryover automático de saldo entre meses | Cada `MonthlyBudget` é um recorte independente do mês |
| Múltiplas moedas | Fase 1 opera exclusivamente em `BRL` (`R$`) |

---

## Implicit-Requirement Dimensions

| Dimension | Resolution |
| --- | --- |
| Input validation & bounds | Coberto por `CAT-01`, `BEN-01`, `BUD-01`, `TXN-01`, `REC-01` (`Money > 0` escala 2 BRL, `dueDay` 1..31, `totalInstallments >= 2`, `1 <= startingInstallment <= totalInstallments`, `endMonth >= startMonth`, comprimentos máximos e HTTP 400 RFC 9457) |
| Failure / partial-failure states | Coberto por transações atômicas `@Command`: criação de `MonthlyBudget` + materialização e criação/edição/desativação de `RecurringTransaction` + propagação executam na mesma transação com rollback integral em erro |
| Idempotency / retry / duplicate handling | Coberto por `BUD-01` (unicidade por `competenceMonth`), `REC-02` (chave única `(monthly_budget_id, source_recurring_transaction_id)` impedindo duplicação) e `REC-04` (tabela `recurring_occurrence_exclusions` impedindo recriação após exclusão pontual) |
| Auth boundaries & rate limits | N/A because autenticação e multi-usuário estão explicitamente fora de escopo na Fase 1 (`AD-007`) |
| Concurrency / ordering | Coberto por constraints `UNIQUE` no PostgreSQL (tratando corrida de criação simultânea com HTTP 409) e ordenação determinística nas consultas (competência descendente para orçamentos; `dueDate` ascendente nulo por último e `createdAt` ascendente para transações) |
| Data lifecycle / expiry | Coberto por `CAT-01`, `BEN-01`, `BUD-01`, `REC-03`: soft-disable (`active = false`) preserva histórico; exclusão física bloqueada (`HTTP 409`) quando há vínculos; sem expiração/TTL automático |
| Observability | Coberto por logs estruturados de erros no `ExceptionMapper` RFC 9457 e health checks Quarkus SmallRye Health (`/q/health`) |
| External-dependency failure | N/A because a Fase 1 não consome APIs externas (apenas PostgreSQL local/container) |
| State-transition integrity | Coberto por `TXN-02` e `TXN-03`: `SETTLED` preenche `paymentDate`; reversão de `SETTLED` limpa `paymentDate`; `monthlyBudgetId` imutável; propagação de recorrência nunca altera `SETTLED` |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Nome do produto e package base | Produto **Lumo**, package `io.github.tiaggofg.lumo` | Alinhado ao nome do repositório `lumo-app` | y |
| Stack Backend | Java 25 + Quarkus 3.33 LTS (`3.33.4.2`) + Maven + PostgreSQL + Liquibase | Menor consumo de RAM em deploy enxuto, LTS com Java 25, pronto para Native Image | y |
| Totais do `MonthlyBudget` | Calculados via Read Model/Query (não persistidos no agregado) | Mantém `MonthlyBudget` e `Transaction` como agregados independentes sem acoplamento transacional | y |
| Status de liquidação | `ESTIMATED`, `PENDING`, `SETTLED` (UI: Pago/Recebido) com Previsto vs. Realizado | Enum neutro no domínio e visibilidade completa de caixa planejado e pago | y |
| Seed inicial de `Beneficiary` | Apenas `Família` via Liquibase | Evita nomes pessoais hardcoded no repositório; demais membros cadastrados pela UI | y |
| Seed inicial de `Category` | Categorias padrão de `EXPENSE` e `INCOME` via Liquibase | Permite uso imediato após subir o ambiente sem setup manual obrigatório | y |
| Ordenação padrão de transações no mês | `dueDate ASC NULLS LAST, createdAt ASC` | Garante leitura previsível de vencimentos primeiro e ordem de lançamento para itens sem data | y |
| Mês atual para propagação/materialização | Calculado via `Clock` injetável (timezone configurável `America/Sao_Paulo`, padrão `YearMonth.now(clock)`) | Permite testes determinísticos sem dependência do relógio do host | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Gerenciar Categorias e Beneficiários (`CAT-01`, `BEN-01`) ⭐ MVP

**User Story**: Como usuário do Lumo, quero cadastrar, editar, desativar e excluir categorias e beneficiários para classificar e filtrar meus lançamentos sem erros de digitação.

**Why P1**: Categorias e beneficiários alimentam os formulários de transações, recorrências, filtros e gráficos do orçamento mensal.

**Acceptance Criteria**:

1. The system SHALL seed via Liquibase default `EXPENSE` categories (`Moradia`, `Contas Básicas`, `Cartão de Crédito`, `Saúde`, `Educação`, `Alimentação`, `Transporte`, `Lazer`, `Outros`), default `INCOME` categories (`Salário`, `Renda Extra`, `Outros`) and the default beneficiary `Família`.
2. WHEN a user creates a `Category` with a non-blank `name` (max 80 chars), valid `type` (`INCOME` or `EXPENSE`), and optional `color` (hex `#RRGGBB`) and `icon` (max 50 chars) THEN the system SHALL persist the category with a domain-generated `UUID` and `active = true` and return HTTP `201`.
3. IF a user creates or updates a `Category` with a `name` that already exists for the same `type` (case-insensitive) THEN the system SHALL reject the request with HTTP `409` in RFC 9457 `application/problem+json` format.
4. WHEN a user deactivates a `Category` THEN the system SHALL set `active = false`, preserve existing links in historical `Transaction` and `RecurringTransaction` records, and exclude it from active-only selector queries.
5. IF a user requests physical deletion of a `Category` referenced by any `Transaction` or `RecurringTransaction` THEN the system SHALL reject the request with HTTP `409` in RFC 9457 format.
6. WHEN a user creates a `Beneficiary` with a non-blank unique `name` (max 80 chars, case-insensitive) THEN the system SHALL persist the beneficiary with a domain-generated `UUID` and `active = true` and return HTTP `201`.
7. IF a user requests physical deletion of a `Beneficiary` referenced by any `Transaction` or `RecurringTransaction` THEN the system SHALL reject the request with HTTP `409` in RFC 9457 format.

**Independent Test**: Criar uma categoria `Pets` (`EXPENSE`), um beneficiário `Tiago`, desativar e reativar ambos via API, e verificar HTTP `409` ao tentar excluir qualquer um após vinculá-lo a uma transação.

---

### P1: Gerenciar Orçamentos Mensais (`BUD-01`, `BUD-02`) ⭐ MVP

**User Story**: Como usuário do Lumo, quero criar, listar, visualizar e excluir orçamentos mensais para acompanhar o total previsto e realizado de cada mês de forma independente.

**Why P1**: O `MonthlyBudget` é o contêiner central que substitui cada aba mensal da planilha.

**Acceptance Criteria**:

1. WHEN a user creates a `MonthlyBudget` for a valid `competenceMonth` (`YYYY-MM`) THEN the system SHALL persist the budget with a domain-generated `UUID`, materialize all eligible active `RecurringTransaction` rules for that month in the same transaction, and return HTTP `201` with the budget summary.
2. IF a user attempts to create a `MonthlyBudget` for a `competenceMonth` that already exists THEN the system SHALL reject the request with HTTP `409` in RFC 9457 format.
3. WHEN a user lists all `MonthlyBudget` records THEN the system SHALL return them ordered by `competenceMonth` descending, each containing dynamically computed `plannedIncome`, `realizedIncome`, `plannedExpense`, `realizedExpense`, `plannedBalance` (`plannedIncome - plannedExpense`), and `realizedBalance` (`realizedIncome - realizedExpense`).
4. WHEN a user retrieves a `MonthlyBudget` by `id` THEN the system SHALL return HTTP `200` with its computed summary (Previsto e Realizado), transaction counts by status, and expense/income breakdowns grouped by `Category` and by `Beneficiary`.
5. The system SHALL keep every `MonthlyBudget` independent from previous months without carrying over balances automatically.
6. IF a user requests deletion of a `MonthlyBudget` that has one or more associated `Transaction` records THEN the system SHALL reject the request with HTTP `409` in RFC 9457 format.
7. WHEN a user deletes a `MonthlyBudget` that has zero associated `Transaction` records THEN the system SHALL remove the budget (and any suppression rows scoped to it) and return HTTP `204`.

**Independent Test**: Criar o orçamento `2026-11`, verificar HTTP `409` ao duplicar `2026-11`, consultar o resumo zerado (`plannedBalance = 0.00`), e excluir com sucesso enquanto vazio (`HTTP 204`).

---

### P1: Gerenciar Transações Manuais e Liquidação (`TXN-01`, `TXN-02`, `TXN-03`) ⭐ MVP

**User Story**: Como usuário do Lumo, quero lançar receitas e despesas em um orçamento mensal, dar baixa com 1 clique, ajustar valores estimados e filtrar lançamentos para substituir o controle manual da planilha.

**Why P1**: Sem lançamentos, filtros e controle de status (`ESTIMATED`, `PENDING`, `SETTLED`) o orçamento não tem dados reais.

**Acceptance Criteria**:

1. WHEN a user creates a `Transaction` in an existing `MonthlyBudget` with `type` (`INCOME` or `EXPENSE`), non-blank `description` (max 140 chars), `amount > 0` (BRL, scale 2), `status` (`ESTIMATED`, `PENDING`, or `SETTLED`), and optional `dueDate`, `paymentDate`, `notes` (max 500 chars), `categoryId`, and `beneficiaryId` THEN the system SHALL persist the transaction and return HTTP `201`.
2. IF a user submits a `Transaction` with `amount <= 0`, blank `description`, non-existent `monthlyBudgetId`, or a `categoryId` whose `type` does not match the transaction `type` THEN the system SHALL reject the request with HTTP `400` (or `404` for unknown budget) in RFC 9457 format.
3. The system SHALL enforce immutability of `monthlyBudgetId` after `Transaction` creation and reject update attempts targeting a different budget with HTTP `400`.
4. WHEN a `Transaction` transitions to `SETTLED` without an explicit `paymentDate` THEN the system SHALL automatically populate `paymentDate` with the current date from the application `Clock`.
5. WHEN a `Transaction` reverts from `SETTLED` to `PENDING` or `ESTIMATED` THEN the system SHALL clear `paymentDate` to `null`.
6. WHILE a `Transaction` has status `ESTIMATED`, WHEN a user invokes `confirm-estimate` with a new `amount > 0`, target status (`PENDING` or `SETTLED`), and optional `updateRecurringTemplate = true` THEN the system SHALL update the transaction amount and status, and WHERE `updateRecurringTemplate = true` and `sourceRecurringTransactionId` is present the system SHALL update the source `RecurringTransaction` default amount in the same transaction.
7. WHEN a user queries `GET /api/v1/budgets/{budgetId}/transactions` with any combination of `type`, `status`, `categoryId`, `beneficiaryId`, and `search` (case-insensitive substring over `description` and `notes`) THEN the system SHALL return matching transactions ordered by `dueDate ASC NULLS LAST, createdAt ASC`.
8. The system SHALL compute `plannedIncome` and `plannedExpense` summing `ESTIMATED + PENDING + SETTLED`, and `realizedIncome` and `realizedExpense` summing `SETTLED` only.

**Independent Test**: Lançar uma receita `Salário` (`6362.29`, `SETTLED`), uma despesa `Aluguel` (`800.00`, `SETTLED`), `Dentista - Jéssica` (`150.00`, `PENDING`) e `Água` (`180.00`, `ESTIMATED`); confirmar que `plannedExpense = 1130.00`, `realizedExpense = 800.00`; confirmar estimativa de `Água` para `195.64` (`PENDING`); marcar como `SETTLED` e validar `paymentDate` preenchido; reverter para `PENDING` e validar `paymentDate = null`.

---

### P1: Gerenciar Transações Recorrentes e Materialização (`REC-01`, `REC-02`, `REC-03`, `REC-04`) ⭐ MVP

**User Story**: Como usuário do Lumo, quero cadastrar regras de recorrência (fixas, estimadas, com mês de término e parceladas) para que os lançamentos apareçam automaticamente em cada orçamento mensal sem retrabalho e sem corromper o passado.

**Why P1**: O principal diferencial do Lumo sobre a planilha é automatizar contas fixas, contas variáveis e parcelamentos/prazos como *"Até Novembro"*.

**Acceptance Criteria**:

1. WHEN a user creates an active `RecurringTransaction` with `recurrenceType` in `{INDEFINITE, FIXED_TERM, INSTALLMENT}`, `amountType` in `{FIXED, ESTIMATED}`, `amount > 0`, `startMonth`, and optional `dueDay` (`1..31`) THEN the system SHALL validate mode invariants (`FIXED_TERM` requires `endMonth >= startMonth`; `INSTALLMENT` requires `totalInstallments >= 2` and `1 <= startingInstallment <= totalInstallments`) and return HTTP `201`.
2. WHEN a `RecurringTransaction` is materialized into an eligible `MonthlyBudget` THEN the system SHALL set status to `PENDING` if `amountType = FIXED` or `ESTIMATED` if `amountType = ESTIMATED`, compute `dueDate` clamping `dueDay` to the last valid day of that `CompetenceMonth` (e.g., day `31` in `2026-02` becomes `2026-02-28`), and populate `installment` (`current = startingInstallment + monthsBetween(startMonth, competenceMonth)`, `total = totalInstallments`) only when `recurrenceType = INSTALLMENT`.
3. WHEN a user creates a new active `RecurringTransaction` THEN the system SHALL automatically materialize it into all existing `MonthlyBudget` records where `competenceMonth >= currentMonth` and the rule is eligible for `competenceMonth`, without creating duplicates.
4. WHEN a user updates a `RecurringTransaction` with `propagateToOpenTransactions = false` (default) THEN the system SHALL update only the rule for future materializations without modifying any already materialized `Transaction`.
5. WHERE `propagateToOpenTransactions = true` on a `RecurringTransaction` update, WHEN the update succeeds THEN the system SHALL update `description`, `amount`, `categoryId`, `beneficiaryId`, `notes`, and `dueDate` on linked `Transaction` records whose status is `ESTIMATED` or `PENDING` and whose budget has `competenceMonth >= currentMonth`, never modifying any `SETTLED` transaction or past-month transaction.
6. WHEN a user deactivates a `RecurringTransaction` THEN the system SHALL set `active = false` so no future `MonthlyBudget` materializes it, and WHERE `removeFutureOpenTransactions = true` the system SHALL delete linked `Transaction` records in status `ESTIMATED` or `PENDING` belonging to budgets with `competenceMonth >= currentMonth`.
7. IF a user requests physical deletion of a `RecurringTransaction` that has ever generated a `Transaction` THEN the system SHALL reject the request with HTTP `409` in RFC 9457 format; otherwise the system SHALL delete it and return HTTP `204`.
8. WHEN a user deletes a materialized `Transaction` (one with `sourceRecurringTransactionId != null`) THEN the system SHALL record `(monthlyBudgetId, sourceRecurringTransactionId)` in `recurring_occurrence_exclusions` so subsequent materializations never recreate it for that month.

**Independent Test**: Criar 3 recorrências (`Aluguel` `INDEFINITE`/`FIXED`/`dueDay=31`, `Dentista - Tiago` `FIXED_TERM` até `2026-11`, `Cartão Sogra` `INSTALLMENT` 4/6 começando em `2026-11`); criar orçamento `2026-11` e validar 3 transações geradas com status, vencimento (`2026-11-30`) e parcela `4/6`; excluir `Aluguel` em `2026-11` e confirmar que não é recriada; editar `Aluguel` com `propagateToOpenTransactions = true` verificando preservação de `SETTLED`.

---

### P1: Interface Web de Orçamento Mensal, Recorrências e Cadastros (`UI-01`, `UI-02`, `UI-03`, `UI-04`) ⭐ MVP

**User Story**: Como usuário do Lumo, quero uma interface web limpa e responsiva em Angular com navegação clara entre Orçamentos Mensais, Recorrências e Cadastros para operar minhas finanças no desktop e dar baixas rápidas no celular.

**Why P1**: O usuário precisa substituir a planilha no dia a dia por uma UI ágil que cubra todas as operações do MVP.

**Acceptance Criteria**:

1. WHEN a user opens `/budgets` THEN the system SHALL display all monthly budgets ordered by most recent competence first with Previsto and Realizado summary indicators, an empty-state call-to-action when none exist, and a "Novo Orçamento" dialog to create a `YYYY-MM` budget and navigate straight into `/budgets/:id`.
2. WHEN a user opens `/budgets/:id` THEN the system SHALL render top summary cards (Receitas, Despesas e Saldo em Previsto vs. Realizado + barra de progresso de despesas pagas), filters (`type`, `status`, `categoryId`, `beneficiaryId`, `search`), and a responsive transaction list (table on desktop `>= 1024px`, stacked cards on mobile `< 768px`) with separate tabs/sections for `Todas`, `Despesas` and `Receitas`.
3. WHEN a user clicks the 1-click settle toggle on a transaction row in `/budgets/:id` THEN the system SHALL call `PATCH /api/v1/transactions/{id}/status` toggling between `PENDING`/`ESTIMATED` and `SETTLED` (displaying `Pago` for `EXPENSE` and `Recebido` for `INCOME`) and immediately refresh the budget summary cards.
4. WHILE a transaction row has status `ESTIMATED`, WHEN the user clicks "Confirmar valor" THEN the system SHALL open a quick dialog to input the actual BRL value, choose `PENDING` or `SETTLED`, optionally check "Atualizar valor padrão da recorrência" (when linked), submit `PATCH /api/v1/transactions/{id}/confirm-estimate`, and refresh the budget view.
5. WHEN a user opens `/recurrences` THEN the system SHALL list all `RecurringTransaction` rules with badges for `type`, `recurrenceType` (including `endMonth` or `startingInstallment/totalInstallments`) and `amountType`, and support create, edit (with opt-in checkbox "Propagar alterações para lançamentos em aberto"), deactivate (with opt-in checkbox "Remover lançamentos futuros em aberto"), activate and delete (with confirmation dialog and RFC 9457 error feedback on `409`).
6. WHEN a user opens `/catalog` THEN the system SHALL provide tabs for `Categorias` and `Beneficiários` supporting create, edit, active/inactive toggle, and physical delete with confirmation dialog and RFC 9457 feedback when blocked (`409`).
7. WHILE any API call is in progress or fails THEN the system SHALL show explicit loading states and toast/inline error feedback derived from the RFC 9457 `detail` message without silent failures.

**Independent Test**: Abrir o app no navegador (desktop `1440x900` e mobile `390x844`), criar uma recorrência estimada (`Água`), criar o orçamento do mês, confirmar o valor real de `Água`, dar baixa em 1 clique e verificar atualização dos cards Previsto vs. Realizado sem erros de console.

---

### P2: Gráficos Resumidos por Categoria e Beneficiário e Alternância de Tema (`UI-05`, `UI-06`)

**User Story**: Como usuário do Lumo, quero visualizar gráficos leves de despesas por categoria e por beneficiário dentro do mês e alternar entre Light Mode e Dark Mode para analisar para onde vai o dinheiro com conforto visual.

**Why P2**: Melhora leitura analítica e conforto visual sobre os mesmos dados já entregues nas P1.

**Acceptance Criteria**:

1. WHEN a user views `/budgets/:id` with at least one `EXPENSE` transaction THEN the system SHALL render two lightweight charts (breakdown by `Category` and breakdown by `Beneficiary`, grouping uncategorized items under `Sem categoria` / `Sem beneficiário`) reflecting the computed breakdown returned by `GET /api/v1/budgets/{id}`.
2. WHEN a user clicks the theme toggle button in the application shell THEN the system SHALL switch between Light Mode (default) and Dark Mode, apply the corresponding Tailwind/PrimeNG theme class immediately, and persist the preference in `localStorage`.

**Independent Test**: No detalhe de um orçamento com despesas em 2 categorias e 2 beneficiários, verificar ambos os gráficos renderizados com os valores corretos e alternar para Dark Mode recarregando a página para confirmar persistência.

---

## Edge Cases

- IF a `RecurringTransaction` has `dueDay = 31` and is materialized into `2026-02` (28 days) or `2028-02` (29 days) THEN the system SHALL set `dueDate` to `2026-02-28` or `2028-02-29` respectively without throwing a date error.
- IF a `RecurringTransaction` of mode `INSTALLMENT` has `startMonth = 2026-11`, `totalInstallments = 6` and `startingInstallment = 4` THEN the system SHALL materialize `4/6` in `2026-11`, `5/6` in `2026-12`, `6/6` in `2027-01`, and SHALL NOT materialize in `2027-02`.
- IF a `RecurringTransaction` of mode `FIXED_TERM` has `startMonth = 2026-09` and `endMonth = 2026-11` THEN the system SHALL materialize in `2026-09`, `2026-10` and `2026-11` with `installment = null`, and SHALL NOT materialize in `2026-12`.
- IF a user creates a `RecurringTransaction` whose `startMonth` is in a past month (`competenceMonth < currentMonth`) that already has a `MonthlyBudget` THEN the system SHALL NOT retroactively materialize transactions into past budgets, materializing only in existing budgets with `competenceMonth >= currentMonth`.
- IF two concurrent requests attempt to create a `MonthlyBudget` for the same `competenceMonth` THEN the database unique constraint SHALL prevent duplication and the losing request SHALL receive HTTP `409` in RFC 9457 format.
- IF a user sends a `Category` or `Beneficiary` ID that does not exist when creating a `Transaction` or `RecurringTransaction` THEN the system SHALL reject the request with HTTP `404` in RFC 9457 format.
- IF a user attempts to assign an inactive `Category` or inactive `Beneficiary` to a newly created `Transaction` or `RecurringTransaction` THEN the system SHALL reject the request with HTTP `422` in RFC 9457 format.
- IF a user edits a `Transaction` that already references a now-inactive `Category` or `Beneficiary` without changing that reference THEN the system SHALL allow the update to preserve historical integrity.
- IF a `MonthlyBudget` has zero transactions THEN the system SHALL return `0.00` for all six summary amounts (`plannedIncome`, `realizedIncome`, `plannedExpense`, `realizedExpense`, `plannedBalance`, `realizedBalance`) and empty arrays for category and beneficiary breakdowns.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| CAT-01 | P1: Gerenciar Categorias e Beneficiários | Tasks | In Tasks |
| BEN-01 | P1: Gerenciar Categorias e Beneficiários | Tasks | In Tasks |
| BUD-01 | P1: Gerenciar Orçamentos Mensais | Tasks | In Tasks |
| BUD-02 | P1: Gerenciar Orçamentos Mensais | Tasks | In Tasks |
| TXN-01 | P1: Gerenciar Transações Manuais e Liquidação | Tasks | In Tasks |
| TXN-02 | P1: Gerenciar Transações Manuais e Liquidação | Tasks | In Tasks |
| TXN-03 | P1: Gerenciar Transações Manuais e Liquidação | Tasks | In Tasks |
| REC-01 | P1: Gerenciar Transações Recorrentes e Materialização | Tasks | In Tasks |
| REC-02 | P1: Gerenciar Transações Recorrentes e Materialização | Tasks | In Tasks |
| REC-03 | P1: Gerenciar Transações Recorrentes e Materialização | Tasks | In Tasks |
| REC-04 | P1: Gerenciar Transações Recorrentes e Materialização | Tasks | In Tasks |
| UI-01 | P1: Interface Web de Orçamento Mensal, Recorrências e Cadastros | Tasks | In Tasks |
| UI-02 | P1: Interface Web de Orçamento Mensal, Recorrências e Cadastros | Tasks | In Tasks |
| UI-03 | P1: Interface Web de Orçamento Mensal, Recorrências e Cadastros | Tasks | In Tasks |
| UI-04 | P1: Interface Web de Orçamento Mensal, Recorrências e Cadastros | Tasks | In Tasks |
| UI-05 | P2: Gráficos Resumidos por Categoria e Beneficiário e Alternância de Tema | Tasks | In Tasks |
| UI-06 | P2: Gráficos Resumidos por Categoria e Beneficiário e Alternância de Tema | Tasks | In Tasks |

**Coverage:** 17 total, 17 mapped to tasks, 0 unmapped.

---

## Sources

- `.specs/features/01-lumo-mvp/context.md` - Decisões consolidadas das 4 rodadas de entrevista + fechamento arquitetural (Quarkus 3.33 LTS, Maven, package `io.github.tiaggofg.lumo`).
- `.specs/STATE.md` - Decisões arquiteturais `AD-001` a `AD-008`.
- Planilha real do usuário fornecida no prompt inicial (13 despesas mensais somando `R$ 6.178,42`, pagamento `R$ 6.362,29`, saldo `R$ 183,87`, casos "Até Novembro", contas variáveis e múltiplos cartões).

---

## Success Criteria

- [ ] Todos os 13 itens da planilha real do usuário podem ser modelados no Lumo (fixos, variáveis estimados, `FIXED_TERM` "Até Novembro", faturas com `notes`) produzindo exatamente `plannedExpense = 6178.42`, `plannedIncome = 6362.29` e `plannedBalance = 183.87`.
- [ ] Ao criar o orçamento do mês seguinte, 100% das recorrências elegíveis são materializadas automaticamente sem duplicação e sem recriar ocorrências encerradas ou excluídas pontualmente.
- [ ] Todas as camadas passam na suíte ArchUnit (zero imports Quarkus/CDI/JPA em `domain`), testes unitários puros, testes de integração com Testcontainers (PostgreSQL + Liquibase), testes unitários Angular e E2E Playwright (desktop e mobile) sem erros de console.
