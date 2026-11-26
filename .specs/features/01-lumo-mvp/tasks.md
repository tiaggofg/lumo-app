# Lumo MVP Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, the walk, check_proofs, the Verifier and the screens sub-agent).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/01-lumo-mvp/design.md`
**Status**: Approved
**Approved**: 2026-11-26 - user: "está aprovado"
**Build**: `cd backend && ./mvnw test-compile && cd ../frontend && npm run lint && npm run build`
**Run backend-unit**: `cd backend && ./mvnw test`
**Run backend-it**: `cd backend && ./mvnw verify -DskipUTs`
**Run frontend-unit**: `cd frontend && npm test -- --watch=false`
**Run e2e**: `cd frontend && npx playwright test --reporter=list`

---

## Test Coverage Matrix

> Generated from project guidelines (`AGENTS.md`, `.agents/rules/post-implementation-testing.md`, `.agents/rules/feature-naming-and-quality.md`) and `.specs/features/01-lumo-mvp/spec.md` - confirm before Execute.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Backend Domain (`domain/**`) | unit | All branches; 1:1 to spec ACs; all listed edge cases; pure Java without Quarkus | `backend/src/test/java/io/github/tiaggofg/lumo/domain/**/*Test.java` | `cd backend && ./mvnw test` |
| Backend Application (`application/**`) | unit | All use-case branches and error paths with in-memory fakes/mocks | `backend/src/test/java/io/github/tiaggofg/lumo/application/**/*Test.java` | `cd backend && ./mvnw test` |
| Backend Architecture (`architecture/**`) | unit | Clean Architecture layer boundaries and stereotype rules via ArchUnit | `backend/src/test/java/io/github/tiaggofg/lumo/architecture/*ArchTest.java` | `cd backend && ./mvnw test` |
| Backend Persistence & REST (`infrastructure/**`) | integration | Liquibase migrations, JPA/ReadModel queries, all REST routes (happy + edge + RFC 9457 errors) on Testcontainers PostgreSQL | `backend/src/test/java/io/github/tiaggofg/lumo/infrastructure/**/*IT.java` | `cd backend && ./mvnw verify -DskipUTs` |
| Frontend Services/Components (`frontend/src/**`) | unit | Signal stores, BRL/status pipes, dialog/form logic and error states | `frontend/src/app/**/*.spec.ts` | `cd frontend && npm test -- --watch=false` |
| Full-Stack UI Flows (`frontend/e2e/**`) | e2e | Desktop (`1440x900`) and mobile (`390x844`) critical flows with zero console errors | `frontend/e2e/**/*.spec.ts` | `cd frontend && npx playwright test --reporter=list` |
| Bootstrap / Config / Manifests | none | Build and lint gate only | `docker-compose.yml`, `backend/pom.xml`, `frontend/package.json` | build gate only |

## Gate Check Commands

> Generated from agreed stack (Maven + Quarkus 3.33 LTS + Angular v22 + Playwright) - confirm before Execute.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | After backend unit or frontend unit tasks | `cd backend && ./mvnw test` (backend) or `cd frontend && npm test -- --watch=false` (frontend) |
| Full | After backend integration or E2E tasks | `cd backend && ./mvnw verify` (backend) or `cd frontend && npx playwright test --reporter=list` (e2e) |
| Build | After phase completion or bootstrap/config-only tasks | `cd backend && ./mvnw test-compile && cd ../frontend && npm run lint && npm run build` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Backend Bootstrap, Stereotypes & Infra Guardrails

```
T1 → T2 → T3 → T4 → T5
```

### Phase 2: Catalog Module (Category & Beneficiary)

```
T5 → T6 → T7 → T8 → T9 → T10
```

### Phase 3: MonthlyBudget & Transaction Core

```
T10 → T11 → T12 → T13 → T14 → T15 → T16
```

### Phase 4: RecurringTransaction Engine & Materialization

```
T16 → T17 → T18 → T19 → T20 → T21
```

### Phase 5: Frontend Angular Foundation & Catalog UI

```
T21 → T22 → T23 → T24 → T25 → T26
```

### Phase 6: Frontend Budgets, Recurrences & Full-Stack E2E

```
T26 → T27 → T28 → T29 → T30 → T31 → T32
```

---

## Task Breakdown

### T1: Bootstrap monorepo Docker Compose and Quarkus 3.33 LTS Maven project

**What**: Create `docker-compose.yml` (PostgreSQL 17), `backend/pom.xml` (Java 25, Quarkus `3.33.4.2` BOM, REST Jackson, Hibernate ORM, PostgreSQL, Liquibase, SmallRye OpenAPI, SmallRye Health, JUnit 5, AssertJ, ArchUnit, RestAssured), Maven wrapper and `application.properties`.
**Where**: `backend/pom.xml`
**Depends on**: None
**Reuses**: `.specs/STATE.md` (`AD-001`, `AD-002`)
**Requirement**: BUD-01

**Done when**:
- [x] `docker-compose.yml` defines PostgreSQL 17 service for local development (`lumo_db`)
- [x] `backend/pom.xml` compiles on Java 25 with Quarkus `3.33.4.2` BOM and Maven wrapper (`./mvnw`)
- [x] `application.properties` configures Liquibase changelog path, OpenAPI/Swagger UI, CORS for `http://localhost:4200` and `lumo.timezone=America/Sao_Paulo`
- [x] Gate check passes: `cd backend && ./mvnw test-compile`

**Tests**: none
**Gate**: build
**Commit**: `build(backend): bootstrap quarkus 3.33 lts maven project`

---

### T2: Create DDD stereotypes, Application stereotypes and Clock/ReadOnly config

**What**: Implement `AggregateRoot<ID>`, `Entity<ID>`, `ValueObject` in `domain.stereotype`, `@Command`, `@Query`, `@ReadOnlyTransaction` in `application.stereotype`, plus `ReadOnlyTransactionInterceptor` and `ClockProducer` in `infrastructure.config`.
**Where**: `backend/src/main/java/io/github/tiaggofg/lumo/domain/stereotype/`
**Depends on**: T1
**Reuses**: `backend/pom.xml`
**Requirement**: BUD-01

