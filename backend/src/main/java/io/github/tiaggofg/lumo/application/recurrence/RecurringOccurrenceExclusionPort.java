package io.github.tiaggofg.lumo.application.recurrence;

import java.time.Instant;
import java.util.UUID;

public interface RecurringOccurrenceExclusionPort {

    boolean isExcluded(UUID monthlyBudgetId, UUID recurringTransactionId);

    void recordExclusion(UUID monthlyBudgetId, UUID recurringTransactionId, Instant now);
}
