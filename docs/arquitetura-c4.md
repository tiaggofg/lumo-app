# Arquitetura e Diagramas C4

## 1. Diagrama de Contexto (C1)

```mermaid
flowchart LR
  User["Usuário (Desktop / Mobile)"] --> Lumo["Lumo (Controle Financeiro Pessoal/Familiar)"]
```

## 2. Diagrama de Containers (C2)

```mermaid
flowchart TB
  SPA["Frontend SPA — Angular v22 + PrimeNG + Tailwind"] -->|HTTP JSON /api/v1| API["Backend API — Java 25 + Quarkus 3.33 LTS"]
  API -->|JDBC / Liquibase| DB[("PostgreSQL 17 (lumo_db)")]
```

## 3. Componentes e Camadas (C3)

```mermaid
flowchart TD
  REST["infrastructure.web (Jakarta REST + RFC 9457 Mapper)"] --> CMD["application (@Command Use Cases)"]
  REST --> QRY["application (@Query Use Cases)"]
  CMD --> DOM["domain (Pure Java Aggregates, VOs, Repository Ports)"]
  QRY --> RMP["application (BudgetReadModelPort, TransactionQueryPort)"]
  DOM -.->|implemented by| JPA["infrastructure.persistence (JPA Adapters)"]
  RMP -.->|implemented by| SQL["infrastructure.persistence (SQL Read Models)"]
  JPA --> DB[("PostgreSQL 17")]
  SQL --> DB
```

### Fronteiras Verificadas por ArchUnit (`CleanArchitectureArchTest`)
- `domain..` não acessa `io.quarkus..`, `jakarta..`, `org.hibernate..`, `com.fasterxml..`, `application..` nem `infrastructure..`.
- `application..` não acessa `infrastructure..`, `jakarta.persistence..` nem `jakarta.ws.rs..`.
- `@Command` e `@Query` só podem ser usados em `..application..`.
- Nenhum `AggregateRoot` em `..domain..` pode possuir anotações JPA (`@Entity`, `@Table`).

## 4. Arquitetura do Frontend (`AD-008`, `AD-009`)

```mermaid
flowchart LR
  Shell["AppShellComponent (Full-Width w-full + Royal Indigo Nav)"] --> Dash["/dashboard — DashboardPageComponent (KPIs + 4 Gráficos Multicoloridos)"]
  Shell --> Budgets["/budgets — BudgetListPageComponent"]
  Shell --> Detail["/budgets/:id — BudgetDetailPageComponent (Tabela + Tooltip Status 1-clique)"]
  Shell --> Rec["/recurrences — RecurrencesPageComponent"]
  Shell --> Cat["/catalog — CatalogPageComponent"]
  Dash --> Store["BudgetsStoreService (Signals)"]
  Budgets --> Store
  Detail --> Store
  Dash --> Palette["chart-palette.ts (LUMO_CHART_PALETTE 10 cores sem verde)"]
```
