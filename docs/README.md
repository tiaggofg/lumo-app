# Documentação Técnica — Lumo

Documentação viva da arquitetura, domínio, fluxos, contratos de API, segurança, deploy e decisões arquiteturais (ADRs) do **Lumo**.

---

## Mapa de Documentos

| Documento | Descrição |
| :--- | :--- |
| [Arquitetura e Diagramas C4](./arquitetura-c4.md) | Diagramas C4 (Contexto, Containers, Componentes) e fronteiras Clean Architecture |
| [Modelo de Domínio e Dados](./modelo-dominio-e-dados.md) | Diagrama de classes, ER PostgreSQL, índices, constraints e máquina de estados |
| [Fluxos e Diagramas de Sequência](./fluxos-e-sequencias.md) | Fluxogramas e diagramas de sequência (materialização, confirmação de estimativa) |
| [Referência da API REST](./api-rest.md) | Endpoints `/api/v1`, payloads e erros RFC 9457 |
| [Segurança e Privacidade](./seguranca-e-privacidade.md) | Escopo Fase 1 (sem auth), CORS, validação e plano de evolução Fase 2 |
| [Deploy e CI/CD](./deploy-e-ci-cd.md) | Execução local, Docker Compose, variáveis de ambiente e testes |
| [ADRs (Decisões Arquiteturais)](./adr/README.md) | Índice de decisões arquiteturais sincronizadas com `.specs/STATE.md` |

---

## Princípios Arquiteturais Fundamentais

1. **Isolamento de Domínio (`AD-003`)**: `io.github.tiaggofg.lumo.domain..` é 100% Java puro (zero Quarkus, Jakarta, Hibernate ou Jackson), garantido por `CleanArchitectureArchTest`.
2. **Agregados Independentes + Read Model (`AD-004`)**: `MonthlyBudget` e `Transaction` são Aggregate Roots independentes; totais Previsto vs. Realizado são calculados dinamicamente via Read Model SQL.
3. **Motor de Recorrências Seguro (`AD-006`)**: Materialização idempotente (índice único parcial), supressão pontual via `recurring_occurrence_exclusions`, propagação opt-in que nunca altera `SETTLED` nem meses passados.
