package io.github.tiaggofg.lumo.application.recurrence;

import io.github.tiaggofg.lumo.domain.catalog.Beneficiary;
import io.github.tiaggofg.lumo.domain.catalog.Category;
import io.github.tiaggofg.lumo.domain.recurrence.RecurrenceAmountType;
import io.github.tiaggofg.lumo.domain.recurrence.RecurrenceType;
import io.github.tiaggofg.lumo.domain.recurrence.RecurringTransaction;
import io.github.tiaggofg.lumo.domain.transaction.TransactionType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record RecurringTransactionOutput(
        UUID id,
        TransactionType type,
        String description,
        BigDecimal amount,
        RecurrenceAmountType amountType,
        RecurrenceType recurrenceType,
        String startMonth,
        String endMonth,
        Integer totalInstallments,
        Integer startingInstallment,
        Integer dueDay,
        UUID categoryId,
        String categoryName,
        String categoryColor,
        UUID beneficiaryId,
        String beneficiaryName,
        String notes,
        boolean active,
        boolean hasGeneratedTransactions,
        Instant createdAt,
        Instant updatedAt
) {
    public static RecurringTransactionOutput from(
            RecurringTransaction rule,
            Category category,
            Beneficiary beneficiary
    ) {
        return new RecurringTransactionOutput(
                rule.getId(),
                rule.getType(),
                rule.getDescription(),
                rule.getAmount().amount(),
                rule.getAmountType(),
                rule.getRecurrenceType(),
                rule.getStartMonth().toIsoString(),
                rule.getEndMonth() != null ? rule.getEndMonth().toIsoString() : null,
                rule.getTotalInstallments(),
                rule.getStartingInstallment(),
                rule.getDueDay(),
                rule.getCategoryId(),
                category != null ? category.getName() : null,
                category != null ? category.getColor() : null,
                rule.getBeneficiaryId(),
                beneficiary != null ? beneficiary.getName() : null,
                rule.getNotes(),
                rule.isActive(),
                rule.hasGeneratedTransactions(),
                rule.getCreatedAt(),
                rule.getUpdatedAt()
        );
    }

    public record CreateOutput(
            RecurringTransactionOutput recurrence,
            List<UUID> materializedBudgetIds
    ) {
    }

    public record UpdateOutput(
            RecurringTransactionOutput recurrence,
            int propagatedCount
    ) {
    }

    public record DeactivateOutput(
            RecurringTransactionOutput recurrence,
            int removedTransactionsCount
    ) {
    }
}
