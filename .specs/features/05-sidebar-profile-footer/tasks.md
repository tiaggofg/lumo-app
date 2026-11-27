# Sidebar Profile Footer & Account Popover Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, the walk, check_proofs, the Verifier and the screens sub-agent).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/05-sidebar-profile-footer/spec.md`
**Design**: skipped (scope Medium — componente Angular standalone + ajuste localizado em `AppShellComponent`, sem novas decisões arquiteturais além de `AD-012`)
**Status**: Completed
**Approved**: 2026-11-27 - user: "/implement-spec-tasks 05-sidebar-profile-footer"
**Build**: `cd frontend && npm run lint; cd frontend && npm run build; cd frontend && npm test -- --watch=false`
**Run unit**: `cd frontend && npx ng test --watch=false --include=src/app/core/layout/*.spec.ts`

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md`, `frontend/package.json`, `frontend/src/app/core/layout/app-shell.component.spec.ts`, `frontend/e2e/auth.spec.ts`, `frontend/e2e/lumo-mvp.spec.ts`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Frontend UI Component (`layout/`) | unit | 1:1 para critérios de renderização, estado do popover, teclado (`Escape`), clique externo, fallback de iniciais, truncamento e emissão de logout | `frontend/src/app/core/layout/*.spec.ts` | `cd frontend && npx ng test --watch=false --include=src/app/core/layout/*.spec.ts` |
| Frontend E2E (`e2e/`) | e2e | Desktop (expandido e recolhido) + Mobile (drawer e remoção do toggle na top bar): abertura/fechamento do popover, troca de tema, logout e validação visual das capturas | `frontend/e2e/*.spec.ts` | `cd frontend && npx playwright test --reporter=list` |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | After tasks with unit tests only | `cd frontend && npx ng test --watch=false --include=src/app/core/layout/*.spec.ts` |
| Full | After tasks with e2e tests | `cd frontend && npm test -- --watch=false && npx playwright test --reporter=list` |
| Build | After phase completion | `cd frontend && npm run lint && npm run build && npm test -- --watch=false` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Profile Popover, Shell Footer & E2E Verification

```
T1 → T2 → T3 → T4
```

---

## Task Breakdown

### T1: Create `UserProfilePopoverComponent` with unit tests

**What**: Criar componente standalone `UserProfilePopoverComponent` para exibir o popover flutuante de conta (quadrado arredondado com a inicial do usuário, nome truncado, divisor horizontal, e-mail truncado e botão `Sair` com ícone de saída, sem `My profile`, `+ Create team` ou `✓` conforme `AD-012`), emitindo `logout` e `closed` (clique externo e tecla `Escape`).
**Where**: `frontend/src/app/core/layout/user-profile-popover.component.ts`
**Depends on**: None
**Reuses**: `frontend/src/app/core/auth/auth.models.ts` (`AuthUser`), Tailwind CSS v4 tokens e PrimeIcons (`pi-sign-out`)
**Requirement**: POPOVER-01, POPOVER-02, POPOVER-03, POPOVER-04, EDGE-03, EDGE-04

**Done when**:

- [x] Componente renderiza o layout de `.specs/features/05-sidebar-profile-footer/captures/profile-popover.png` aplicando as diferenças de `AD-012` (badge quadrado arredondado com primeira inicial, `user.name` com `truncate`, divisor, `user.email` com `truncate` e botão `Sair` com `pi-sign-out`).
- [x] Não renderiza `My profile`, `+ Create team` nem ícone `✓`.
- [x] Mantém contraste adequado nos temas claro e escuro (`EDGE-04`) e `z-index` elevado sobre o conteúdo principal (`POPOVER-02`).
- [x] Emite `closed` ao pressionar `Escape` ou clicar fora do popover e emite `logout` ao clicar em `Sair`.
- [x] Testes unitários co-localizados em `frontend/src/app/core/layout/user-profile-popover.component.spec.ts` cobrem renderização, truncamento, ausência de itens excluídos, `Escape`, clique externo e clique em `Sair`.
- [x] Gate check passes: `cd frontend && npx ng test --watch=false --include=src/app/core/layout/*.spec.ts`
- [x] Test count: >= 5 tests pass in `user-profile-popover.component.spec.ts` (no silent deletions)

**Tests**: unit
**Gate**: quick
**Commit**: `feat(shell): add anchored user profile popover component`

---

### T2: Refactor `AppShellComponent` footer for desktop and mobile

**What**: Refatorar o rodapé da sidebar desktop e do drawer mobile em `AppShellComponent` para exibir a foto de perfil circular (ou fallback de iniciais) à esquerda e o botão quadrado com borda de troca de tema à direita na mesma linha (`sidebar-footer.png`), empilhar verticalmente quando `sidebarCollapsed()` for `true`, remover o botão de tema duplicado da barra superior mobile, integrar `UserProfilePopoverComponent` ancorado ao avatar (com `aria-expanded`, fechamento ao alternar colapso/fechar drawer e logout via `AuthService.logout()`), atualizando `app-shell.component.spec.ts`.
**Where**: `frontend/src/app/core/layout/app-shell.component.ts`
**Depends on**: T1
**Reuses**: `frontend/src/app/core/layout/user-profile-popover.component.ts`, `ThemeService`, `AuthService`, `ZTooltipDirective`
**Requirement**: SHELL-01, SHELL-02, SHELL-03, SHELL-04, POPOVER-01, POPOVER-02, POPOVER-03, POPOVER-04, EDGE-01, EDGE-02, EDGE-04

**Done when**:

- [x] Rodapé desktop expandido (`data-collapsed="false"`) reproduz `.specs/features/05-sidebar-profile-footer/captures/sidebar-footer.png` (foto circular à esquerda, botão quadrado com borda de tema à direita na mesma linha, sem nome/e-mail/botão "Sair" inline).
- [x] Rodapé desktop recolhido (`data-collapsed="true"`) empilha verticalmente e centraliza o botão da foto de perfil e o botão de tema, com tooltips de acessibilidade.
- [x] Drawer mobile (`data-testid="mobile-drawer"`) exibe o mesmo rodapé (avatar + botão de tema na mesma linha) e a barra superior mobile (`header`) não renderiza botão de alternância de tema.
- [x] Clicar na foto de perfil abre/fecha `UserProfilePopoverComponent` ancorado sem corte por `overflow` da sidebar, atualiza `aria-expanded`, fecha ao chamar `toggleSidebar()` ou fechar o drawer mobile, e executa `AuthService.logout()` ao clicar em `Sair`.
- [x] Fallback circular com `userInitials()` funciona quando `currentUser.avatarUrl` é `null` ou vazio (`EDGE-01`).
- [x] Testes unitários em `frontend/src/app/core/layout/app-shell.component.spec.ts` validam todos os requisitos `SHELL-01..04`, `POPOVER-01..04`, `EDGE-01..02` e `EDGE-04`.
- [x] Gate check passes: `cd frontend && npm run lint && npm run build && npm test -- --watch=false`
- [x] Test count: >= 8 tests pass in `app-shell.component.spec.ts` (no silent deletions)

**Tests**: unit
**Gate**: build
**Commit**: `feat(shell): compact menu footer with profile popover`

---

### T3: Update auth Playwright E2E spec for profile popover logout

**What**: Atualizar `frontend/e2e/auth.spec.ts` para validar o rodapé compacto (avatar + botão de tema na mesma linha), abertura do popover de perfil ao clicar no avatar (verificando inicial, nome, e-mail e ausência de `My profile`), fechamento com `Escape`/clique fora e logout via botão `Sair` no popover em desktop e mobile.
**Where**: `frontend/e2e/auth.spec.ts`
**Depends on**: T2
**Reuses**: `frontend/e2e/auth.spec.ts` (helper de login dev e asserções desktop/mobile)
**Requirement**: SHELL-01, SHELL-04, POPOVER-01, POPOVER-03, POPOVER-04

**Done when**:

- [x] Fluxo desktop e mobile em `frontend/e2e/auth.spec.ts` abre o popover clicando no avatar, valida nome/e-mail/botão `Sair`, valida fechamento por `Escape`, e realiza logout redirecionando para `/login`.
- [x] Gate check passes: `cd frontend && npx playwright test e2e/auth.spec.ts --reporter=list`
- [x] Test count: all tests in `frontend/e2e/auth.spec.ts` pass on Desktop Chrome and Mobile Safari/Chrome viewports

**Tests**: e2e
**Gate**: full
**Commit**: `test(e2e): verify profile popover and logout flow`

---

### T4: Update theme toggle Playwright E2E spec for mobile drawer footer

**What**: Atualizar `frontend/e2e/lumo-mvp.spec.ts` para acionar a alternância de tema no mobile a partir do rodapé do drawer (`mobile-drawer`), verificando também a ausência do botão de tema duplicado na barra superior mobile e a alternância normal no rodapé desktop.
**Where**: `frontend/e2e/lumo-mvp.spec.ts`
**Depends on**: T3
**Reuses**: `frontend/e2e/lumo-mvp.spec.ts` (cenário existente de dark mode toggle)
**Requirement**: SHELL-03, SHELL-04

**Done when**:

- [x] Teste de alternância de tema em `frontend/e2e/lumo-mvp.spec.ts` abre o drawer no mobile para clicar no botão de tema no rodapé e confirma ausência de `theme-toggle` na barra superior mobile.
- [x] Gate check passes: `cd frontend && npm test -- --watch=false && npx playwright test --reporter=list`
- [x] Test count: full Vitest + Playwright desktop & mobile suites pass with 0 failures

**Tests**: e2e
**Gate**: full
**Commit**: `test(e2e): adapt mobile theme toggle to drawer footer`

---

## Checks

**C1** - Rodapé desktop expandido exibe foto circular à esquerda e botão quadrado de tema à direita na mesma linha conforme `captures/sidebar-footer.png` (SHELL-01, AC 1)
Proof: browser captures/sidebar-footer.running.png

**C2** - Sidebar desktop recolhida empilha verticalmente e centraliza o botão da foto de perfil e o botão de tema com tooltips (SHELL-02, AC 2)
Proof: run unit | should stack profile avatar and theme toggle vertically when sidebar is collapsed

**C3** - Clique no botão de alternância de tema no rodapé desktop e mobile alterna modo claro/escuro e atualiza ícone e `aria-label` (SHELL-03, AC 3)
Proof: run unit | should toggle dark mode from desktop and mobile drawer footer

**C4** - Drawer mobile exibe rodapé com avatar e tema na mesma linha e barra superior mobile não exibe botão de tema (SHELL-04, AC 4)
Proof: run unit | should render footer in mobile drawer and omit theme toggle from mobile header

**C5** - Clique na foto de perfil abre o popover ancorado com inicial em quadrado arredondado, nome, divisor, e-mail e botão `Sair` conforme `captures/profile-popover.png` e `AD-012` (POPOVER-01, AC 1)
Proof: browser captures/profile-popover.running.png

**C6** - Enquanto aberto, o popover mantém `aria-expanded="true"` no botão do avatar e renderiza acima do conteúdo principal sem corte (POPOVER-02, AC 2)
Proof: run unit | should set aria-expanded and render popover above main content

**C7** - Clique fora, segundo clique no avatar ou tecla `Escape` fecha o popover e restaura `aria-expanded="false"` (POPOVER-03, AC 3)
Proof: run unit | should close popover on outside click, second toggle click, or Escape key

**C8** - Clique em `Sair` dentro do popover fecha o popover/drawer e invoca `AuthService.logout()` redirecionando para `/login` (POPOVER-04, AC 4)
Proof: `cd frontend && npx playwright test e2e/auth.spec.ts --reporter=list`

**C9** - Quando `avatarUrl` é `null` ou vazio, o botão do rodapé renderiza o fallback circular com `userInitials()` mantendo clicabilidade (EDGE-01)
Proof: run unit | should render user initials fallback when avatarUrl is null

**C10** - Alternar `toggleSidebar()` ou fechar o drawer mobile fecha o popover de perfil aberto (EDGE-02)
Proof: run unit | should close profile popover when toggling sidebar collapse or closing mobile drawer

**C11** - Nome e e-mail longos são truncados com `truncate` dentro do popover sem quebrar o layout (EDGE-03)
Proof: run unit | should apply truncation classes to long user name and email

**C12** - Alternar o tema enquanto o popover está aberto preserva contraste e funcionalidade nos modos claro e escuro (EDGE-04)
Proof: run unit | should keep profile popover readable when theme changes while open

---

## Handoff

The feature's live state, written as it happens - a compaction gives no warning.

**Settled mid-build:** none
**Dispatched:** none
**Walked:** none
