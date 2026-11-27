# Google OAuth2 Authentication Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, the walk, check_proofs, the Verifier and the screens sub-agent).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/04-google-oauth-auth/design.md`
**Status**: Draft
**Build**: `cd backend && ./mvnw test-compile && cd ../frontend && npm run lint && npm run build`
**Run backend-unit**: `cd backend && ./mvnw test`
**Run backend-it**: `cd backend && ./mvnw verify -DskipUTs`
**Run frontend-unit**: `cd frontend && npm test -- --watch=false`
**Run e2e**: `cd frontend && npx playwright test --reporter=list`

---

## Test Coverage Matrix

> Generated from codebase, project guidelines (`AGENTS.md`, `.agents/rules/post-implementation-testing.md`, `.agents/rules/feature-naming-and-quality.md`), and `.specs/features/04-google-oauth-auth/spec.md` - confirm before Execute.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Backend Auth Domain & ArchUnit (`backend/src/main/java/.../domain/auth/**`) | unit | All branches and invariants (`User`, `RefreshSession`, deactivation, profile sync, expiration, revocation) + `CleanArchitectureArchTest` zero-framework rule | `backend/src/test/java/.../domain/auth/**/*Test.java` | `cd backend && ./mvnw test` |
| Backend Auth Application Use Cases (`backend/src/main/java/.../application/auth/**`) | unit | 1:1 to spec ACs & edge cases (Google upsert, `email_verified`, optional `LUMO_ALLOWED_EMAILS`, inactive user, atomic refresh rotation, logout, dev-login toggle) | `backend/src/test/java/.../application/auth/**/*Test.java` | `cd backend && ./mvnw test` |
| Backend Auth Crypto, State Cookie & Google HTTP/JWKS (`backend/src/main/java/.../infrastructure/auth/**`) | unit | HS256 sign/verify/expiry, opaque 256-bit + SHA-256, `OAuthStateCookieCodec` + `returnUrl` anti-open-redirect sanitization, `AuthStartupValidator` `%prod` secret check, Google token exchange + RSA JWKS signature/cache/timeout with mock `HttpServer` | `backend/src/test/java/.../infrastructure/auth/**/*Test.java` | `cd backend && ./mvnw test` |
| Backend Liquibase, Persistence, Auth Endpoints & API Filter (`backend/src/main/resources/db/changelog/**`, `infrastructure/persistence/auth/**`, `infrastructure/auth/AuthResource.java`, `AuthRequestFilter.java`) | integration | Real PostgreSQL Testcontainers: schema/constraints (`LiquibaseMigrationIT`), atomic `revokeIfActive`, full `/api/v1/auth/*` endpoints, `401 application/problem+json` on all protected `/api/v1/**`, `/q/health/ready` public, `%prod` dev-login `404`, and all existing `*ResourceIT` green | `backend/src/test/java/.../infrastructure/**/*IT.java` | `cd backend && ./mvnw verify -DskipUTs` |
| Frontend Auth Services, Guards, Interceptors & Components (`frontend/src/app/core/auth/**`, `frontend/src/app/features/auth/**`, `frontend/src/app/core/layout/**`) | unit | `AuthService` Signals, `authGuard`/`guestGuard`/`sanitizeReturnUrl`, `authInterceptor` single-flight refresh + `problemDetailInterceptor` 401 suppression, `LoginPageComponent` error states & conditional Dev button, `AppShellComponent` user profile + logout (desktop expanded/collapsed & mobile) | `frontend/src/app/**/*.spec.ts` | `cd frontend && npm test -- --watch=false` |
| Full-Stack Auth & Regression UI Flows (`frontend/e2e/**`) | e2e | Desktop (`1280x800`) and mobile (`390x844`): anonymous redirect to `/login?returnUrl=...`, `?error=` messages, Dev login, reload persistence, sidebar profile & logout, plus full existing `lumo-mvp.spec.ts` green | `frontend/e2e/**/*.spec.ts` | `cd frontend && npx playwright test --reporter=list` |

## Gate Check Commands

> Generated from codebase (`AGENTS.md`, `backend/pom.xml`, `frontend/package.json`) - confirm before Execute.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | After unit-test-only tasks (backend or frontend) | `cd backend && ./mvnw test` (backend) / `cd frontend && npm test -- --watch=false` (frontend) |
| Full | After integration or E2E tasks | `cd backend && ./mvnw verify` (backend) / `cd frontend && npx playwright test --reporter=list` (frontend) |
| Build | After phase completion or config/docs updates | `cd backend && ./mvnw test-compile && cd ../frontend && npm run lint && npm run build` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Backend Auth Schema, Pure Domain, Persistence & Use Cases

