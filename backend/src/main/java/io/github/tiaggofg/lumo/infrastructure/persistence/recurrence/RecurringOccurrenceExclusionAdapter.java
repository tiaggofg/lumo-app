package io.github.tiaggofg.lumo.infrastructure.persistence.recurrence;

import io.github.tiaggofg.lumo.application.recurrence.RecurringOccurrenceExclusionPort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;

import java.time.Instant;
import java.util.UUID;

@ApplicationScoped
public class RecurringOccurrenceExclusionAdapter implements RecurringOccurrenceExclusionPort {

    private final EntityManager entityManager;

    @Inject
    public RecurringOccurrenceExclusionAdapter(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Override
    public boolean isExcluded(UUID monthlyBudgetId, UUID recurringTransactionId) {
        RecurringOccurrenceExclusionJpaEntity found = entityManager.find(
                RecurringOccurrenceExclusionJpaEntity.class,
                new RecurringOccurrenceExclusionJpaEntity.ExclusionId(monthlyBudgetId, recurringTransactionId)
        );
        return found != null;
    }

    @Override
    public void recordExclusion(UUID monthlyBudgetId, UUID recurringTransactionId, Instant now) {
        entityManager.createNativeQuery("""
                INSERT INTO recurring_occurrence_exclusions (monthly_budget_id, recurring_transaction_id, created_at)
                VALUES (:budgetId, :recurringId, :createdAt)
                ON CONFLICT (monthly_budget_id, recurring_transaction_id) DO NOTHING
                """)
                .setParameter("budgetId", monthlyBudgetId)
                .setParameter("recurringId", recurringTransactionId)
                .setParameter("createdAt", now)
                .executeUpdate();
        entityManager.flush();
    }
}