**Done when**:
- [x] `domain.stereotype` contains zero Quarkus/Jakarta imports
- [x] `@Command` composes `@Stereotype`, `@ApplicationScoped`, `@Transactional`; `@Query` composes `@Stereotype`, `@ApplicationScoped`, `@Transactional(SUPPORTS)`, `@ReadOnlyTransaction`
- [x] `ClockProducer` produces a `Clock` configured from `lumo.timezone`
- [x] Unit tests verify stereotype annotations and `ClockProducer` timezone resolution
- [x] Gate check passes: `cd backend && ./mvnw test`
- [x] Test count: >= 4 tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(core): add ddd and application stereotypes with clock`

---

### T3: Implement DomainException hierarchy and RFC 9457 ProblemDetail mapper

**What**: Create pure domain exceptions (`DomainValidationException`, `ResourceNotFoundException`, `ResourceConflictException`, `BusinessRuleViolationException`) and `ProblemDetailExceptionMapper` returning `application/problem+json` for 400, 404, 409 (including PostgreSQL SQLState `23505`), 422 and 500.
**Where**: `backend/src/main/java/io/github/tiaggofg/lumo/infrastructure/web/error/`
**Depends on**: T2
**Reuses**: `backend/src/main/java/io/github/tiaggofg/lumo/domain/shared/`
**Requirement**: CAT-01

**Done when**:
- [x] All domain exceptions reside in `domain.shared` without framework imports
- [x] `ProblemDetailExceptionMapper` maps domain exceptions, Bean Validation errors and SQL unique violations (`23505`) to RFC 9457 JSON payloads with `type`, `title`, `status`, `detail`, `instance`
- [x] Unit tests cover every HTTP status mapping (`400`, `404`, `409`, `422`, `500`)
- [x] Gate check passes: `cd backend && ./mvnw test`
- [x] Test count: >= 6 tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(web): add rfc 9457 problem detail exception mapper`

---

### T4: Create Liquibase SQL formatted schema and initial catalog seed

**What**: Create `db.changelog-master.yaml`, `001-create-schema.sql` (all 6 tables, UUID PKs, FKs, unique/check constraints and composite indexes) and `002-seed-catalog.sql` (default EXPENSE/INCOME categories and beneficiary `Família`), verified with an integration test against Testcontainers PostgreSQL.
**Where**: `backend/src/main/resources/db/changelog/`
**Depends on**: T3
**Reuses**: `.specs/features/01-lumo-mvp/design.md`
**Requirement**: CAT-01, BEN-01

**Done when**:
- [x] Liquibase migrations apply cleanly from scratch on PostgreSQL 17
- [x] Partial unique index on `transactions (monthly_budget_id, source_recurring_transaction_id) WHERE source_recurring_transaction_id IS NOT NULL` is created
- [x] Seed inserts all 12 default categories (9 EXPENSE + 3 INCOME) and 1 default beneficiary (`Família`)
- [x] Integration test `LiquibaseMigrationIT` verifies schema, constraints and seed counts on Testcontainers PostgreSQL
- [x] Gate check passes: `cd backend && ./mvnw verify`
- [x] Test count: >= 3 integration tests pass

**Tests**: integration
**Gate**: full
**Commit**: `feat(db): add liquibase schema migrations and catalog seeds`

---

### T5: Add ArchUnit Clean Architecture and DDD guardrail suite

**What**: Create `CleanArchitectureArchTest` enforcing `domain` purity (no Quarkus/Jakarta/Hibernate/Jackson/application/infrastructure dependencies), `application` isolation (no infrastructure/JPA/JAX-RS), `@Command`/`@Query` package placement and no JPA annotations on `AggregateRoot` classes.
**Where**: `backend/src/test/java/io/github/tiaggofg/lumo/architecture/CleanArchitectureArchTest.java`
**Depends on**: T4
**Reuses**: `backend/src/main/java/io/github/tiaggofg/lumo/domain/stereotype/`
**Requirement**: BUD-01

**Done when**:
- [x] ArchUnit suite checks all 4 architecture rules defined in `design.md`
- [x] Gate check passes: `cd backend && ./mvnw test`
- [x] Test count: >= 4 ArchUnit tests pass

**Tests**: unit
**Gate**: build
**Commit**: `test(arch): add archunit clean architecture guardrail suite`

---

### T6: Implement Category Aggregate Root and repository port

**What**: Create `Category` Aggregate Root (`id`, `name`, `type`, `color`, `icon`, `active`), validation invariants (non-blank name <= 80, hex color `#RRGGBB`, icon <= 50), `update`/`deactivate`/`activate` methods and `CategoryRepository` port with pure domain unit tests.
**Where**: `backend/src/main/java/io/github/tiaggofg/lumo/domain/catalog/Category.java`
**Depends on**: T5
**Reuses**: `domain.stereotype.AggregateRoot`, `domain.shared.DomainValidationException`
**Requirement**: CAT-01

**Done when**:
- [x] `Category` enforces all field bounds and hex color validation
- [x] Pure unit tests cover creation, update, activation/deactivation and invalid inputs
- [x] Gate check passes: `cd backend && ./mvnw test`
- [x] Test count: >= 7 tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(catalog): implement category aggregate root and port`

---

### T7: Implement Beneficiary Aggregate Root and repository port

**What**: Create `Beneficiary` Aggregate Root (`id`, `name`, `active`), non-blank name <= 80 invariant, `rename`/`deactivate`/`activate` methods and `BeneficiaryRepository` port with pure domain unit tests.
**Where**: `backend/src/main/java/io/github/tiaggofg/lumo/domain/catalog/Beneficiary.java`
**Depends on**: T6
**Reuses**: `domain.stereotype.AggregateRoot`, `domain.shared.DomainValidationException`
**Requirement**: BEN-01

**Done when**:
- [x] `Beneficiary` enforces non-blank name and max length 80
- [x] Pure unit tests cover creation, rename, activation/deactivation and invalid inputs
- [x] Gate check passes: `cd backend && ./mvnw test`
- [x] Test count: >= 5 tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(catalog): implement beneficiary aggregate root and port`

---

### T8: Implement JPA adapters for Category and Beneficiary

**What**: Create `CategoryJpaEntity`, `BeneficiaryJpaEntity`, mappers and repository adapters implementing `CategoryRepository` and `BeneficiaryRepository` including case-insensitive uniqueness checks and reference-in-use checks (`isReferencedInAnyRecord`).
**Where**: `backend/src/main/java/io/github/tiaggofg/lumo/infrastructure/persistence/catalog/`
**Depends on**: T7
**Reuses**: `domain.catalog.CategoryRepository`, `domain.catalog.BeneficiaryRepository`
**Requirement**: CAT-01, BEN-01