```
T1 → T2 → T3 → T4
```

### Phase 2: Backend Crypto/JWKS Client, Auth REST Endpoints & Global API Protection

```
T4 → T5 → T6 → T7 → T8
```

### Phase 3: Frontend Auth Core, `/login` Page, Shell Profile/Logout, E2E & Documentation Sync

```
T8 → T9 → T10 → T11 → T12
```

---

## Task Breakdown

### T1: Add Liquibase auth schema migration (`users`, `refresh_sessions`) and auth configuration properties

**What**: Create `003-create-auth-schema.sql` defining `users` and `refresh_sessions` with unique constraints and indexes, register it in `db.changelog-master.yaml`, add `lumo.auth.*` properties in `application.properties` (with `%prod` secure defaults and `%dev`/`%test` dev-login defaults) and `docker-compose.yml` env passthrough, and extend `LiquibaseMigrationIT` to assert the new auth tables and constraints.
**Where**: `backend/src/main/resources/db/changelog/003-create-auth-schema.sql`
**Depends on**: None
**Reuses**: `backend/src/main/resources/db/changelog/001-create-schema.sql`, `backend/src/test/java/io/github/tiaggofg/lumo/infrastructure/persistence/LiquibaseMigrationIT.java`
**Requirement**: AUTH-01, AUTH-03, AUTH-06

**Done when**:
- [x] `003-create-auth-schema.sql` creates `users` (`id`, `google_sub` unique, `email` unique, `name`, `avatar_url`, `active`, `created_at`, `updated_at`) and `refresh_sessions` (`id`, `user_id` FK ON DELETE CASCADE, `token_hash` unique 64 chars, `user_agent`, `expires_at`, `revoked_at`, `created_at`) with indexes
- [x] `db.changelog-master.yaml` includes `003-create-auth-schema.sql`
- [x] `application.properties` configures `lumo.auth.jwt-secret`, `lumo.auth.cookie-secure`, `lumo.auth.dev-login.enabled` (`true` in `%dev`/`%test`, `false` in `%prod`), `lumo.auth.allowed-emails`, and `lumo.auth.google.*` (`redirect-uri` default `http://localhost:4200/api/v1/auth/google/callback`)
- [x] `LiquibaseMigrationIT` asserts `users` and `refresh_sessions` tables and unique constraints exist
- [x] Gate check passes: `cd backend && ./mvnw verify`

**Tests**: integration
**Gate**: full
**Commit**: `feat(auth): add liquibase schema for users and refresh sessions`

---

### T2: Create pure Java auth domain models (`User`, `RefreshSession`), repository ports and exceptions

**What**: Implement `User`, `RefreshSession`, `UserRepository`, `RefreshSessionRepository`, and domain auth exceptions (`UnauthorizedException`, `AccountDisabledException`, `EmailNotAllowedException`, `OAuthAuthenticationException`, `DevLoginDisabledException`) under `domain.auth` with zero framework imports (`AD-003`), plus comprehensive unit tests and `CleanArchitectureArchTest` verification.
**Where**: `backend/src/main/java/io/github/tiaggofg/lumo/domain/auth/User.java`
**Depends on**: T1
**Reuses**: `backend/src/main/java/io/github/tiaggofg/lumo/domain/stereotype/AggregateRoot.java`, `backend/src/test/java/io/github/tiaggofg/lumo/architecture/CleanArchitectureArchTest.java`
**Requirement**: AUTH-01, AUTH-03

