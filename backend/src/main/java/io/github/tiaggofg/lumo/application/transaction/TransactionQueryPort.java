package io.github.tiaggofg.lumo.application.transaction;

import io.github.tiaggofg.lumo.domain.transaction.TransactionStatus;
import io.github.tiaggofg.lumo.domain.transaction.TransactionType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TransactionQueryPort {

    List<TransactionOutput> findByBudgetWithFilters(
            UUID budgetId,
            TransactionType type,
            TransactionStatus status,
            UUID categoryId,
            UUID beneficiaryId,
            String search
    );

    Optional<TransactionOutput> findOutputById(UUID id);

    record TransactionOutput(
            UUID id,
            UUID monthlyBudgetId,
            TransactionType type,
            String description,
            BigDecimal amount,
            TransactionStatus status,
            LocalDate dueDate,
            LocalDate paymentDate,
            String notes,
            UUID categoryId,
            String categoryName,
            String categoryColor,
            UUID beneficiaryId,
            String beneficiaryName,
            UUID sourceRecurringTransactionId,
            Integer installmentCurrent,
            Integer installmentTotal,
            Instant createdAt,
            Instant updatedAt
    ) {
    }
}
