# Modelo de Domínio e Dados

## 1. Diagrama de Classes / Agregados

```mermaid
classDiagram
  class MonthlyBudget {
    +UUID id
    +CompetenceMonth competenceMonth
  }
  class Transaction {
    +UUID id
    +UUID monthlyBudgetId
    +TransactionType type
    +String description
    +Money amount
    +TransactionStatus status
    +LocalDate dueDate
    +LocalDate paymentDate
    +Installment installment
  }
  class RecurringTransaction {
    +UUID id
    +TransactionType type
    +Money amount
    +RecurrenceAmountType amountType
    +RecurrenceType recurrenceType
    +CompetenceMonth startMonth
    +CompetenceMonth endMonth
    +Integer dueDay
    +boolean active
    +boolean hasGeneratedTransactions
    +isEligibleFor(CompetenceMonth) boolean
    +materializeFor(UUID, CompetenceMonth, Instant) Transaction
  }
  class Category {
    +UUID id
    +String name
    +TransactionType type
    +String color
    +String icon
    +boolean active
  }
  class Beneficiary {
    +UUID id
    +String name
    +boolean active
  }
  class User {
    +UUID id
    +String googleSub
    +String email
    +String name
    +String avatarUrl
    +boolean active
  }
  class RefreshSession {
    +UUID id
    +UUID userId
    +String tokenHash
    +Instant expiresAt
    +Instant revokedAt
    +isUsableAt(Instant) boolean
  }
  RecurringTransaction ..> Transaction : materializes
  User "1" --> "*" RefreshSession : owns
```

## 2. Modelo de Persistência (ER PostgreSQL)

```mermaid
erDiagram
  USERS ||--o{ REFRESH_SESSIONS : owns
  CATEGORIES ||--o{ TRANSACTIONS : classifies
  BENEFICIARIES ||--o{ TRANSACTIONS : assigns
  CATEGORIES ||--o{ RECURRING_TRANSACTIONS : classifies
  BENEFICIARIES ||--o{ RECURRING_TRANSACTIONS : assigns
  MONTHLY_BUDGETS ||--o{ TRANSACTIONS : contains
  RECURRING_TRANSACTIONS ||--o{ TRANSACTIONS : materializes
  MONTHLY_BUDGETS ||--o{ RECURRING_OCCURRENCE_EXCLUSIONS : suppresses
  RECURRING_TRANSACTIONS ||--o{ RECURRING_OCCURRENCE_EXCLUSIONS : excluded_from
```

## 3. Índices e Constraints Principais

- `users`: `UNIQUE (google_sub)` (`uq_users_google_sub`), `UNIQUE (email)` (`uq_users_email`)
- `refresh_sessions`: `UNIQUE (token_hash)` (`uq_refresh_sessions_token_hash`), `FK user_id -> users(id) ON DELETE CASCADE`, índices `idx_refresh_sessions_user_id` e `idx_refresh_sessions_expires_at`

- `categories`: `UNIQUE (LOWER(name), type)`
- `beneficiaries`: `UNIQUE (LOWER(name))`
- `monthly_budgets`: `UNIQUE (competence_month)`, `CHECK (competence_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')`
- `transactions`:
  - `uq_transactions_budget_recurring`: índice único parcial `UNIQUE (monthly_budget_id, source_recurring_transaction_id) WHERE source_recurring_transaction_id IS NOT NULL`
  - `idx_transactions_budget_type_status`: `(monthly_budget_id, type, status)`
  - `idx_transactions_budget_order`: `(monthly_budget_id, due_date ASC NULLS LAST, created_at ASC)`
- `recurring_occurrence_exclusions`: `PRIMARY KEY (monthly_budget_id, recurring_transaction_id)` com `ON DELETE CASCADE`.

## 4. Máquina de Estados (`TransactionStatus`)

```mermaid
stateDiagram-v2
  [*] --> ESTIMATED : Recorrência ESTIMATED ou manual
  [*] --> PENDING : Recorrência FIXED ou manual
  [*] --> SETTLED : Manual já liquidado (preenche paymentDate)
  ESTIMATED --> PENDING : confirm-estimate ou status
  ESTIMATED --> SETTLED : confirm-estimate ou 1-clique (preenche paymentDate)
  PENDING --> SETTLED : 1-clique (preenche paymentDate)
  SETTLED --> PENDING : Reversão (limpa paymentDate)
  SETTLED --> ESTIMATED : Reversão (limpa paymentDate)
```