**Done when**:
- [x] `User` validates non-blank `googleSub`, normalized lowercase `email` (≤ 255), `name` (≤ 200), optional `avatarUrl` (≤ 1024), supports `syncGoogleProfile` and `deactivate`
- [x] `RefreshSession` validates non-blank 64-char `tokenHash`, `expiresAt > createdAt`, `isUsableAt(now)` and irreversible `revoke(now)`
- [x] `UserTest`, `RefreshSessionTest` and `CleanArchitectureArchTest` pass with zero framework imports in `domain.auth`
- [x] Gate check passes: `cd backend && ./mvnw test`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): add pure java User and RefreshSession domain models`

---

### T3: Implement JPA entities and repository adapters for `User` and `RefreshSession`

**What**: Implement `UserJpaEntity`, `RefreshSessionJpaEntity`, `UserJpaRepositoryAdapter`, and `RefreshSessionJpaRepositoryAdapter` (with atomic conditional `UPDATE refresh_sessions SET revoked_at = :now WHERE id = :id AND revoked_at IS NULL` in `revokeIfActive`) and verify persistence, upsert, unique constraints, and atomic revocation in `AuthPersistenceIT`.
**Where**: `backend/src/main/java/io/github/tiaggofg/lumo/infrastructure/persistence/auth/UserJpaRepositoryAdapter.java`
**Depends on**: T2
**Reuses**: `backend/src/main/java/io/github/tiaggofg/lumo/infrastructure/persistence/catalog/CategoryJpaRepositoryAdapter.java`
**Requirement**: AUTH-01, AUTH-03

**Done when**:
- [x] `UserJpaEntity` and `RefreshSessionJpaEntity` pass Hibernate `schema-management.strategy=validate` against `003-create-auth-schema.sql`
- [x] `RefreshSessionJpaRepositoryAdapter.revokeIfActive` returns `true` on first call and `false` on repeated call for the same session
- [x] `AuthPersistenceIT` passes on PostgreSQL Testcontainers covering user save/find/update and session issue/find/atomic revoke
- [x] Gate check passes: `cd backend && ./mvnw verify`

**Tests**: integration
**Gate**: full
**Commit**: `feat(auth): add jpa persistence adapters for users and sessions`

---

### T4: Implement auth application ports and use cases (`AuthenticateWithGoogle`, `AuthenticateDevUser`, `RefreshSession`, `Logout`, `GetCurrentUser`)

**What**: Define application ports (`GoogleOAuthClientPort`, `TokenServicePort`, `AuthConfigPort`) and `@Command`/`@Query` use cases (`AuthenticateWithGoogleUseCase`, `AuthenticateDevUserUseCase`, `RefreshSessionUseCase`, `LogoutUseCase`, `GetCurrentUserUseCase`) with unit tests covering every AC and edge case.
**Where**: `backend/src/main/java/io/github/tiaggofg/lumo/application/auth/AuthenticateWithGoogleUseCase.java`
**Depends on**: T3
**Reuses**: `backend/src/main/java/io/github/tiaggofg/lumo/application/stereotype/Command.java`, `backend/src/main/java/io/github/tiaggofg/lumo/application/stereotype/Query.java`
**Requirement**: AUTH-01, AUTH-03, AUTH-06

**Done when**:
- [x] `AuthenticateWithGoogleUseCase` enforces `emailVerified == true`, optional case-insensitive `LUMO_ALLOWED_EMAILS`, active user check, idempotent upsert by `googleSub`, and 30-day session creation
- [x] `AuthenticateDevUserUseCase` throws `DevLoginDisabledException` when disabled and upserts `dev@lumo.local` (`google_sub = "dev-local-user"`) when enabled
- [x] `RefreshSessionUseCase` atomically revokes previous session (`revokeIfActive`), rejects expired/revoked/reused tokens and inactive users, and issues a rotated 30-day session
- [x] `LogoutUseCase` revokes session by hash idempotently and `GetCurrentUserUseCase` returns `UserSummary` for active user
- [x] Unit tests (`AuthUseCasesTest`) cover all happy and error branches and `CleanArchitectureArchTest` passes
- [x] Gate check passes: `cd backend && ./mvnw test`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): add auth application ports and use cases`

---

### T5: Implement `AuthConfig`, `AuthStartupValidator`, `JwtTokenService`, `OAuthStateCookieCodec` and `AuthCookieHelper`

**What**: Implement Quarkus `@ConfigMapping` (`AuthConfig` + `AuthConfigAdapter`), `@Startup` secret strength guard for `%prod` (`AuthStartupValidator`), HS256 JWT + opaque token/SHA-256 service (`JwtTokenService`), HMAC-signed OAuth state/PKCE cookie codec with strict `returnUrl` sanitization (`OAuthStateCookieCodec`), and `HttpOnly; SameSite=Lax` cookie builder (`AuthCookieHelper`) with unit tests.
**Where**: `backend/src/main/java/io/github/tiaggofg/lumo/infrastructure/auth/JwtTokenService.java`
**Depends on**: T4
**Reuses**: `backend/src/main/java/io/github/tiaggofg/lumo/infrastructure/config/ClockProducer.java`
**Requirement**: AUTH-01, AUTH-03, AUTH-04

