# STATE

## Decisions

### AD-001
- **Decision**: Adotar o nome de produto **Lumo** em monorepo (`backend/`, `frontend/`, `docker-compose.yml`) com package Java base `io.github.tiaggofg.lumo`.
- **Reason**: Alinhar nomenclatura do produto, código-fonte, schema e documentação ao repositório `lumo-app`.
- **Trade-off**: Centraliza backend e frontend no mesmo histórico Git, exigindo disciplina de escopo em commits e CI por diretório.
- **Scope**: Projeto inteiro.
- **Date**: 2026-11-26
- **Status**: active

### AD-002
- **Decision**: Construir o backend em **Java 25 + Quarkus 3.33 LTS (`3.33.4.2`) + Maven + PostgreSQL + Liquibase (SQL formatado)**.
- **Reason**: Reduzir consumo de RAM/CPU em ambientes enxutos (~100–160 MB RSS em JVM mode, pronto para Native Image no futuro), com suporte LTS a Java 25, live reload (`quarkus:dev`) e Dev Services.
- **Trade-off**: Menos convenções prontas que Spring Boot para `ProblemDetail` e `@Transactional(readOnly = true)`, compensadas por um `ExceptionMapper` RFC 9457 próprio e interceptor CDI leve.
- **Scope**: `backend/`.
- **Date**: 2026-11-26
- **Status**: active

### AD-003
- **Decision**: Aplicar Clean Architecture + DDD estrito no backend: `domain` 100% Java puro (sem Quarkus/CDI/JPA) com estereótipos próprios (`AggregateRoot`, `Entity<T>`, `ValueObject`); `application` com `@Command` (`@Stereotype` + `@ApplicationScoped` + `@Transactional`) e `@Query` (`@Stereotype` + `@ApplicationScoped` + interceptor read-only); fronteiras verificadas por ArchUnit.
- **Reason**: Isolar regras financeiras críticas de detalhes de framework e garantir evolução segura nas Fases 2+ (importadores, projeções, ML/LLM).
- **Trade-off**: Maior número de classes de mapeamento entre domínio e entidades JPA em troca de testabilidade pura e isolamento duradouro.
- **Scope**: `backend/`.
- **Date**: 2026-11-26
- **Status**: active

### AD-004
- **Decision**: `MonthlyBudget` e `Transaction` são Aggregate Roots independentes; `MonthlyBudget` não persiste `totalIncome`, `totalExpense` nem `balance`. Os totais (Previsto e Realizado) são calculados dinamicamente via Read Model/Query agregada.
- **Reason**: Preservar o limite transacional de um agregado por transação e eliminar risco de dessincronização entre lançamentos e totais do mês.
- **Trade-off**: Consultas de listagem e detalhe de orçamentos executam agregação SQL (`SUM` condicional por tipo e status), facilmente atendida com índice composto em `(monthly_budget_id, type, status)`.
- **Scope**: Domínio financeiro (`MonthlyBudget`, `Transaction`).
- **Date**: 2026-11-26
- **Status**: active

### AD-005
- **Decision**: Usar enum neutro `TransactionStatus` (`ESTIMATED`, `PENDING`, `SETTLED`) para despesas e receitas, expondo dois pares de métricas no orçamento: **Previsto** (`ESTIMATED + PENDING + SETTLED`) e **Realizado** (`SETTLED`).
- **Reason**: Evitar enum duplicado para receitas/despesas no domínio mantendo linguagem natural na UI (`Pago` para `EXPENSE`, `Recebido` para `INCOME`) e dando visibilidade imediata do caixa realizado vs. planejado.
- **Trade-off**: A camada de apresentação traduz o rótulo de `SETTLED` conforme `TransactionType`.
- **Scope**: Domínio financeiro e Frontend.
- **Date**: 2026-11-26
- **Status**: active

### AD-006
- **Decision**: Modelar `RecurringTransaction` com três modos (`INDEFINITE`, `FIXED_TERM`, `INSTALLMENT`), `amountType` (`FIXED` ou `ESTIMATED`), `dueDay` opcional (1..31 com clamp para fim do mês), materialização automática na criação de `MonthlyBudget` e nos budgets elegíveis atuais/futuros na criação de `RecurringTransaction`, supressão de ocorrências excluídas manualmente por mês, propagação opt-in na edição (nunca tocando `SETTLED`) e remoção opt-in de futuras abertas na desativação.
- **Reason**: Cobrir todos os casos reais da planilha do usuário (contas fixas, variáveis como água/luz, prazos "Até Novembro" e parcelamentos já em andamento) sem duplicações nem mutação silenciosa do histórico pago.
- **Trade-off**: Exige tabela auxiliar `recurring_occurrence_exclusions` para impedir recriação após exclusão pontual em um mês.
- **Scope**: Motor de recorrências.
- **Date**: 2026-11-26
- **Status**: active

### AD-007
- **Decision**: Expor API REST sob `/api/v1`, com identificadores `UUID` gerados no domínio, erros no formato RFC 9457 (`application/problem+json`), documentação OpenAPI/Swagger, e sem autenticação na Fase 1.
- **Reason**: Priorizar entrega rápida do núcleo financeiro pessoal/familiar mantendo contratos padronizados e prontos para adicionar Auth/Household na Fase 2.
- **Trade-off**: Deploy público na Fase 1 exige proteção de rede externa (VPN/reverse proxy autenticado) até a Fase 2.
- **Scope**: API REST e Segurança.
- **Date**: 2026-11-26
- **Status**: active