**Done when**:
- [x] Adapters support filtered listing (`type`, `active`), case-insensitive name lookup and reference check across `transactions` and `recurring_transactions`
- [x] Integration tests verify CRUD, case-insensitive uniqueness and reference detection on PostgreSQL
- [x] Gate check passes: `cd backend && ./mvnw verify`
- [x] Test count: >= 6 integration tests pass

**Tests**: integration
**Gate**: full
**Commit**: `feat(catalog): add jpa persistence adapters for catalog`

---

### T9: Implement Category use cases and REST endpoints

**What**: Implement `@Command`/`@Query` use cases (`CreateCategory`, `UpdateCategory`, `ChangeCategoryStatus`, `DeleteCategory`, `ListCategories`) and `CategoryResource` (`/api/v1/categories`) with unit and REST integration tests.
**Where**: `backend/src/main/java/io/github/tiaggofg/lumo/infrastructure/web/catalog/CategoryResource.java`
**Depends on**: T8
**Reuses**: `domain.catalog.CategoryRepository`, `infrastructure.web.error.ProblemDetailExceptionMapper`
**Requirement**: CAT-01

**Done when**:
- [x] All `/api/v1/categories` endpoints (`GET`, `POST`, `PUT`, `PATCH /status`, `DELETE`) match `design.md`
- [x] Duplicate `(LOWER(name), type)` returns HTTP `409`; deleting referenced category returns HTTP `409`
- [x] Unit tests cover use cases and `CategoryResourceIT` covers happy, edge and error HTTP paths
- [x] Gate check passes: `cd backend && ./mvnw verify`
- [x] Test count: >= 8 tests pass

**Tests**: integration
**Gate**: full
**Commit**: `feat(catalog): expose category use cases and rest api`

---

### T10: Implement Beneficiary use cases and REST endpoints

**What**: Implement `@Command`/`@Query` use cases (`CreateBeneficiary`, `UpdateBeneficiary`, `ChangeBeneficiaryStatus`, `DeleteBeneficiary`, `ListBeneficiaries`) and `BeneficiaryResource` (`/api/v1/beneficiaries`) with unit and REST integration tests.
**Where**: `backend/src/main/java/io/github/tiaggofg/lumo/infrastructure/web/catalog/BeneficiaryResource.java`
**Depends on**: T9
**Reuses**: `domain.catalog.BeneficiaryRepository`, `infrastructure.web.error.ProblemDetailExceptionMapper`
**Requirement**: BEN-01

**Done when**:
- [x] All `/api/v1/beneficiaries` endpoints (`GET`, `POST`, `PUT`, `PATCH /status`, `DELETE`) match `design.md`
- [x] Duplicate `LOWER(name)` returns HTTP `409`; deleting referenced beneficiary returns HTTP `409`
- [x] Unit tests cover use cases and `BeneficiaryResourceIT` covers happy, edge and error HTTP paths
- [x] Gate check passes: `cd backend && ./mvnw verify`
- [x] Test count: >= 7 tests pass

**Tests**: integration
**Gate**: full
**Commit**: `feat(catalog): expose beneficiary use cases and rest api`

---

### T11: Implement Money, CompetenceMonth and Installment Value Objects

**What**: Create immutable Java `record` Value Objects `Money` (BRL, scale 2, `HALF_UP`, `positive()` > 0, `zero()`, `add`, `subtract`), `CompetenceMonth` (`YearMonth`, `parse`, `clampDay`, `monthsUntil`) and `Installment` (`current`, `total`, `1 <= current <= total`, `total >= 2`) with comprehensive unit tests.
**Where**: `backend/src/main/java/io/github/tiaggofg/lumo/domain/shared/`
**Depends on**: T10
**Reuses**: `domain.stereotype.ValueObject`, `domain.shared.DomainValidationException`
**Requirement**: BUD-01, TXN-01, REC-01

**Done when**:
- [x] `Money.positive` rejects `null`, `0`, and negative amounts
- [x] `CompetenceMonth.clampDay(31)` returns `2026-02-28` for `2026-02` and `2028-02-29` for leap year `2028-02`
- [x] `Installment.of` rejects `total < 2`, `current < 1`, and `current > total`
- [x] Gate check passes: `cd backend && ./mvnw test`
- [x] Test count: >= 12 unit tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(domain): add money competence month and installment vos`

---

### T12: Implement MonthlyBudget Aggregate Root and repository port

**What**: Create `MonthlyBudget` Aggregate Root (`id`, `competenceMonth`, `createdAt`, `updatedAt`, intentionally storing no totals) and `MonthlyBudgetRepository` port (`save`, `findById`, `existsByCompetenceMonth`, `findByCompetenceMonthGreaterThanEqual`, `deleteById`) with unit tests.
**Where**: `backend/src/main/java/io/github/tiaggofg/lumo/domain/budget/MonthlyBudget.java`
**Depends on**: T11
**Reuses**: `domain.stereotype.AggregateRoot`, `domain.shared.CompetenceMonth`
**Requirement**: BUD-01

**Done when**:
- [x] `MonthlyBudget` generates domain `UUID` and validates non-null `CompetenceMonth`
- [x] Aggregate holds zero persisted total fields (`AD-004`)
- [x] Pure unit tests pass
- [x] Gate check passes: `cd backend && ./mvnw test`
- [x] Test count: >= 4 unit tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(budget): implement monthly budget aggregate root`

---

### T13: Implement Transaction Aggregate Root and state transitions

**What**: Create `Transaction` Aggregate Root, `TransactionType`, `TransactionStatus` (`ESTIMATED`, `PENDING`, `SETTLED`) and `TransactionRepository` port implementing `monthlyBudgetId` immutability, automatic `paymentDate` assignment on `SETTLED`, clearing `paymentDate` on reversion, `confirmEstimate`, and `applyRecurrencePropagation` guard.
**Where**: `backend/src/main/java/io/github/tiaggofg/lumo/domain/transaction/Transaction.java`
**Depends on**: T12
**Reuses**: `domain.stereotype.AggregateRoot`, `domain.shared.Money`, `domain.shared.Installment`
**Requirement**: TXN-01, TXN-02, TXN-03