**Done when**:
- [x] `JwtTokenService` signs and verifies HS256 JWTs with `Clock`-based expiry (`15 min`), generates 256-bit Base64URL opaque tokens, and computes 64-char hex `SHA-256`
- [x] `OAuthStateCookieCodec` verifies HMAC-SHA256 signature and 5-min expiry, and rejects open-redirect URLs (`https://evil.com`, `//evil.com`, `\evil`) falling back to `/dashboard`
- [x] `AuthStartupValidator` throws `IllegalStateException` in `%prod` when `jwt-secret` is blank or shorter than 32 characters
- [x] `AuthCookieHelper` emits `HttpOnly=true`, `SameSite=Lax`, configurable `Secure`, proper paths (`/api` and `/api/v1/auth`) and `Max-Age=0` clear cookies
- [x] Unit tests (`JwtTokenServiceTest`, `OAuthStateCookieCodecTest`, `AuthStartupValidatorTest`) pass
- [x] Gate check passes: `cd backend && ./mvnw test`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): add jwt signing oauth state codec cookies and startup check`

---

### T6: Implement `GoogleOAuthHttpClient` with 10s timeout and RS256 JWKS verification

**What**: Implement `GoogleOAuthHttpClient` (`GoogleOAuthClientPort`) using JDK 25 `java.net.http.HttpClient` (10s timeout) to exchange authorization `code` + PKCE `code_verifier` at Google's token endpoint and cryptographically verify `id_token` RS256 signatures against Google's JWKS endpoint with in-memory caching and automatic refresh on unknown `kid`, validated with unit tests against a local `com.sun.net.httpserver.HttpServer` and generated RSA keypair.
**Where**: `backend/src/main/java/io/github/tiaggofg/lumo/infrastructure/auth/GoogleOAuthHttpClient.java`
**Depends on**: T5
**Reuses**: `backend/src/main/java/io/github/tiaggofg/lumo/application/auth/GoogleOAuthClientPort.java`
**Requirement**: AUTH-01

**Done when**:
- [x] `GoogleOAuthHttpClient` posts `grant_type=authorization_code`, `code`, `code_verifier`, `client_id`, `client_secret`, `redirect_uri` with 10s timeout
- [x] Verifies RS256 signature using JWKS RSA modulus/exponent (`n`/`e`), validates `iss`, `aud == clientId`, `exp`, and extracts `sub`, `email`, `email_verified`, `name`, `picture`
- [x] Caches JWKS keys and refreshes once on unknown `kid`; maps timeouts/network/HTTP failures to `OAuthAuthenticationException("provider_unavailable")` without logging secrets or tokens
- [x] `GoogleOAuthHttpClientTest` covers valid token, tampered signature, wrong `aud`, expired `id_token`, JWKS key rotation (`kid` miss), and HTTP timeout/500
- [x] Gate check passes: `cd backend && ./mvnw test`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): add google oauth http client with rs256 jwks verification`

---

### T7: Implement `AuthResource` (`/api/v1/auth/*`) and RFC 9457 auth exception mappings

**What**: Implement `AuthResource` (`GET /providers`, `GET /google/login`, `GET /google/callback`, `POST /dev-login`, `POST /refresh`, `POST /logout`, `GET /me`) and map auth domain exceptions (`UnauthorizedException` → `401`, `AccountDisabledException` → `403`, `DevLoginDisabledException` → `404`) in `ProblemDetailExceptionMapper`, plus `AuthResourceIT` using a `@TestProfile` / `@InjectMock` `GoogleOAuthClientPort`.
**Where**: `backend/src/main/java/io/github/tiaggofg/lumo/infrastructure/auth/AuthResource.java`
**Depends on**: T6
**Reuses**: `backend/src/main/java/io/github/tiaggofg/lumo/infrastructure/web/error/ProblemDetailExceptionMapper.java`
**Requirement**: AUTH-01, AUTH-02, AUTH-03, AUTH-06

