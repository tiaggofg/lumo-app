# Deploy e CI/CD

## Ambiente Local

### Stack Completa via Docker Compose
```bash
docker compose up -d --build
```
Sobe PostgreSQL 17 (`5432`), Backend Quarkus (`8080`) e Frontend Angular/Nginx (`4200`, configurável via `LUMO_FRONTEND_PORT`).

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
   Variáveis configuráveis em produção (`%prod`): `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `LUMO_TIMEZONE` (padrão `America/Sao_Paulo`).
3. **Frontend (Angular v22 + Node 24.15+)**:
   ```bash
   cd frontend && npm install && npm start
   ```

## Verificação e Qualidade

- **Backend**: `cd backend && ./mvnw verify` (unitários + ArchUnit + integração Testcontainers PostgreSQL).
- **Frontend**: `cd frontend && npm run lint && npm run build && npm test -- --watch=false`.
- **E2E**: `cd frontend && npx playwright test --reporter=list`.
- **Qualidade Estática**: `.agents/scripts/quality-check.sh --up`.
