# Deploy e CI/CD

## Ambiente Local

### Stack Completa via Docker Compose
```bash
docker compose up -d --build
```
Sobe PostgreSQL 17 (`5432`), Backend Quarkus (`8080`) e Frontend Angular/Nginx (`4200`, configurável via `LUMO_FRONTEND_PORT`).

Para apontar o container `backend` para um PostgreSQL externo (ex.: Neon, Supabase, Aiven) via `.env` na raiz, defina `DB_URL`, `DB_USERNAME` e `DB_PASSWORD` e suba sem o serviço local de banco:
```bash
docker compose up -d --no-deps backend frontend
```

### Modo Desenvolvimento (Live Reload)
1. **Banco de Dados**:
   ```bash
   docker compose up -d postgres
   ```
   Sobe PostgreSQL 17 (`lumo_db`, porta `5432`).
2. **Backend (Quarkus 3.33 LTS + Java 25)**:
   ```bash
   cd backend && ./mvnw quarkus:dev
   ```
   Variáveis configuráveis em produção (`%prod`):
   - **Banco & Timezone**: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `LUMO_TIMEZONE` (padrão `America/Sao_Paulo`).
   - **Autenticação (`AD-011`)**:
     - `LUMO_AUTH_JWT_SECRET` (**obrigatória em `%prod`**, mínimo 32 caracteres)
     - `GOOGLE_OAUTH_CLIENT_ID` e `GOOGLE_OAUTH_CLIENT_SECRET` (credenciais OAuth 2.0 Web Application no Google Cloud Console)
     - `GOOGLE_OAUTH_REDIRECT_URI` (ex.: `https://lumo.seudominio.com/api/v1/auth/google/callback`; padrão local `http://localhost:4200/api/v1/auth/google/callback`)
     - `LUMO_AUTH_COOKIE_SECURE` (`true` em `%prod`, `false` em `%dev`/`%test`)
     - `LUMO_ALLOWED_EMAILS` (opcional, vazia por padrão = confia nos *Test users* do Google Cloud; quando preenchida com e-mails separados por vírgula, restringe o login à allowlist)
3. **Frontend (Angular v22 + Node 24.15+)**:
   ```bash
   cd frontend && npm install && npm start
   ```

## Verificação e Qualidade

- **Backend**: `cd backend && ./mvnw verify` (unitários + ArchUnit + integração Testcontainers PostgreSQL).
- **Frontend**: `cd frontend && npm run lint && npm run build && npm test -- --watch=false`.
- **E2E**: `cd frontend && npx playwright test --reporter=list`.
- **Qualidade Estática**: `.agents/scripts/quality-check.sh --up`.