**Done when**:
- [x] `GET /api/v1/auth/providers` returns `{ googleEnabled, devLoginEnabled }`
- [x] `GET /api/v1/auth/google/login` sets signed `HttpOnly` `lumo_oauth_state` (5m) and redirects `302` to Google with PKCE `S256` + `state` (or `/login?error=provider_unavailable` if Google credentials are blank)
- [x] `GET /api/v1/auth/google/callback` validates `state`, issues `lumo_access` + `lumo_refresh` cookies, clears `lumo_oauth_state`, redirects to sanitized `returnUrl`, and redirects to `/login?error=<code_reason>` on denial/invalid state/invalid token/allowlist block/disabled account
- [x] `POST /api/v1/auth/dev-login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, and `GET /api/v1/auth/me` behave per spec ACs and log security events without secrets/tokens
- [x] `AuthResourceIT` passes covering all endpoints, error redirects, refresh rotation/reuse rejection, and logout revocation
- [x] Gate check passes: `cd backend && ./mvnw verify`

**Tests**: integration
**Gate**: full
**Commit**: `feat(auth): add auth rest resource and rfc 9457 error mappings`

---

### T8: Implement `AuthRequestFilter` protecting `/api/v1/**`, update existing `*ResourceIT` suites and verify `%prod` dev-login block

**What**: Implement `AuthRequestFilter` (`ContainerRequestFilter`, `@Priority(Priorities.AUTHENTICATION)`) and `AuthenticatedUserContext` (`@RequestScoped`) enforcing valid `lumo_access` JWT + active user on all `/api/v1/**` business endpoints and `/api/v1/auth/me` while keeping public auth routes and `/q/health/**` accessible; add `AuthTestHelper` for existing `*ResourceIT` suites and add `AuthProtectionIT` (including a `DevLoginDisabledProfile` test asserting `404` on `/api/v1/auth/dev-login`).
**Where**: `backend/src/main/java/io/github/tiaggofg/lumo/infrastructure/auth/AuthRequestFilter.java`
**Depends on**: T7
**Reuses**: `backend/src/main/java/io/github/tiaggofg/lumo/infrastructure/web/error/ProblemDetail.java`
**Requirement**: AUTH-02, AUTH-06

**Done when**:
- [x] Unauthenticated requests to `/api/v1/budgets`, `/api/v1/categories`, `/api/v1/beneficiaries`, `/api/v1/recurring-transactions`, `/api/v1/transactions/**` and `/api/v1/auth/me` return `401 Unauthorized` with `application/problem+json`
- [x] `/q/health/ready` and `/q/health/live` return `200 OK` without authentication
- [x] `AuthProtectionIT` verifies disabled `dev-login` profile returns `404 Not Found` (`application/problem+json`) and `devLoginEnabled: false`
- [x] All existing `*ResourceIT` tests authenticate via `AuthTestHelper` and pass 100% (`./mvnw verify`)
- [x] Gate check passes: `cd backend && ./mvnw verify`

**Tests**: integration
**Gate**: full
**Commit**: `feat(auth): protect api v1 endpoints with jwt cookie request filter`

---

### T9: Implement Angular `AuthService` (Signals), `authGuard`, `guestGuard` and `sanitizeReturnUrl`

**What**: Create `auth.models.ts`, `AuthService` (Signals for `user`, `status`, `isAuthenticated`, plus `ensureSessionLoaded`, `loadProviders`, `startGoogleLogin`, `loginAsDev`, `refreshSession`, `logout`, `clearLocalState`), and functional route guards `authGuard`, `guestGuard`, and `sanitizeReturnUrl` under `frontend/src/app/core/auth/` with Vitest unit tests.
**Where**: `frontend/src/app/core/auth/auth.service.ts`
**Depends on**: T8
**Reuses**: `frontend/src/app/core/services/theme.service.ts`
**Requirement**: AUTH-04, AUTH-05, AUTH-06

**Done when**:
- [x] `AuthService` resolves initial session state via `GET /api/v1/auth/me` (`withCredentials: true`), deduplicating concurrent boot calls
- [x] `sanitizeReturnUrl` accepts only internal relative paths starting with `/` (rejecting `//`, `http://`, `https://`, `/login`, empty) falling back to `/dashboard`
- [x] `authGuard` redirects unauthenticated navigation to `/login?returnUrl=<encoded_path>` and `guestGuard` redirects authenticated users from `/login` to sanitized `returnUrl` or `/dashboard`
- [x] `auth.service.spec.ts` and `auth.guard.spec.ts` pass covering all states and edge cases
- [x] Gate check passes: `cd frontend && npm test -- --watch=false`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): add angular auth service guards and returnUrl sanitizer`

---

### T10: Implement `authInterceptor` (single-flight refresh) and update `problemDetailInterceptor` & `app.config.ts`

**What**: Create `authInterceptor` attaching `withCredentials: true` on `/api/` requests, intercepting `401` on business calls to run one deduplicated `POST /api/v1/auth/refresh` and replay queued requests (or clear auth state and redirect to `/login` on failure), update `problemDetailInterceptor` to skip error toasts for expected auth `401` responses (`/api/v1/auth/me` and `/api/v1/auth/refresh`), and register `[authInterceptor, problemDetailInterceptor]` in `app.config.ts`, with Vitest specs.
**Where**: `frontend/src/app/core/auth/auth.interceptor.ts`
**Depends on**: T9
**Reuses**: `frontend/src/app/core/interceptors/problem-detail.interceptor.ts`, `frontend/src/app/app.config.ts`
**Requirement**: AUTH-04, AUTH-05

**Done when**:
- [x] Parallel `401` responses trigger `POST /api/v1/auth/refresh` exactly once and replay every pending request transparently without emitting an error toast
- [x] When `POST /api/v1/auth/refresh` fails (`401`), `authInterceptor` clears `AuthService` state and redirects to `/login`
- [x] `problemDetailInterceptor` does not show an error toast on `401` from `/api/v1/auth/me` or `/api/v1/auth/refresh`
- [x] `auth.interceptor.spec.ts` and `problem-detail.interceptor.spec.ts` pass
- [x] Gate check passes: `cd frontend && npm test -- --watch=false`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): add single-flight refresh interceptor and silent 401 handling`

---

### T11: Create `LoginPageComponent`, restructure root routes and add user profile + Logout to `AppShellComponent`

**What**: Build full-screen `LoginPageComponent` (`/login` with `<app-lumo-logo>`, Light/Dark toggle, `"Entrar com Google"`, conditional `"Entrar como Dev"`, and PT-BR error banners for `?error=`), update `App` and `app.routes.ts` so `/login` renders outside `AppShellComponent` with `guestGuard` while authenticated routes render inside `AppShellComponent` with `authGuard`, and add user profile (avatar/initials + name/email) and `"Sair"` button (`data-testid="logout-button-desktop"` and `data-testid="logout-button-mobile"`) to desktop sidebar (expanded & collapsed `w-20` rail with `[zTooltip]`) and mobile drawer, with Vitest specs.
**Where**: `frontend/src/app/features/auth/login-page.component.ts`
**Depends on**: T10
**Reuses**: `frontend/src/app/core/layout/app-shell.component.ts`, `frontend/src/app/shared/ui/logo/lumo-logo.component.ts`, `frontend/src/app/shared/ui/button/z-button.component.ts`
**Requirement**: AUTH-04, AUTH-05, AUTH-06

**Done when**:
- [x] `/login` renders full-screen without sidebar/top-bar, displays `<app-lumo-logo>`, Light/Dark toggle, `data-testid="google-login-button"`, conditional `data-testid="dev-login-button"` (only when `devLoginEnabled: true`), and mapped PT-BR alerts for all 6 `?error=` codes
- [x] `App` renders `<z-toast-viewport />`, `<z-confirm-dialog />`, and `<router-outlet />`; `app.routes.ts` wraps `/dashboard`, `/budgets`, `/budgets/:id`, `/recurrences`, `/catalog` under `AppShellComponent` with `canActivate: [authGuard]`
- [x] `AppShellComponent` displays logged-in user avatar (or initials fallback), name/email, and `"Sair"` button in both desktop sidebar (adapting cleanly when collapsed to `w-20`) and mobile drawer, invoking `authService.logout()`
- [x] `login-page.component.spec.ts` and updated `app-shell.component.spec.ts` pass and lint/build are green
- [x] Gate check passes: `cd frontend && npm run lint && npm run build && npm test -- --watch=false`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): add login page route guards and shell user profile logout`

---

### T12: Add Playwright E2E auth suite, update MVP E2E suite, synchronize docs and run quality gate

**What**: Create `frontend/e2e/auth.spec.ts` validating anonymous redirect + `returnUrl`, `/login?error=` alerts, Dev login, session persistence across page reload, desktop/mobile user profile + logout, update `frontend/e2e/lumo-mvp.spec.ts` to authenticate via Dev login before running financial flows, synchronize `docs/` (`arquitetura-c4.md`, `modelo-dominio-e-dados.md`, `fluxos-e-sequencias.md`, `api-rest.md`, `seguranca-e-privacidade.md`, `deploy-e-ci-cd.md`, `adr/README.md`) and `README.md`, and run full backend + frontend + E2E + SonarQube quality checks.
**Where**: `frontend/e2e/auth.spec.ts`
**Depends on**: T11
**Reuses**: `frontend/e2e/lumo-mvp.spec.ts`, `docs/seguranca-e-privacidade.md`, `docs/arquitetura-c4.md`
**Requirement**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06

**Done when**:
- [x] `frontend/e2e/auth.spec.ts` passes on desktop (`1280x800`) and mobile (`390x844`) with zero console errors
- [x] `frontend/e2e/lumo-mvp.spec.ts` passes 100% against the authenticated backend/frontend stack
- [x] `docs/` and `README.md` document Google OAuth 2.0 + PKCE architecture, `users`/`refresh_sessions` ER model, `/api/v1/auth/*` endpoints, env vars, and `AD-011`
- [x] Full gates pass: `cd backend && ./mvnw verify`, `cd frontend && npm run lint && npm run build && npm test -- --watch=false && npx playwright test --reporter=list`, and `.agents/scripts/quality-check.sh --up`

**Tests**: e2e
**Gate**: full
**Commit**: `test(auth): add e2e auth suite and sync security architecture docs`

---

## Checks

**C1** - `GET /api/v1/auth/google/login` sets signed `HttpOnly` `lumo_oauth_state` (5m) with PKCE `S256` and redirects `302` to Google OAuth2 authorization URL (AUTH-01, AC 1)
Proof: run backend-it | AuthResourceIT

**C2** - `GET /api/v1/auth/google/callback` exchanges code, verifies JWKS RS256 `id_token` (`iss`, `aud`, `exp`, `email_verified`), upserts `User`, persists `RefreshSession`, sets `lumo_access` + `lumo_refresh` cookies, and redirects to sanitized `returnUrl` (AUTH-01, AC 2)
Proof: run backend-unit | GoogleOAuthHttpClientTest

**C3** - Failed Google callbacks (`access_denied`, mismatched `state`, unverified email, disabled account, provider outage) clear `lumo_oauth_state`, create no session, and redirect to `/login?error=<reason_code>` (AUTH-01, AC 3)
Proof: run backend-it | AuthResourceIT

**C4** - Optional `LUMO_ALLOWED_EMAILS` blocks non-listed emails (case-insensitive) when configured and permits all Google-verified emails when empty (AUTH-01, AC 4)
Proof: run backend-unit | AuthUseCasesTest

**C5** - `domain.auth` (`User`, `RefreshSession`) has zero Quarkus/Jakarta/Hibernate/Jackson dependencies and migrates cleanly via `003-create-auth-schema.sql` (AUTH-01, AC 5)
Proof: run backend-unit | CleanArchitectureArchTest

**C6** - Protected `/api/v1/**` endpoints and `/api/v1/auth/me` reject unauthenticated requests with `401 Unauthorized` (`application/problem+json`), while `/q/health/ready` stays `200 OK` (AUTH-02, AC 1, AC 2, AC 7)
Proof: run backend-it | AuthProtectionIT

**C7** - `GET /api/v1/auth/me` returns `{ id, email, name, avatarUrl }`, `POST /api/v1/auth/refresh` atomically rotates `RefreshSession` rejecting reused/expired tokens, and `POST /api/v1/auth/logout` revokes the session and clears cookies (`204`) (AUTH-03, AC 3, AC 4, AC 5, AC 6)
Proof: run backend-it | AuthResourceIT

**C8** - `%prod` startup fails when `LUMO_AUTH_JWT_SECRET` is missing or shorter than 32 characters (AUTH-03, AC 8)
Proof: run backend-unit | AuthStartupValidatorTest

**C9** - Unauthenticated navigation redirects to `/login?returnUrl=...` without rendering `AppShellComponent`; `/login` shows Lumo logo, `"Entrar com Google"`, error alerts, and rejects open-redirect `returnUrl`; authenticated users visiting `/login` redirect to `/dashboard` (AUTH-04, AC 1, AC 2, AC 3, AC 4)
Proof: run frontend-unit | LoginPageComponent

**C10** - `authInterceptor` deduplicates parallel `401` refreshes into one `POST /api/v1/auth/refresh`, replays requests silently without error toasts, and `AppShellComponent` displays logged-in user profile and working `"Sair"` button on desktop (expanded/collapsed) and mobile (AUTH-05, AC 5, AC 6, AC 7)
Proof: run frontend-unit | authInterceptor

**C11** - `POST /api/v1/auth/dev-login` issues valid cookies in `%dev`/`%test` and returns `404 Not Found` (`devLoginEnabled: false`) when disabled (`%prod`), and `/login` renders `"Entrar como Dev"` only when `devLoginEnabled: true` (AUTH-06, AC 1, AC 2, AC 3, AC 4)
Proof: run backend-it | AuthProtectionIT

**C12** - End-to-end Playwright suite proves full login, `returnUrl`, reload persistence, profile/logout on desktop and mobile, and zero regressions across `/dashboard`, `/budgets`, `/recurrences`, and `/catalog` (AUTH-04, AUTH-05, AUTH-06)
Proof: run e2e | auth.spec.ts

---

## Handoff

The feature's live state, written as it happens - a compaction gives no warning.

**Settled mid-build:** none
**Dispatched:** none
**Walked:** none

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3

Phase 1:  T1 ------→ T2 ------→ T3 ------→ T4
Phase 2:  T5 ------→ T6 ------→ T7 ------→ T8
Phase 3:  T9 ------→ T10 -----→ T11 -----→ T12
```

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: Liquibase `003-create-auth-schema.sql` & auth config properties | Schema migration + config + `LiquibaseMigrationIT` | ✅ Granular |
| T2: Pure Java `domain.auth` (`User`, `RefreshSession`, ports, exceptions) | Domain models + unit/ArchUnit tests | ✅ Granular |
| T3: JPA auth entities & repository adapters (`revokeIfActive`) | Persistence adapters + `AuthPersistenceIT` | ✅ Granular |
| T4: Auth application ports & use cases | Application use cases + unit tests | ✅ Granular |
| T5: `AuthConfig`, `AuthStartupValidator`, `JwtTokenService`, `OAuthStateCookieCodec`, `AuthCookieHelper` | Crypto/cookie utilities + unit tests | ✅ Granular |
| T6: `GoogleOAuthHttpClient` (token exchange + RS256 JWKS verification) | 1 external client adapter + unit tests | ✅ Granular |
| T7: `AuthResource` (`/api/v1/auth/*`) & RFC 9457 error mappings | 1 REST resource + `AuthResourceIT` | ✅ Granular |
| T8: `AuthRequestFilter` protecting `/api/v1/**` & IT auth cutover | 1 security filter + `AuthProtectionIT` + `*ResourceIT` helper | ✅ Granular |
| T9: Angular `AuthService`, `authGuard`, `guestGuard`, `sanitizeReturnUrl` | Core auth state/guards + unit tests | ✅ Granular |
| T10: Angular `authInterceptor` (single-flight refresh) & 401 toast suppression | HTTP interceptor + unit tests | ✅ Granular |
| T11: `LoginPageComponent`, root route restructuring & shell profile/logout | Login UI + shell auth footer + unit tests | ✅ Granular |
| T12: Playwright E2E auth suite, MVP E2E update, docs sync & quality gate | E2E specs + docs + verification | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | Phase 1 start | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |
| T11 | T10 | T10 → T11 | ✅ Match |
| T12 | T11 | T11 → T12 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1: Liquibase auth schema & config | Backend Liquibase (`db/changelog/**`) | integration | integration | ✅ OK |
| T2: Pure Java `domain.auth` | Backend Auth Domain (`domain/auth/**`) | unit | unit | ✅ OK |
| T3: JPA auth adapters | Backend Persistence (`infrastructure/persistence/auth/**`) | integration | integration | ✅ OK |
| T4: Auth application use cases | Backend Auth Application (`application/auth/**`) | unit | unit | ✅ OK |
| T5: Crypto, cookies & startup check | Backend Auth Infrastructure (`infrastructure/auth/**`) | unit | unit | ✅ OK |
| T6: `GoogleOAuthHttpClient` | Backend Auth Infrastructure (`infrastructure/auth/**`) | unit | unit | ✅ OK |
| T7: `AuthResource` & error mappings | Backend Auth Endpoints (`AuthResource.java`) | integration | integration | ✅ OK |
| T8: `AuthRequestFilter` & IT updates | Backend API Filter (`AuthRequestFilter.java`) | integration | integration | ✅ OK |
| T9: Angular `AuthService` & guards | Frontend Auth Core (`core/auth/**`) | unit | unit | ✅ OK |
| T10: Angular `authInterceptor` | Frontend Auth Core (`core/auth/**`) | unit | unit | ✅ OK |
| T11: `LoginPageComponent` & `AppShellComponent` | Frontend Auth UI & Shell (`features/auth/**`, `core/layout/**`) | unit | unit | ✅ OK |
| T12: Playwright E2E suite & docs sync | Full-Stack Auth & Regression UI Flows (`frontend/e2e/**`) | e2e | e2e | ✅ OK |
