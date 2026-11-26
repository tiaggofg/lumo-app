# Segurança e Privacidade

## Escopo da Fase 1 (MVP)
- **Autenticação**: Conforme `AD-007`, a Fase 1 foca uso pessoal/familiar em ambiente local ou atrás de proteção externa (VPN / reverse proxy autenticado), sem autenticação nativa.
- **CORS**: Restrito às origens locais configuradas em `application.properties` (`http://localhost:4200`, `http://127.0.0.1:4200`).
- **Tratamento de Erros**: `ProblemDetailExceptionMapper` nunca expõe stacktraces ou detalhes internos em respostas HTTP `500`, registrando exceções inesperadas apenas no log do servidor.
- **Validação de Entrada**: Todas as entradas são validadas tanto via Bean Validation quanto nos invariantes puros do domínio (`Money > 0`, formatos ISO `YYYY-MM`, limites de caracteres e integridade referencial).

## Evolução Planejada (Fase 2)
- Autenticação JWT / OIDC e isolamento multi-tenant por `Household`.
