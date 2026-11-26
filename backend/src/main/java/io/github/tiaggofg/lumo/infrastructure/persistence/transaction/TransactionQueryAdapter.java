package io.github.tiaggofg.lumo.infrastructure.persistence.transaction;

import io.github.tiaggofg.lumo.application.transaction.TransactionQueryPort;
import io.github.tiaggofg.lumo.domain.transaction.TransactionStatus;
import io.github.tiaggofg.lumo.domain.transaction.TransactionType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class TransactionQueryAdapter implements TransactionQueryPort {

    private static final String BASE_SELECT = """
            SELECT t.id,
                   t.monthly_budget_id,
                   t.type,
                   t.description,
                   t.amount,
                   t.status,
                   t.due_date,
                   t.payment_date,
                   t.notes,
                   t.category_id,
                   c.name AS category_name,
                   c.color AS category_color,
                   t.beneficiary_id,
                   ben.name AS beneficiary_name,
                   t.source_recurring_transaction_id,
                   t.installment_current,
                   t.installment_total,
                   t.created_at,
                   t.updated_at
            FROM transactions t
            LEFT JOIN categories c ON c.id = t.category_id
            LEFT JOIN beneficiaries ben ON ben.id = t.beneficiary_id
            """;

    private final EntityManager entityManager;

    @Inject
    public TransactionQueryAdapter(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<TransactionOutput> findByBudgetWithFilters(
            UUID budgetId,
            TransactionType type,
            TransactionStatus status,
            UUID categoryId,
            UUID beneficiaryId,
            String search
    ) {
        StringBuilder sql = new StringBuilder(BASE_SELECT)
                .append(" WHERE t.monthly_budget_id = :budgetId");

        if (type != null) {
            sql.append(" AND t.type = :type");
        }
        if (status != null) {
            sql.append(" AND t.status = :status");
        }
        if (categoryId != null) {
            sql.append(" AND t.category_id = :categoryId");
        }
        if (beneficiaryId != null) {
            sql.append(" AND t.beneficiary_id = :beneficiaryId");
        }
        boolean hasSearch = search != null && !search.isBlank();
        if (hasSearch) {
            sql.append(" AND (LOWER(t.description) LIKE :search OR LOWER(COALESCE(t.notes, '')) LIKE :search)");
        }
        sql.append(" ORDER BY t.due_date ASC NULLS LAST, t.created_at ASC");

        Query query = entityManager.createNativeQuery(sql.toString())
                .setParameter("budgetId", budgetId);
        if (type != null) {
            query.setParameter("type", type.name());
        }
        if (status != null) {
            query.setParameter("status", status.name());
        }
        if (categoryId != null) {
            query.setParameter("categoryId", categoryId);
        }
        if (beneficiaryId != null) {
            query.setParameter("beneficiaryId", beneficiaryId);
        }
        if (hasSearch) {
            query.setParameter("search", "%" + search.trim().toLowerCase() + "%");
        }

        List<Object[]> rows = query.getResultList();
        return rows.stream().map(this::mapRow).toList();
    }

    @Override
    @SuppressWarnings("unchecked")
    public Optional<TransactionOutput> findOutputById(UUID id) {
        List<Object[]> rows = entityManager.createNativeQuery(BASE_SELECT + " WHERE t.id = :id")
                .setParameter("id", id)
                .getResultList();
        return rows.isEmpty() ? Optional.empty() : Optional.of(mapRow(rows.getFirst()));
    }

    private TransactionOutput mapRow(Object[] row) {
        return new TransactionOutput(
                toUuid(row[0]),
                toUuid(row[1]),
                TransactionType.valueOf((String) row[2]),
                (String) row[3],
                toBigDecimal(row[4]),
                TransactionStatus.valueOf((String) row[5]),
                toLocalDate(row[6]),
                toLocalDate(row[7]),
                (String) row[8],
                toUuid(row[9]),
                (String) row[10],
                (String) row[11],
                toUuid(row[12]),
                (String) row[13],
                toUuid(row[14]),
                row[15] != null ? ((Number) row[15]).intValue() : null,
                row[16] != null ? ((Number) row[16]).intValue() : null,
                toInstant(row[17]),
                toInstant(row[18])
        );
    }

    private static UUID toUuid(Object value) {
        if (value == null) {
            return null;
        }
        return value instanceof UUID uuid ? uuid : UUID.fromString(value.toString());
    }

    private static BigDecimal toBigDecimal(Object value) {
        BigDecimal bd = value instanceof BigDecimal b ? b : new BigDecimal(value.toString());
        return bd.setScale(2, RoundingMode.HALF_UP);
    }

    private static LocalDate toLocalDate(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof LocalDate ld) {
            return ld;
        }
        if (value instanceof Date d) {
            return d.toLocalDate();
        }
        return LocalDate.parse(value.toString());
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
