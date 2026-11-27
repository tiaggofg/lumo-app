# Referência da API REST

## Convenções Gerais
- **Base URL**: `/api/v1`
- **Formato**: `application/json`
- **OpenAPI / Swagger UI**: `/q/swagger-ui`
- **Health Check**: `/q/health`
- **Padrão de Erros**: RFC 9457 (`application/problem+json`) com `type`, `title`, `status`, `detail`, `instance` e `errors[]` (para validações `400`).

## Endpoints

### Autenticação (`/api/v1/auth`)
> Todos os demais endpoints `/api/v1/**` e `GET /api/v1/auth/me` exigem o cookie `HttpOnly` `lumo_access` válido (retornando `401 Unauthorized` em `application/problem+json` quando ausente/expirado).

| Método | Endpoint | Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/auth/providers` | Público | Retorna `{ googleEnabled, devLoginEnabled }` conforme perfil ativo |
| `GET` | `/api/v1/auth/google/login` | Público | Gera `state` + PKCE `S256`, define `lumo_oauth_state` (5m) e redireciona `302` ao Google (`?returnUrl=`) |
| `GET` | `/api/v1/auth/google/callback` | Público | Valida `state`, troca `code`, verifica `id_token` via JWKS, faz upsert de `User`, emite `lumo_access` + `lumo_refresh` e redireciona `302` |
| `POST` | `/api/v1/auth/dev-login` | `%dev`/`%test` | Autentica usuário determinístico `dev@lumo.local` (`404` em `%prod`) |
| `POST` | `/api/v1/auth/refresh` | Cookie `lumo_refresh` | Rotaciona atomicamente a sessão (30 dias) e reemite cookies (`200`, `401`) |
| `POST` | `/api/v1/auth/logout` | Público | Revoga a `RefreshSession` atual e limpa `lumo_access` e `lumo_refresh` (`204`) |
| `GET` | `/api/v1/auth/me` | Autenticado | Retorna `{ id, email, name, avatarUrl }` do usuário autenticado (`200`, `401`) |

### Catálogo
| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/v1/categories` | Lista categorias (`?type=&active=`) |
| `POST` | `/api/v1/categories` | Cria categoria (`201`, `400`, `409`) |
| `PUT` | `/api/v1/categories/{id}` | Atualiza categoria (`200`, `400`, `404`, `409`) |
| `PATCH` | `/api/v1/categories/{id}/status` | Ativa/desativa categoria (`200`, `404`) |
| `DELETE` | `/api/v1/categories/{id}` | Exclui categoria sem vínculos (`204`, `404`, `409`) |
| `GET` | `/api/v1/beneficiaries` | Lista beneficiários (`?active=`) |
| `POST` | `/api/v1/beneficiaries` | Cria beneficiário (`201`, `400`, `409`) |
| `PUT` | `/api/v1/beneficiaries/{id}` | Renomeia beneficiário (`200`, `400`, `404`, `409`) |
| `PATCH` | `/api/v1/beneficiaries/{id}/status` | Ativa/desativa beneficiário (`200`, `404`) |
| `DELETE` | `/api/v1/beneficiaries/{id}` | Exclui beneficiário sem vínculos (`204`, `404`, `409`) |

### Orçamentos Mensais
| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/v1/budgets` | Lista orçamentos ordenados por competência DESC com resumo dinâmico |
| `POST` | `/api/v1/budgets` | Cria orçamento e materializa recorrências elegíveis (`201`, `400`, `409`) |
| `GET` | `/api/v1/budgets/{id}` | Detalhe com resumo Previsto/Realizado, contagens e breakdowns |
| `DELETE` | `/api/v1/budgets/{id}` | Exclui orçamento vazio (`204`, `404`, `409` se houver lançamentos) |

### Transações
| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/v1/budgets/{budgetId}/transactions` | Lista filtrada (`?type=&status=&categoryId=&beneficiaryId=&search=`) |
| `POST` | `/api/v1/budgets/{budgetId}/transactions` | Cria lançamento manual (`201`, `400`, `404`, `422`) |
| `PUT` | `/api/v1/transactions/{id}` | Atualiza lançamento (`monthlyBudgetId` imutável) |
| `PATCH` | `/api/v1/transactions/{id}/status` | Altera status (`SETTLED` preenche `paymentDate`; reversão limpa) |
| `PATCH` | `/api/v1/transactions/{id}/confirm-estimate` | Confirma valor de item `ESTIMATED` e opcionalmente atualiza recorrência |
| `DELETE` | `/api/v1/transactions/{id}` | Exclui lançamento (registra supressão se recorrente) |

### Recorrências
| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/v1/recurring-transactions` | Lista regras (`?active=&type=&recurrenceType=`) |
| `POST` | `/api/v1/recurring-transactions` | Cria regra e materializa em orçamentos atuais/futuros |
| `PUT` | `/api/v1/recurring-transactions/{id}` | Atualiza regra com `propagateToOpenTransactions` opt-in |
| `PATCH` | `/api/v1/recurring-transactions/{id}/deactivate` | Desativa regra com `removeFutureOpenTransactions` opt-in |
| `PATCH` | `/api/v1/recurring-transactions/{id}/activate` | Reativa regra |
| `DELETE` | `/api/v1/recurring-transactions/{id}` | Exclui regra se nunca gerou transações (`204`, `409`) |
