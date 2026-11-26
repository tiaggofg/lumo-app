# Lumo MVP — Decision Context

Registro consolidado das decisões tomadas nas 4 rodadas de entrevista + fechamento arquitetural em 2026-11-26.

## Identidade e Escopo
- **Produto**: **Lumo** (`lumo-app`), gerenciador financeiro pessoal/familiar para substituir planilha mensal.
- **Package base**: `io.github.tiaggofg.lumo`.
- **Estrutura**: Monorepo (`backend/`, `frontend/`, `docker-compose.yml` na raiz).
- **Fase 1 (MVP)**: Orçamentos mensais, lançamentos manuais (receitas e despesas), recorrências (fixas, estimadas/variáveis, prazo definido e parceladas), categorias e beneficiários gerenciáveis, gráficos leves por categoria/beneficiário e interface web Angular responsiva com Light/Dark mode.
- **Fases futuras (fora do escopo do MVP, sem bloqueios arquiteturais)**: Autenticação/Household, entidade `CreditCard` com faturas detalhadas, importação OFX/CSV/PDF, projeção futura mês a mês e classificação automática via ML/LLM.

## Decisões de Domínio (Rodadas 1 e 2)
- **Cartões na Fase 1**: Lançamentos manuais de fatura (`Transaction` normal com `notes` livre).
- **Receitas e Carryover**: Múltiplas `Transaction` do tipo `INCOME` (podendo ser recorrentes). Cada `MonthlyBudget` é independente (sem carryover automático).
- **Datas**: `dueDate` opcional; `paymentDate` preenchido automaticamente com a data atual ao marcar `SETTLED` (editável) e limpo ao reverter para `PENDING` ou `ESTIMATED`.
- **Totais do Orçamento**: Calculados dinamicamente via Read Model/Query (`MonthlyBudget` não persiste totais).
- **Status e Métricas**: Enum neutro `ESTIMATED`, `PENDING`, `SETTLED` (UI exibe *Pago* para `EXPENSE` e *Recebido* para `INCOME`). Exibir **Previsto** (`ESTIMATED + PENDING + SETTLED`) e **Realizado** (`SETTLED`).
- **Ciclo de Vida do `MonthlyBudget`**: Único por `CompetenceMonth` (`YearMonth`), sempre editável; exclusão bloqueada (`HTTP 409`) se existirem transações vinculadas.
- **Valor Monetário (`Money`)**: Sempre `BRL`, escala 2, estritamente positivo (`> 0`).
- **Modos de `RecurringTransaction`**:
  - `INDEFINITE`: sem data de término.
  - `FIXED_TERM`: `startMonth` até `endMonth` inclusivo, sem contador de parcela (ex: *"Até Novembro"*).
  - `INSTALLMENT`: `startMonth`, `totalInstallments` (`>= 2`) e `startingInstallment` opcional (padrão `1`) para parcelamentos já em andamento.
- **Contas Estimadas vs. Fixas**: `amountType` = `FIXED` (materializa `PENDING`) ou `ESTIMATED` (materializa `ESTIMATED`). Ao confirmar valor real de uma transação `ESTIMATED`, permite transicionar para `PENDING` (ou `SETTLED`) e opcionalmente atualizar o valor padrão do template.
- **`dueDay`**: Opcional (`1..31`) na `RecurringTransaction`, ajustando automaticamente para o último dia em meses mais curtos.
- **Materialização**: Automática ao criar um `MonthlyBudget` + automática nos budgets elegíveis já existentes (mês atual e futuros) ao criar uma `RecurringTransaction`, sem duplicar.
- **Edição de `RecurringTransaction`**: Afeta futuras materializações por padrão; oferece opção explícita para propagar a transações abertas (`ESTIMATED`/`PENDING`) de meses atuais/futuros; nunca altera `SETTLED`.
- **Desativação e Exclusão de `RecurringTransaction`**: Desativação (`INACTIVE`) preserva histórico com opção para remover futuras não liquidadas (`ESTIMATED`/`PENDING`); exclusão física permitida somente se nunca gerou transações (`HTTP 409` caso contrário).
- **Exclusão Pontual & Imutabilidade**: Excluir manualmente uma transação materializada impede recriação automática naquele mês. `monthlyBudgetId` é imutável após criação.

## Decisões de Catálogo, API e Stack (Rodada 3 + Fechamento)
- **`Category`**: Entidade gerenciável (CRUD com `name`, `type` `INCOME`/`EXPENSE`, `color` e `icon` opcionais, `active`), seed inicial via Liquibase, opcional na transação; soft-disable permitido e exclusão física bloqueada (`HTTP 409`) se em uso.
- **`Beneficiary`**: Entidade gerenciável (CRUD com `name`, `active`), seed inicial apenas `Família`, opcional na transação; soft-disable permitido e exclusão física bloqueada (`HTTP 409`) se em uso.
- **Segurança Fase 1**: Sem autenticação.
- **Backend**: Java 25 + **Quarkus 3.33 LTS (`3.33.4.2`)** + **Maven (`pom.xml`)** + PostgreSQL + Liquibase (SQL formatado) + Clean Architecture + DDD (`domain` puro, estereótipos próprios, `@Command`/`@Query`).
- **API**: REST `/api/v1`, UUIDs gerados no domínio, erros RFC 9457 (`application/problem+json`), OpenAPI/Swagger.

## Decisões de Frontend, UX e Qualidade (Rodada 4)
- **Frontend**: Angular v22 (Standalone + Signals) + Tailwind CSS + PrimeNG v22 + estado via Signals/Services.
- **Experiência do Orçamento**: Cards Previsto vs. Realizado no topo, filtros, toggle 1-clique para Pago/Recebido, ajuste rápido de valor estimado, abas/seções Despesas e Receitas e gráficos leves por categoria e beneficiário.
- **Telas MVP**: 4 áreas — Orçamentos Mensais (lista + detalhe com gráficos), Recorrências, Cadastros (Categorias e Beneficiários).
- **Layout & Tema**: Desktop-first responsivo (cards adaptados no mobile), Light Mode padrão + toggle Dark Mode.
- **Testes**: Pirâmide completa — Unitários puros (`domain`/`application`) + ArchUnit + Integração com Testcontainers (PostgreSQL + Liquibase + API) + Unitários Angular + E2E Playwright.