**Done when**:
- [x] Transitioning to `SETTLED` without explicit date sets `paymentDate = today`; reverting to `PENDING`/`ESTIMATED` sets `paymentDate = null`
- [x] `confirmEstimate` throws `BusinessRuleViolationException` when current status is not `ESTIMATED` or target status is `ESTIMATED`
- [x] `applyRecurrencePropagation` rejects `SETTLED` transactions
- [x] Pure unit tests cover every valid and invalid state transition and field bound
- [x] Gate check passes: `cd backend && ./mvnw test`
- [x] Test count: >= 14 unit tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(transaction): implement transaction aggregate and rules`

---

### T14: Implement MonthlyBudget and Transaction JPA adapters and Read Model

**What**: Create JPA entities, repository adapters for `MonthlyBudget` and `Transaction`, and `BudgetReadModelAdapter` computing dynamic `plannedIncome`, `realizedIncome`, `plannedExpense`, `realizedExpense`, `plannedBalance`, `realizedBalance`, `statusCounts`, `expensesByCategory`, `expensesByBeneficiary` and filtered transaction search (`dueDate ASC NULLS LAST, createdAt ASC`).
**Where**: `backend/src/main/java/io/github/tiaggofg/lumo/infrastructure/persistence/budget/`
**Depends on**: T13
**Reuses**: `domain.budget.MonthlyBudgetRepository`, `domain.transaction.TransactionRepository`
**Requirement**: BUD-02, TXN-03

**Done when**:
- [x] Read Model returns exact `0.00` totals and empty breakdowns when a budget has zero transactions
- [x] Read Model accurately separates Previsto (`ESTIMATED+PENDING+SETTLED`) and Realizado (`SETTLED`) and groups uncategorized items
- [x] Transaction query filters by `type`, `status`, `categoryId`, `beneficiaryId` and case-insensitive `search` over `description` and `notes`
- [x] Integration tests validate totals against the user's 13-item spreadsheet dataset (`6178.42` expense, `6362.29` income, `183.87` balance)
- [x] Gate check passes: `cd backend && ./mvnw verify`
- [x] Test count: >= 8 integration tests pass

**Tests**: integration
**Gate**: full
**Commit**: `feat(persistence): add budget transaction adapters and read model`

---

### T15: Implement MonthlyBudget use cases and REST API

**What**: Implement `CreateMonthlyBudgetUseCase`, `ListMonthlyBudgetsUseCase`, `GetMonthlyBudgetDetailUseCase`, `DeleteMonthlyBudgetUseCase` and `BudgetResource` (`/api/v1/budgets`) with unit and integration tests.
**Where**: `backend/src/main/java/io/github/tiaggofg/lumo/infrastructure/web/budget/BudgetResource.java`
**Depends on**: T14
**Reuses**: `application.budget.BudgetReadModelPort`, `domain.budget.MonthlyBudgetRepository`
**Requirement**: BUD-01, BUD-02

**Done when**:
- [x] `POST /api/v1/budgets` returns `201` with summary and `409` on duplicate `competenceMonth`
- [x] `GET /api/v1/budgets` returns budgets ordered by `competenceMonth DESC`
- [x] `DELETE /api/v1/budgets/{id}` returns `409` when transactions exist and `204` when empty
- [x] `BudgetResourceIT` verifies all endpoints and RFC 9457 error responses
- [x] Gate check passes: `cd backend && ./mvnw verify`
- [x] Test count: >= 8 tests pass

**Tests**: integration
**Gate**: full
**Commit**: `feat(budget): expose monthly budget use cases and rest api`

---

### T16: Implement Transaction use cases and REST API

**What**: Implement Transaction CRUD, `ChangeTransactionStatusUseCase`, `ConfirmEstimateUseCase` (prepared to update template when linked), `ListBudgetTransactionsUseCase`, active/type category & beneficiary validation, and `TransactionResource` (`/api/v1/budgets/{budgetId}/transactions`, `/api/v1/transactions/*`) with integration tests.
**Where**: `backend/src/main/java/io/github/tiaggofg/lumo/infrastructure/web/transaction/TransactionResource.java`
**Depends on**: T15
**Reuses**: `domain.transaction.TransactionRepository`, `domain.catalog.CategoryRepository`, `domain.catalog.BeneficiaryRepository`
**Requirement**: TXN-01, TXN-02, TXN-03

**Done when**:
- [x] Category type mismatch returns `400`; unknown budget/category/beneficiary returns `404`; assigning inactive category/beneficiary on create returns `422`; editing transaction keeping its existing inactive reference succeeds
- [x] `PATCH /api/v1/transactions/{id}/status` populates/clears `paymentDate` per `TXN-02`
- [x] `PATCH /api/v1/transactions/{id}/confirm-estimate` updates amount and status on `ESTIMATED` transactions and returns `422` otherwise
- [x] `TransactionResourceIT` verifies CRUD, filters, ordering, status toggle and error codes
- [x] Gate check passes: `cd backend && ./mvnw verify`
- [x] Test count: >= 12 tests pass

**Tests**: integration
**Gate**: full
**Commit**: `feat(transaction): expose transaction use cases and rest api`

---

### T17: Implement RecurringTransaction Aggregate Root and eligibility rules

**What**: Create `RecurringTransaction` Aggregate Root, `RecurrenceType` (`INDEFINITE`, `FIXED_TERM`, `INSTALLMENT`), `RecurrenceAmountType` (`FIXED`, `ESTIMATED`) and `RecurringTransactionRepository` port with `isEligibleFor(CompetenceMonth)` and `materializeFor(UUID, CompetenceMonth)` covering `dueDay` clamping and `startingInstallment` math.
**Where**: `backend/src/main/java/io/github/tiaggofg/lumo/domain/recurrence/RecurringTransaction.java`
**Depends on**: T16
**Reuses**: `domain.stereotype.AggregateRoot`, `domain.shared.Money`, `domain.shared.CompetenceMonth`, `domain.shared.Installment`
**Requirement**: REC-01, REC-02

**Done when**:
- [x] All 3 recurrence modes validate invariants (`FIXED_TERM`: `endMonth >= startMonth`; `INSTALLMENT`: `total >= 2`, `1 <= starting <= total`)
- [x] `INSTALLMENT` starting at `4/6` in `2026-11` materializes `4/6` (`2026-11`), `5/6` (`2026-12`), `6/6` (`2027-01`), and is ineligible in `2027-02`
- [x] `FIXED_TERM` produces `installment = null`; `FIXED` materializes `PENDING` and `ESTIMATED` materializes `ESTIMATED`
- [x] Pure unit tests cover every mode, boundary month and `dueDay = 31` in February
- [x] Gate check passes: `cd backend && ./mvnw test`
- [x] Test count: >= 16 unit tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(recurrence): implement recurring transaction aggregate`

---

### T18: Implement RecurringTransaction JPA and occurrence exclusion adapters

**What**: Create `RecurringTransactionJpaEntity`, `RecurringOccurrenceExclusionJpaEntity`, repository adapter and `RecurringOccurrenceExclusionPort` adapter checking/recording suppressed `(monthly_budget_id, recurring_transaction_id)` pairs.
**Where**: `backend/src/main/java/io/github/tiaggofg/lumo/infrastructure/persistence/recurrence/`
**Depends on**: T17
**Reuses**: `domain.recurrence.RecurringTransactionRepository`
**Requirement**: REC-02, REC-04

**Done when**:
- [x] Adapter persists and queries `has_generated_transactions`, active filters and exclusion pairs
- [x] Integration tests verify idempotent exclusion recording and filtered lookups on PostgreSQL
- [x] Gate check passes: `cd backend && ./mvnw verify`
- [x] Test count: >= 6 integration tests pass

**Tests**: integration
**Gate**: full
**Commit**: `feat(recurrence): add jpa persistence and exclusion adapters`

---

### T19: Integrate materialization into budget creation and suppression on delete

**What**: Implement `RecurringMaterializationService` and wire it into `CreateMonthlyBudgetUseCase` (materialize eligible active rules skipping exclusions/duplicates), `DeleteTransactionUseCase` (record exclusion when `sourceRecurringTransactionId != null`) and `ConfirmEstimateUseCase` (update source template when `updateRecurringTemplate = true`).
**Where**: `backend/src/main/java/io/github/tiaggofg/lumo/application/recurrence/RecurringMaterializationService.java`
**Depends on**: T18
**Reuses**: `application.budget.CreateMonthlyBudgetUseCase`, `application.transaction.DeleteTransactionUseCase`, `application.transaction.ConfirmEstimateUseCase`
**Requirement**: REC-02, REC-04, TXN-02

**Done when**:
- [x] Creating a `MonthlyBudget` materializes all eligible active recurrences atomically and sets `hasGeneratedTransactions = true`
- [x] Deleting a materialized transaction inserts a row in `recurring_occurrence_exclusions` preventing recreation
- [x] Confirming an estimate with `updateRecurringTemplate = true` updates the source `RecurringTransaction` amount
- [x] Unit tests cover materialization, exclusion skipping and template update
- [x] Gate check passes: `cd backend && ./mvnw test`
- [x] Test count: >= 8 unit tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(recurrence): wire materialization and suppression hooks`

---

### T20: Implement RecurringTransaction use cases with propagation and deactivation

**What**: Implement `CreateRecurringTransactionUseCase` (materializing into existing budgets with `competenceMonth >= currentMonth`), `UpdateRecurringTransactionUseCase` (with opt-in `propagateToOpenTransactions` preserving `SETTLED` and past months), `DeactivateRecurringTransactionUseCase` (with opt-in `removeFutureOpenTransactions`), `ActivateRecurringTransactionUseCase`, `DeleteRecurringTransactionUseCase` (`409` if `hasGeneratedTransactions`) and `ListRecurringTransactionsUseCase`.
**Where**: `backend/src/main/java/io/github/tiaggofg/lumo/application/recurrence/`
**Depends on**: T19
**Reuses**: `application.recurrence.RecurringMaterializationService`, `domain.recurrence.RecurringTransactionRepository`
**Requirement**: REC-01, REC-03, REC-04

**Done when**:
- [x] Creating a recurrence with past `startMonth` does not retroactively populate past budgets (`competenceMonth < currentMonth`)
- [x] Editing with `propagateToOpenTransactions = true` updates `ESTIMATED`/`PENDING` in current/future budgets and never touches `SETTLED` or past budgets
- [x] Deactivating with `removeFutureOpenTransactions = true` deletes open future/current transactions while preserving `SETTLED` and past history
- [x] Physical delete returns conflict when `hasGeneratedTransactions == true`
- [x] Unit tests cover every branch with deterministic `Clock`
- [x] Gate check passes: `cd backend && ./mvnw test`
- [x] Test count: >= 12 unit tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(recurrence): add recurring transaction application use cases`

---

### T21: Expose RecurringTransaction REST API and run full backend integration suite

**What**: Create `RecurringTransactionResource` (`/api/v1/recurring-transactions`) and `RecurringTransactionResourceIT` validating all recurrence endpoints, budget creation materialization, propagation, deactivation, physical delete `409` and exclusion suppression end-to-end against Testcontainers PostgreSQL.
**Where**: `backend/src/main/java/io/github/tiaggofg/lumo/infrastructure/web/recurrence/RecurringTransactionResource.java`
**Depends on**: T20
**Reuses**: `application.recurrence.*`, `infrastructure.web.error.ProblemDetailExceptionMapper`
**Requirement**: REC-01, REC-02, REC-03, REC-04

**Done when**:
- [x] All `/api/v1/recurring-transactions` endpoints match `design.md`
- [x] `RecurringTransactionResourceIT` verifies full lifecycle including `dueDay=31` clamp, `FIXED_TERM`, `INSTALLMENT` 4/6, propagation opt-in, deactivation opt-in, suppression on delete and `409` on physical delete
- [x] ArchUnit + all backend unit and integration tests pass cleanly
- [x] Gate check passes: `cd backend && ./mvnw verify`
- [x] Test count: >= 10 integration tests pass

**Tests**: integration
**Gate**: full
**Commit**: `feat(recurrence): expose recurring transaction rest api`

---

### T22: Bootstrap Angular v22 frontend with Tailwind CSS, PrimeNG and Playwright

**What**: Initialize `frontend/` with Angular v22 (Standalone + Signals), Tailwind CSS, PrimeNG v22 (confirming MIT/free components only), Chart.js, ESLint, unit test runner, Playwright configuration and dev proxy to `http://localhost:8080/api`.
**Where**: `frontend/package.json`
**Depends on**: T21
**Reuses**: `.specs/STATE.md` (`AD-008`)
**Requirement**: UI-01

**Done when**:
- [x] `frontend/` builds with `npm run build` and passes `npm run lint`
- [x] PrimeNG preset theme supports Light and Dark mode via CSS selector `.dark`
- [x] Proxy config forwards `/api` to `http://localhost:8080`
- [x] Gate check passes: `cd frontend && npm run lint && npm run build`

**Tests**: none
**Gate**: build
**Commit**: `build(frontend): bootstrap angular 22 tailwind primeng app`

---

### T23: Implement AppShell layout, ThemeService and RFC 9457 HTTP interceptor

**What**: Create responsive `AppShellComponent` (desktop sidebar + mobile drawer, routes `/budgets`, `/recurrences`, `/catalog`), `ThemeService` (Light default, Dark toggle persisted in `localStorage`) and `problemDetailInterceptor` surfacing RFC 9457 `detail` via PrimeNG Toast.
**Where**: `frontend/src/app/core/`
**Depends on**: T22
**Reuses**: `frontend/package.json`
**Requirement**: UI-04, UI-06

**Done when**:
- [x] Theme toggle switches `.dark` class immediately and restores preference from `localStorage` on bootstrap
- [x] HTTP errors returning `application/problem+json` display the server's `detail` message in a Toast
- [x] Unit tests cover `ThemeService` persistence and `problemDetailInterceptor`
- [x] Gate check passes: `cd frontend && npm test -- --watch=false`
- [x] Test count: >= 5 unit tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(frontend): add responsive shell theme service and error handler`

---

### T24: Implement shared BRL currency pipe and Transaction status badge component

**What**: Create `BrlCurrencyPipe` (`pt-BR`, `R$ 1.234,56`, `tabular-nums`) and `TransactionStatusBadgeComponent` rendering `Estimado`, `Pendente`, `Pago` (`EXPENSE`) or `Recebido` (`INCOME`) with accessible labels and unit tests.
**Where**: `frontend/src/app/shared/`
**Depends on**: T23
**Reuses**: `frontend/src/app/core/`
**Requirement**: UI-02

**Done when**:
- [x] `BrlCurrencyPipe` formats positive, zero and negative values in `pt-BR` BRL format
- [x] `TransactionStatusBadgeComponent` renders `Pago` for `EXPENSE + SETTLED` and `Recebido` for `INCOME + SETTLED`
- [x] Unit tests cover all status/type combinations and currency edge cases
- [x] Gate check passes: `cd frontend && npm test -- --watch=false`
- [x] Test count: >= 6 unit tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(frontend): add brl currency pipe and status badge component`

---

### T25: Implement CatalogStoreService with Angular Signals

**What**: Create `CatalogStoreService` managing reactive `categories`, `beneficiaries`, active selectors (`activeExpenseCategories`, `activeIncomeCategories`, `activeBeneficiaries`), loading states and HTTP calls for `/api/v1/categories` and `/api/v1/beneficiaries`.
**Where**: `frontend/src/app/features/catalog/catalog-store.service.ts`
**Depends on**: T24
**Reuses**: `frontend/src/app/core/`
**Requirement**: UI-04

**Done when**:
- [x] Signals expose all items and computed active-only selectors for forms
- [x] Create, update, toggle active and delete methods refresh state cleanly
- [x] Unit tests mock `HttpClient` verifying signal updates and error propagation
- [x] Gate check passes: `cd frontend && npm test -- --watch=false`
- [x] Test count: >= 6 unit tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(frontend): add catalog signals store service`

---

### T26: Implement CatalogPageComponent for Categories and Beneficiaries

**What**: Create `CatalogPageComponent` (`/catalog`) with `Categorias` and `Beneficiários` tabs, create/edit dialogs (color & icon picker for categories), active/inactive toggle and delete confirmation dialog displaying RFC 9457 feedback on `409`.
**Where**: `frontend/src/app/features/catalog/catalog-page.component.ts`
**Depends on**: T25
**Reuses**: `frontend/src/app/features/catalog/catalog-store.service.ts`
**Requirement**: UI-04

**Done when**:
- [x] Users can create, edit, deactivate/activate and delete both categories and beneficiaries
- [x] Destructive delete actions require explicit confirmation dialog
- [x] Unit tests cover tab rendering, form validation and store invocation
- [x] Gate check passes: `cd frontend && npm test -- --watch=false`
- [x] Test count: >= 5 unit tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(frontend): add categories and beneficiaries catalog page`

---

### T27: Implement BudgetsStoreService and TransactionsStoreService with Signals

**What**: Create `BudgetsStoreService` (`/api/v1/budgets`) and `TransactionsStoreService` (`/api/v1/budgets/:id/transactions`, `/api/v1/transactions/*`) managing summary, breakdowns, filter signals (`type`, `status`, `categoryId`, `beneficiaryId`, `search`) and loading states.
**Where**: `frontend/src/app/features/budgets/budgets-store.service.ts`
**Depends on**: T26
**Reuses**: `frontend/src/app/core/`
**Requirement**: UI-01, UI-02

**Done when**:
- [x] Filter changes trigger server-side query `GET /api/v1/budgets/{id}/transactions` with query params
- [x] Any transaction mutation (create, edit, status toggle, confirm estimate, delete) refreshes both the transaction list and budget summary/breakdowns
- [x] Unit tests verify signal state transitions and query parameter construction
- [x] Gate check passes: `cd frontend && npm test -- --watch=false`
- [x] Test count: >= 7 unit tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(frontend): add budgets and transactions signals stores`

---

### T28: Implement BudgetListPageComponent and Create Budget dialog

**What**: Create `BudgetListPageComponent` (`/budgets`) rendering monthly budget cards with Previsto/Realizado metrics, expense payment progress bar, empty state CTA, "Novo Orçamento" (`YYYY-MM`) dialog navigating to `/budgets/:id` on creation, and delete confirmation dialog.
**Where**: `frontend/src/app/features/budgets/budget-list-page.component.ts`
**Depends on**: T27
**Reuses**: `frontend/src/app/features/budgets/budgets-store.service.ts`, `frontend/src/app/shared/`
**Requirement**: UI-01

**Done when**:
- [x] Empty state renders CTA when zero budgets exist
- [x] Creating a budget navigates directly to `/budgets/:id` and shows materialized count feedback when > 0
- [x] Unit tests verify empty state, card rendering and create flow
- [x] Gate check passes: `cd frontend && npm test -- --watch=false`
- [x] Test count: >= 5 unit tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(frontend): add monthly budgets list page and dialog`

---

### T29: Implement BudgetDetailPageComponent with summary cards, filters and responsive list

**What**: Create `BudgetDetailPageComponent` (`/budgets/:id`) with Previsto vs. Realizado summary cards, expense progress bar, `Todas`/`Despesas`/`Receitas` tabs, filter bar (`status`, `categoryId`, `beneficiaryId`, `search`, clear filters), desktop data table (`>= 1024px`) and mobile stacked cards (`< 768px`).
**Where**: `frontend/src/app/features/budgets/budget-detail-page.component.ts`
**Depends on**: T28
**Reuses**: `frontend/src/app/features/budgets/budgets-store.service.ts`, `frontend/src/app/features/catalog/catalog-store.service.ts`
**Requirement**: UI-02

**Done when**:
- [x] Summary cards display Previsto and Realizado for Receitas, Despesas and Saldo with `tabular-nums`
- [x] Tabs and filters query the backend and handle empty-filter results cleanly
- [x] Desktop table and mobile card layout render recurrence (`↻`) and installment (`4/6`) indicators
- [x] Unit tests cover summary rendering and filter interactions
- [x] Gate check passes: `cd frontend && npm test -- --watch=false`
- [x] Test count: >= 6 unit tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(frontend): add budget detail view summary cards and filters`

---

### T30: Implement 1-click settle toggle, ConfirmEstimate dialog and Transaction drawer

**What**: Implement the 1-click settle button on each transaction row, `ConfirmEstimateDialogComponent` (actual amount, `PENDING`/`SETTLED` choice and optional "Atualizar valor padrão da recorrência" checkbox when linked) and `TransactionFormDrawerComponent` (create/edit transaction with type-filtered active categories).
**Where**: `frontend/src/app/features/budgets/confirm-estimate-dialog.component.ts`
**Depends on**: T29
**Reuses**: `frontend/src/app/features/budgets/budgets-store.service.ts`
**Requirement**: UI-02

**Done when**:
- [x] Clicking the status toggle calls `PATCH /api/v1/transactions/{id}/status` and refreshes summary cards immediately
- [x] `ConfirmEstimateDialogComponent` shows the "Atualizar valor padrão da recorrência" option only when `sourceRecurringTransactionId != null`
- [x] `TransactionFormDrawerComponent` filters category options by selected `type` (`INCOME`/`EXPENSE`) and validates `amount > 0`
- [x] Unit tests verify 1-click toggle, estimate confirmation payload and form validation
- [x] Gate check passes: `cd frontend && npm test -- --watch=false`
- [x] Test count: >= 7 unit tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(frontend): add quick settle confirm estimate and tx drawer`

---

### T31: Implement BudgetChartsComponent and RecurrencesPageComponent

**What**: Create `BudgetChartsComponent` (Chart.js doughnut/bar breakdowns by `Category` and `Beneficiary` inside `/budgets/:id`, adapting to Light/Dark theme) and `RecurrencesPageComponent` (`/recurrences`) with `RecurrencesStoreService`, create/edit dialog (conditional fields per `INDEFINITE`/`FIXED_TERM`/`INSTALLMENT` + opt-in propagation checkbox), deactivate dialog (opt-in remove future open transactions) and delete confirmation.
**Where**: `frontend/src/app/features/recurrences/recurrences-page.component.ts`
**Depends on**: T30
**Reuses**: `frontend/src/app/features/catalog/catalog-store.service.ts`, `frontend/src/app/core/services/theme.service.ts`
**Requirement**: UI-03, UI-05

**Done when**:
- [x] `BudgetChartsComponent` renders both Category and Beneficiary expense breakdowns when expenses exist
- [x] `RecurrenceFormDialog` dynamically enforces required fields per mode (`endMonth` for `FIXED_TERM`, `totalInstallments`/`startingInstallment` for `INSTALLMENT`)
- [x] Edit dialog exposes opt-in propagation checkbox and Deactivate dialog exposes opt-in remove-future-open checkbox
- [x] Unit tests cover chart dataset mapping and recurrence dialog conditional validations
- [x] Gate check passes: `cd frontend && npm test -- --watch=false`
- [x] Test count: >= 8 unit tests pass

**Tests**: unit
**Gate**: quick
**Commit**: `feat(frontend): add budget charts and recurrences management page`

---

### T32: Add full-stack Playwright E2E suite for desktop and mobile flows

**What**: Create `frontend/e2e/lumo-mvp.spec.ts` verifying the full user journey against live Quarkus + PostgreSQL + Angular: catalog management, recurrence creation (`INDEFINITE`/`FIXED_TERM`/`INSTALLMENT` + `ESTIMATED`), budget creation with automatic materialization, real spreadsheet math validation, 1-click settle, estimate confirmation, recurrence edit propagation, charts, Dark Mode persistence and mobile (`390x844`) responsive layout with zero console errors.
**Where**: `frontend/e2e/lumo-mvp.spec.ts`
**Depends on**: T31
**Reuses**: `frontend/playwright.config.ts`
**Requirement**: UI-01, UI-02, UI-03, UI-04, UI-05, UI-06

**Done when**:
- [x] Desktop (`1440x900`) and mobile (`390x844`) Playwright specs pass end-to-end against real backend and PostgreSQL
- [x] Zero uncaught page errors or console errors occur across all flows
- [x] Full project build, backend tests, frontend unit tests and Playwright E2E pass
- [x] Gate check passes: `cd frontend && npx playwright test --reporter=list`
- [x] Test count: >= 6 E2E test scenarios pass

**Tests**: e2e
**Gate**: full
**Commit**: `test(e2e): add playwright full stack desktop and mobile suite`

---

## Checks

**C1** - Liquibase seeds 12 default categories (9 EXPENSE, 3 INCOME) and beneficiary `Família` (CAT-01, AC 1)
Proof: run backend-it | LiquibaseMigrationIT

**C2** - Creating a valid `Category` returns HTTP 201 with domain UUID and `active = true` (CAT-01, AC 2)
Proof: run backend-it | CategoryResourceIT

**C3** - Duplicate `(LOWER(name), type)` category returns HTTP 409 RFC 9457 (CAT-01, AC 3)
Proof: run backend-it | CategoryResourceIT

**C4** - Deactivating a `Category` sets `active = false` while keeping historical references intact (CAT-01, AC 4)
Proof: run backend-it | CategoryResourceIT

**C5** - Deleting a referenced `Category` returns HTTP 409 RFC 9457 (CAT-01, AC 5)
Proof: run backend-it | CategoryResourceIT

**C6** - Creating a valid unique `Beneficiary` returns HTTP 201 with domain UUID and `active = true` (BEN-01, AC 6)
Proof: run backend-it | BeneficiaryResourceIT

**C7** - Deleting a referenced `Beneficiary` returns HTTP 409 RFC 9457 (BEN-01, AC 7)
Proof: run backend-it | BeneficiaryResourceIT

**C8** - Creating a `MonthlyBudget` persists it, materializes eligible active recurrences and returns HTTP 201 (BUD-01, AC 1)
Proof: run backend-it | BudgetResourceIT

**C9** - Creating a duplicate `MonthlyBudget` for the same `competenceMonth` returns HTTP 409 RFC 9457 (BUD-01, AC 2)
Proof: run backend-it | BudgetResourceIT

**C10** - Listing `MonthlyBudget` records orders by `competenceMonth DESC` with dynamically computed Previsto/Realizado totals (BUD-02, AC 3)
Proof: run backend-it | BudgetResourceIT

**C11** - Retrieving `GET /api/v1/budgets/{id}` returns computed summary, status counts and Category/Beneficiary breakdowns (BUD-02, AC 4)
Proof: run backend-it | BudgetResourceIT

**C12** - Budgets remain independent without automatic balance carryover between consecutive months (BUD-02, AC 5)
Proof: run backend-it | BudgetResourceIT

**C13** - Deleting a `MonthlyBudget` with transactions returns HTTP 409 RFC 9457; deleting an empty one returns HTTP 204 (BUD-01, AC 6)
Proof: run backend-it | BudgetResourceIT

**C14** - Creating a valid `Transaction` returns HTTP 201 and rejects `amount <= 0` or mismatched category type with HTTP 400 (TXN-01, AC 1)
Proof: run backend-it | TransactionResourceIT

**C15** - `monthlyBudgetId` is immutable after creation and rejects cross-budget updates with HTTP 400 (TXN-01, AC 3)
Proof: run backend-unit | TransactionTest

**C16** - Transitioning `Transaction` to `SETTLED` fills `paymentDate` from `Clock` and reverting clears `paymentDate` to `null` (TXN-02, AC 4)
Proof: run backend-unit | TransactionTest

**C17** - Confirming an `ESTIMATED` transaction updates amount/status and optionally updates the source recurrence template (TXN-02, AC 6)
Proof: run backend-it | TransactionResourceIT

**C18** - Filtering transactions by `type`, `status`, `categoryId`, `beneficiaryId` and `search` orders by `dueDate ASC NULLS LAST, createdAt ASC` (TXN-03, AC 7)
Proof: run backend-it | TransactionResourceIT

**C19** - Previsto sums `ESTIMATED+PENDING+SETTLED` and Realizado sums `SETTLED` only, matching the 13-item spreadsheet totals (TXN-03, AC 8)
Proof: run backend-it | BudgetReadModelIT

**C20** - Creating `RecurringTransaction` validates `INDEFINITE`, `FIXED_TERM`, `INSTALLMENT` and `dueDay` clamping (`31` in Feb -> `28`/`29`) (REC-01, AC 1)
Proof: run backend-unit | RecurringTransactionTest

**C21** - Materialization computes `PENDING`/`ESTIMATED` from `amountType`, clamps `dueDay`, and generates `4/6..6/6` installments stopping at end (REC-02, AC 2)
Proof: run backend-unit | RecurringTransactionTest

**C22** - Creating a new `RecurringTransaction` materializes into existing current/future budgets without touching past budgets or duplicating (REC-02, AC 3)
Proof: run backend-it | RecurringTransactionResourceIT

**C23** - Updating `RecurringTransaction` affects future only by default and propagates to open current/future transactions when opted in, never changing `SETTLED` (REC-03, AC 4)
Proof: run backend-it | RecurringTransactionResourceIT

**C24** - Deactivating sets `active = false` with opt-in removal of open current/future transactions; physical delete returns HTTP 409 if ever generated (REC-03, AC 6)
Proof: run backend-it | RecurringTransactionResourceIT

**C25** - Deleting a materialized transaction records suppression in `recurring_occurrence_exclusions` preventing automatic recreation (REC-04, AC 8)
Proof: run backend-it | RecurringTransactionResourceIT

**C26** - ArchUnit enforces pure `domain` (zero Quarkus/Jakarta/JPA), isolated `application` and `@Command`/`@Query` placement (BUD-01, AC 1)
Proof: run backend-unit | CleanArchitectureArchTest

**C27** - Budgets list UI displays Previsto/Realizado, empty state and creates a new budget navigating into `/budgets/:id` (UI-01, AC 1)
Proof: run e2e | budgets list and create flow

**C28** - Budget detail UI renders summary cards, filters, responsive desktop/mobile layout, 1-click settle (`Pago`/`Recebido`) and confirm-estimate dialog (UI-02, AC 2)
Proof: run e2e | budget detail settle and confirm estimate

**C29** - Recurrences UI supports create, edit with opt-in propagation, deactivate with opt-in removal and RFC 9457 conflict feedback (UI-03, AC 5)
Proof: run e2e | recurrences lifecycle

**C30** - Catalog UI manages Categories and Beneficiaries tabs with soft-disable and RFC 9457 feedback on blocked delete (UI-04, AC 6)
Proof: run e2e | catalog categories and beneficiaries

**C31** - Budget detail renders Category and Beneficiary expense charts and Dark Mode toggle persists across reloads (UI-05, AC 1)
Proof: run e2e | charts and dark mode persistence

**C32** - Frontend unit suite verifies `BrlCurrencyPipe`, `TransactionStatusBadgeComponent` (`Pago`/`Recebido`), `ThemeService` persistence and `problemDetailInterceptor` RFC 9457 error handling (UI-06, AC 2)
Proof: run frontend-unit | ThemeService

---

## Handoff

The feature's live state, written as it happens - a compaction gives no warning.

**Settled mid-build:** none
**Dispatched:** none
**Walked:** none
