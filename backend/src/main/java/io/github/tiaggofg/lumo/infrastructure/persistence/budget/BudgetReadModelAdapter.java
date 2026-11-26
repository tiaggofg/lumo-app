package io.github.tiaggofg.lumo.infrastructure.persistence.budget;

import io.github.tiaggofg.lumo.application.budget.BudgetReadModelPort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class BudgetReadModelAdapter implements BudgetReadModelPort {

    private static final String PARAM_BUDGET_ID = "budgetId";

    private final EntityManager entityManager;

    @Inject
    public BudgetReadModelAdapter(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<MonthlyBudgetListItemOutput> findAllSummariesOrderedByCompetenceDesc() {
        List<Object[]> rows = entityManager.createNativeQuery("""
                SELECT b.id,
                       b.competence_month,
                       b.created_at,
                       b.updated_at,
                       COALESCE(SUM(CASE WHEN t.type = 'INCOME' THEN t.amount ELSE 0 END), 0) AS planned_income,
                       COALESCE(SUM(CASE WHEN t.type = 'INCOME' AND t.status = 'SETTLED' THEN t.amount ELSE 0 END), 0) AS realized_income,
                       COALESCE(SUM(CASE WHEN t.type = 'EXPENSE' THEN t.amount ELSE 0 END), 0) AS planned_expense,
                       COALESCE(SUM(CASE WHEN t.type = 'EXPENSE' AND t.status = 'SETTLED' THEN t.amount ELSE 0 END), 0) AS realized_expense,
                       COUNT(t.id) AS txn_count
                FROM monthly_budgets b
                LEFT JOIN transactions t ON t.monthly_budget_id = b.id
                GROUP BY b.id, b.competence_month, b.created_at, b.updated_at
                ORDER BY b.competence_month DESC
                """).getResultList();

        return rows.stream().map(row -> new MonthlyBudgetListItemOutput(
                toUuid(row[0]),
                (String) row[1],
                BudgetSummaryOutput.of(toBigDecimal(row[4]), toBigDecimal(row[5]), toBigDecimal(row[6]), toBigDecimal(row[7])),
                ((Number) row[8]).longValue(),
                toInstant(row[2]),
                toInstant(row[3])
        )).toList();
    }

    @Override
    @SuppressWarnings("unchecked")
    public Optional<MonthlyBudgetDetailOutput> findDetailById(UUID budgetId) {
        List<Object[]> headerRows = entityManager.createNativeQuery("""
                SELECT b.id,
                       b.competence_month,
                       b.created_at,
                       b.updated_at,
                       COALESCE(SUM(CASE WHEN t.type = 'INCOME' THEN t.amount ELSE 0 END), 0) AS planned_income,
                       COALESCE(SUM(CASE WHEN t.type = 'INCOME' AND t.status = 'SETTLED' THEN t.amount ELSE 0 END), 0) AS realized_income,
                       COALESCE(SUM(CASE WHEN t.type = 'EXPENSE' THEN t.amount ELSE 0 END), 0) AS planned_expense,
                       COALESCE(SUM(CASE WHEN t.type = 'EXPENSE' AND t.status = 'SETTLED' THEN t.amount ELSE 0 END), 0) AS realized_expense,
                       COUNT(CASE WHEN t.status = 'ESTIMATED' THEN 1 END) AS estimated_count,
                       COUNT(CASE WHEN t.status = 'PENDING' THEN 1 END) AS pending_count,
                       COUNT(CASE WHEN t.status = 'SETTLED' THEN 1 END) AS settled_count
                FROM monthly_budgets b
                LEFT JOIN transactions t ON t.monthly_budget_id = b.id
                WHERE b.id = :budgetId
                GROUP BY b.id, b.competence_month, b.created_at, b.updated_at
                """)
                .setParameter(PARAM_BUDGET_ID, budgetId)
                .getResultList();

        if (headerRows.isEmpty()) {
            return Optional.empty();
        }

        Object[] header = headerRows.getFirst();
        BudgetSummaryOutput summary = BudgetSummaryOutput.of(
                toBigDecimal(header[4]), toBigDecimal(header[5]), toBigDecimal(header[6]), toBigDecimal(header[7]));
        StatusCountsOutput statusCounts = new StatusCountsOutput(
                ((Number) header[8]).longValue(),
                ((Number) header[9]).longValue(),
                ((Number) header[10]).longValue()
        );

        List<Object[]> categoryRows = entityManager.createNativeQuery("""
                SELECT c.id,
                       COALESCE(c.name, 'Sem categoria') AS name,
                       COALESCE(c.color, '#94A3B8') AS color,
                       COALESCE(SUM(t.amount), 0) AS planned_amount,
                       COALESCE(SUM(CASE WHEN t.status = 'SETTLED' THEN t.amount ELSE 0 END), 0) AS realized_amount,
                       COUNT(t.id) AS item_count
                FROM transactions t
                LEFT JOIN categories c ON c.id = t.category_id
                WHERE t.monthly_budget_id = :budgetId
                  AND t.type = 'EXPENSE'
                GROUP BY c.id, c.name, c.color
                ORDER BY planned_amount DESC, name ASC
                """)
                .setParameter(PARAM_BUDGET_ID, budgetId)
                .getResultList();

        List<BreakdownItemOutput> byCategory = categoryRows.stream().map(row -> new BreakdownItemOutput(
                toUuid(row[0]),
                (String) row[1],
                (String) row[2],
                toBigDecimal(row[3]),
                toBigDecimal(row[4]),
                ((Number) row[5]).longValue()
        )).toList();

        List<Object[]> beneficiaryRows = entityManager.createNativeQuery("""
                SELECT ben.id,
                       COALESCE(ben.name, 'Sem beneficiário') AS name,
                       COALESCE(SUM(t.amount), 0) AS planned_amount,
                       COALESCE(SUM(CASE WHEN t.status = 'SETTLED' THEN t.amount ELSE 0 END), 0) AS realized_amount,
                       COUNT(t.id) AS item_count
                FROM transactions t
                LEFT JOIN beneficiaries ben ON ben.id = t.beneficiary_id
                WHERE t.monthly_budget_id = :budgetId
                  AND t.type = 'EXPENSE'
                GROUP BY ben.id, ben.name
                ORDER BY planned_amount DESC, name ASC
                """)
                .setParameter(PARAM_BUDGET_ID, budgetId)
                .getResultList();

        List<BreakdownItemOutput> byBeneficiary = beneficiaryRows.stream().map(row -> new BreakdownItemOutput(
                toUuid(row[0]),
                (String) row[1],
                null,
                toBigDecimal(row[2]),
                toBigDecimal(row[3]),
                ((Number) row[4]).longValue()
        )).toList();

        return Optional.of(new MonthlyBudgetDetailOutput(
                toUuid(header[0]),
                (String) header[1],
                summary,
                statusCounts,
                byCategory,
                byBeneficiary,
                toInstant(header[2]),
                toInstant(header[3])
        ));
    }

    private static UUID toUuid(Object value) {
        if (value == null) {
            return null;
        }
        return value instanceof UUID uuid ? uuid : UUID.fromString(value.toString());
    }

    private static BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal bd = value instanceof BigDecimal b ? b : new BigDecimal(value.toString());
        return bd.setScale(2, RoundingMode.HALF_UP);
    }

    private static Instant toInstant(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Instant instant) {
            return instant;
        }
        if (value instanceof OffsetDateTime odt) {
            return odt.toInstant();
        }
        if (value instanceof Timestamp ts) {
            return ts.toInstant();
        }
        return Instant.parse(value.toString());
    }
}
