# Arquitetura e Diagramas C4

## 1. Diagrama de Contexto (C1)

```mermaid
flowchart LR
  User["Usuário (Desktop / Mobile)"] --> Lumo["Lumo (Controle Financeiro Pessoal/Familiar)"]
```

## 2. Diagrama de Containers (C2)

```mermaid
flowchart TB
  SPA["Frontend SPA — Angular v22 + ZardUI (100% MIT) + Tailwind CSS v4"] -->|HTTP JSON + HttpOnly Cookies /api/v1| API["Backend API — Java 25 + Quarkus 3.33 LTS"]
  API -->|OAuth 2.0 + PKCE / JWKS RS256| Google["Google Identity"]
  API -->|JDBC / Liquibase| DB[("PostgreSQL 17 (lumo_db)")]
```

## 3. Componentes e Camadas (C3)

```mermaid
flowchart TD
  FILTER["infrastructure.auth (AuthRequestFilter + AuthResource + GoogleOAuthHttpClient + JwtTokenService)"] --> REST["infrastructure.web (Jakarta REST + RFC 9457 Mapper)"]
  FILTER --> CMD["application (@Command Use Cases — Financeiro & Auth)"]
  REST --> CMD
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

## 4. Arquitetura do Frontend (`AD-009`, `AD-010`, `AD-012`)

```mermaid
flowchart LR
  Shell["AppShellComponent (h-dvh Sticky Dark Sidebar + Collapsible w-20 Rail + Compact Footer + UserProfilePopoverComponent + <app-lumo-logo>)"] --> Dash["/dashboard — DashboardPageComponent (KPIs + 4 <z-chart-container> shadcn Charts)"]
  Shell --> Budgets["/budgets — BudgetListPageComponent"]
  Shell --> Detail["/budgets/:id — BudgetDetailPageComponent (Tabela + [zTooltip] Status 1-clique)"]
  Shell --> Rec["/recurrences — RecurrencesPageComponent"]
  Shell --> Cat["/catalog — CatalogPageComponent"]
  Shell --> ZUI["shared/ui/ — ZardUI Primitives (z-button, z-dialog, z-confirm-dialog, z-toast-viewport, z-select, z-input-number)"]
  Dash --> Store["BudgetsStoreService (Signals)"]
  Budgets --> Store
  Detail --> Store
  Dash --> Palette["chart-palette.ts (LUMO_CHART_PALETTE 10 cores sem verde)"]
```
