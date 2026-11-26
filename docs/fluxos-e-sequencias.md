# Fluxos e Diagramas de Sequência

## 1. Criação de Orçamento Mensal + Materialização Automática

```mermaid
sequenceDiagram
  actor U as Usuário
  participant FE as Angular SPA
  participant API as BudgetResource
  participant UC as CreateMonthlyBudgetUseCase
  participant MAT as RecurringMaterializationService
  participant DB as PostgreSQL

  U->>FE: Criar orçamento (YYYY-MM)
  FE->>API: POST /api/v1/budgets
  API->>UC: execute("2026-11")
  UC->>DB: Persistir MonthlyBudget (UNIQUE competence_month)
  UC->>MAT: materializeAllEligibleForBudget(budget)
  MAT->>DB: Buscar recorrências ativas e gravar Transactions elegíveis
  UC->>DB: Consultar resumo via BudgetReadModelPort
  API-->>FE: 201 Created (id, materializedCount, summary)
  FE-->>U: Redireciona para /budgets/:id
```

## 2. Confirmação de Estimativa + Atualização Opcional de Template

```mermaid
sequenceDiagram
  actor U as Usuário
  participant FE as Angular SPA
  participant API as TransactionResource
  participant UC as ConfirmEstimateUseCase
  participant DB as PostgreSQL

  U->>FE: Confirmar valor real (ex: Água R$ 195,64)
  FE->>API: PATCH /api/v1/transactions/{id}/confirm-estimate
  API->>UC: execute(amount, targetStatus, updateRecurringTemplate)
  UC->>DB: Atualizar Transaction (amount + status + paymentDate se SETTLED)
  opt updateRecurringTemplate == true
    UC->>DB: Atualizar valor padrão em RecurringTransaction
  end
  API-->>FE: 200 OK
  FE-->>U: Atualiza lista e cards Previsto vs. Realizado
```