### AD-008
- **Decision**: Construir o frontend em **Angular v22 (Standalone + Signals) + Tailwind CSS + PrimeNG v22**, estado via Signals/Services, layout desktop-first responsivo com cards adaptados no mobile e tema Light padrão com toggle Dark Mode.
- **Reason**: Produtividade em tabelas financeiras, diálogos e filtros com PrimeNG, estilização ágil com Tailwind e reatividade simples com Signals sem boilerplate de store global.
- **Trade-off**: Verificar termos de licença de componentes específicos do PrimeNG v22 durante setup, restringindo uso a componentes gratuitos/MIT ou Tailwind/CDK se algum componente exigir licença comercial.
- **Scope**: `frontend/`.
- **Date**: 2026-11-26
- **Status**: superseded by AD-010

### AD-009
- **Decision**: Adotar a identidade visual **Royal Indigo (`#4F46E5`) & Azul Safira (`#0284C7`)** (100% sem verde) com preset PrimeNG Aura customizado para `indigo`, tipografia ampliada (**Plus Jakarta Sans** + **JetBrains Mono** com `15px–16px` nas tabelas e `30px–36px` nos KPIs), layout fluido em tela cheia (`w-full` sem `max-w-7xl`), cabeçalho `"Status"` com `pTooltip` no orçamento mensal e página dedicada de **Dashboard (`/dashboard`)** como rota padrão com gráficos multicoloridos e evolução mensal.
- **Reason**: Eliminar a aparência monocromática esverdeada, melhorar a legibilidade e o aproveitamento de monitores largos, e separar a visualização analítica (`/dashboard`) da operação diária de lançamentos (`/budgets/:id`).
- **Trade-off**: Requer resolvedor de paleta categórica no frontend para substituir cores legadas verdes/duplicadas nos gráficos mantendo compatibilidade com dados existentes no banco.
- **Scope**: `frontend/`.
- **Date**: 2026-11-26
- **Status**: active

### AD-010
- **Decision**: Substituir completamente o `primeng` e `@primeuix/themes` por uma suíte própria de componentes **ZardUI (estilo shadcn/ui para Angular v22 — 100% MIT, com Tailwind CSS v4 + Signals)** em `frontend/src/app/shared/ui/` (`z-button`, `z-dialog`, `z-confirm-dialog`, `z-toast-viewport`, `z-select`, `z-input`, `z-input-number`, `z-checkbox`, `z-textarea`, `z-tooltip`, `z-badge`, `z-chart-container`), adotar **Dark Sidebar (`slate-900`)** no Light Mode com fundo de página `slate-100` (`#F1F5F9`) e sidebar desktop fixa (`h-dvh sticky top-0`) com modo recolhido (`w-20`) persistido em `localStorage`, e estabelecer a identidade de marca vetorial **Lumo ("Prisma de Luz & Camadas")** em `<app-lumo-logo>` e favicons.
- **Reason**: Eliminar definitivamente o aviso de licença proprietária `"Invalid PrimeUI License"` do PrimeNG v22, alinhar formulários, modais e gráficos ao padrão visual shadcn/ZardUI, aumentar a profundidade visual no Light Mode e corrigir o comportamento de scroll e colapso da sidebar.
- **Trade-off**: Mantém os primitivos de UI (`shared/ui/`) dentro do próprio repositório (modelo copy-paste/own-your-components do ZardUI/shadcn), exigindo testes unitários dedicados para os componentes base em troca de controle total e zero dependências proprietárias.
- **Scope**: `frontend/`.
- **Date**: 2026-11-26
- **Status**: active

### AD-011
- **Decision**: Adotar **Google OAuth 2.0 (Authorization Code + PKCE S256 no backend Quarkus)** como provedor de autenticação de produção com **sessões próprias do Lumo** via cookies `HttpOnly; SameSite=Lax` (`lumo_access` JWT `HS256` de 15 min + `lumo_refresh` opaco rotativo de 30 dias armazenado apenas como hash `SHA-256` em `refresh_sessions`, `Secure=true` em `%prod`), validação criptográfica do `id_token` via JWKS RS256 do Google, variável opcional `LUMO_ALLOWED_EMAILS` (vazia por padrão, confiando nos *Test users* do Google Cloud), proteção transversal de `/api/v1/**` via `AuthRequestFilter` (`401` RFC 9457) e modo **Entrar como Dev** (`POST /api/v1/auth/dev-login`) estritamente restrito a `%dev`/`%test` (`404` em `%prod`).
- **Reason**: Garantir custo zero (sem envio de e-mail/SMS/WhatsApp), zero exposição de tokens em `localStorage`, sessões estáveis de 30 dias mesmo com o app Google em modo *Testing*, desacoplamento do domínio (`AD-003`) e testes automatizados/Playwright 100% determinísticos sem dependência de rede externa.
- **Trade-off**: Mantém workspace financeiro único compartilhado nesta entrega (isolamento multi-tenant por `Household` adiado para evolução futura) e exige `LUMO_AUTH_JWT_SECRET` (≥ 32 caracteres) e credenciais Google OAuth em `%prod`.
- **Scope**: Projeto inteiro (`backend/`, `frontend/`, `docker-compose.yml`).
- **Date**: 2026-11-27
- **Status**: active

## Handoff

- **Feature**: `04-google-oauth-auth`
- **Phase / Task**: Verified & Ready for Approval — `T1..T12` concluídas, todas as suítes (Backend `./mvnw verify`, Frontend lint/build/Vitest, Playwright E2E desktop/mobile e SonarQube Quality Gate) passando `OK` e `docs/`/`README.md` sincronizados
- **Completed**: `01-lumo-mvp`, `02-ui-ux-overhaul`, `03-zardui-brand-and-shell`, `04-google-oauth-auth` (`T1..T12` aguardando aprovação de commit/push)
- **In-progress** (file:line): none
- **Next step**: Aguardar aprovação explícita do usuário para realizar `git add`, `git commit` (Conventional Commits) e `git push`
- **Blockers**: none
- **Branch**: main
