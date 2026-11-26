package io.github.tiaggofg.lumo.infrastructure.persistence.recurrence;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "recurring_occurrence_exclusions")
public class RecurringOccurrenceExclusionJpaEntity {

    @EmbeddedId
    private ExclusionId id;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected RecurringOccurrenceExclusionJpaEntity() {
    }

    public RecurringOccurrenceExclusionJpaEntity(UUID monthlyBudgetId, UUID recurringTransactionId, Instant createdAt) {
        this.id = new ExclusionId(monthlyBudgetId, recurringTransactionId);
        this.createdAt = createdAt;
    }

    @Embeddable
    public static class ExclusionId implements Serializable {

        @Column(name = "monthly_budget_id", nullable = false)
        private UUID monthlyBudgetId;

        @Column(name = "recurring_transaction_id", nullable = false)
        private UUID recurringTransactionId;

        protected ExclusionId() {
        }

        public ExclusionId(UUID monthlyBudgetId, UUID recurringTransactionId) {
            this.monthlyBudgetId = monthlyBudgetId;
            this.recurringTransactionId = recurringTransactionId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof ExclusionId that)) return false;
            return Objects.equals(monthlyBudgetId, that.monthlyBudgetId)
                    && Objects.equals(recurringTransactionId, that.recurringTransactionId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(monthlyBudgetId, recurringTransactionId);
        }
    }
}
