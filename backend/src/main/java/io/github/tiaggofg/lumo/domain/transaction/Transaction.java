package io.github.tiaggofg.lumo.domain.transaction;

import io.github.tiaggofg.lumo.domain.shared.BusinessRuleViolationException;
import io.github.tiaggofg.lumo.domain.shared.DomainValidationException;
import io.github.tiaggofg.lumo.domain.shared.Installment;
import io.github.tiaggofg.lumo.domain.shared.Money;
import io.github.tiaggofg.lumo.domain.stereotype.AggregateRoot;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

public final class Transaction implements AggregateRoot<UUID> {

    private static final int MAX_DESCRIPTION_LENGTH = 140;
    private static final int MAX_NOTES_LENGTH = 500;
    private static final String NOW_REQUIRED = "now must not be null";

    private final UUID id;
    private final UUID monthlyBudgetId;
    private TransactionType type;
    private String description;
    private Money amount;
    private TransactionStatus status;
    private LocalDate dueDate;
    private LocalDate paymentDate;
    private String notes;
    private UUID categoryId;
    private UUID beneficiaryId;
    private final UUID sourceRecurringTransactionId;
    private final Installment installment;
    private final Instant createdAt;
    private Instant updatedAt;

    private Transaction(
            UUID id,
            UUID monthlyBudgetId,
            TransactionType type,
            String description,
            Money amount,
            TransactionStatus status,
            LocalDate dueDate,
            LocalDate paymentDate,
            String notes,
            UUID categoryId,
            UUID beneficiaryId,
            UUID sourceRecurringTransactionId,
            Installment installment,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = Objects.requireNonNull(id, "id must not be null");
        if (monthlyBudgetId == null) {
            throw new DomainValidationException("monthlyBudgetId", "Monthly budget id is required.");
        }
        this.monthlyBudgetId = monthlyBudgetId;
        this.type = validateType(type);
        this.description = validateDescription(description);
        this.amount = validateAmount(amount);
        this.status = validateStatus(status);
        this.dueDate = dueDate;
        this.paymentDate = paymentDate;
        this.notes = validateNotes(notes);
        this.categoryId = categoryId;
        this.beneficiaryId = beneficiaryId;
        this.sourceRecurringTransactionId = sourceRecurringTransactionId;
        this.installment = installment;
        this.createdAt = Objects.requireNonNull(createdAt, "createdAt must not be null");
        this.updatedAt = Objects.requireNonNull(updatedAt, "updatedAt must not be null");
    }

    public static Transaction createManual(
            UUID monthlyBudgetId,
            TransactionType type,
            String description,
            Money amount,
            TransactionStatus status,
            LocalDate dueDate,
            LocalDate paymentDate,
            String notes,
            UUID categoryId,
            UUID beneficiaryId,
            LocalDate today,
            Instant now
    ) {
        TransactionStatus validStatus = validateStatus(status);
        LocalDate resolvedPaymentDate = resolvePaymentDate(validStatus, paymentDate, today);
        Instant timestamp = Objects.requireNonNull(now, NOW_REQUIRED);
        return new Transaction(
                UUID.randomUUID(),
                monthlyBudgetId,
                type,
                description,
                amount,
                validStatus,
                dueDate,
                resolvedPaymentDate,
                notes,
                categoryId,
                beneficiaryId,
                null,
                null,
                timestamp,
                timestamp
        );
    }

    public static Transaction createMaterialized(
            UUID monthlyBudgetId,
            TransactionType type,
            String description,
            Money amount,
            TransactionStatus status,
            LocalDate dueDate,
            String notes,
            UUID categoryId,
            UUID beneficiaryId,
            UUID sourceRecurringTransactionId,
            Installment installment,
            Instant now
    ) {
        if (sourceRecurringTransactionId == null) {
            throw new DomainValidationException("sourceRecurringTransactionId", "Source recurring transaction id is required.");
        }
        if (status == TransactionStatus.SETTLED) {
            throw new DomainValidationException("status", "Materialized transactions cannot start as SETTLED.");
        }
        Instant timestamp = Objects.requireNonNull(now, NOW_REQUIRED);
        return new Transaction(
                UUID.randomUUID(),
                monthlyBudgetId,
                type,
                description,
                amount,
                status,
                dueDate,
                null,
                notes,
                categoryId,
                beneficiaryId,
                sourceRecurringTransactionId,
                installment,
                timestamp,
                timestamp
        );
    }

    public static Transaction reconstitute(
            UUID id,
            UUID monthlyBudgetId,
            TransactionType type,
            String description,
            Money amount,
            TransactionStatus status,
            LocalDate dueDate,
            LocalDate paymentDate,
            String notes,
            UUID categoryId,
            UUID beneficiaryId,
            UUID sourceRecurringTransactionId,
            Installment installment,
            Instant createdAt,
            Instant updatedAt
    ) {
        return new Transaction(
                id,
                monthlyBudgetId,
                type,
                description,
                amount,
                status,
                dueDate,
                paymentDate,
                notes,
                categoryId,
                beneficiaryId,
                sourceRecurringTransactionId,
                installment,
                createdAt,
                updatedAt
        );
    }

    public void updateDetails(
            TransactionType type,
            String description,
            Money amount,
            TransactionStatus status,
            LocalDate dueDate,
            LocalDate paymentDate,
            String notes,
            UUID categoryId,
            UUID beneficiaryId,
            LocalDate today,
            Instant now
    ) {
        this.type = validateType(type);
        this.description = validateDescription(description);
        this.amount = validateAmount(amount);
        this.status = validateStatus(status);
        this.dueDate = dueDate;
        this.paymentDate = resolvePaymentDate(this.status, paymentDate, today);
        this.notes = validateNotes(notes);
        this.categoryId = categoryId;
        this.beneficiaryId = beneficiaryId;
        this.updatedAt = Objects.requireNonNull(now, NOW_REQUIRED);
    }

    public void ensureBelongsToBudget(UUID requestedBudgetId) {
        if (requestedBudgetId != null && !this.monthlyBudgetId.equals(requestedBudgetId)) {
            throw new DomainValidationException("monthlyBudgetId", "Transaction monthlyBudgetId is immutable and cannot be changed.");
        }
    }

    public void changeStatus(TransactionStatus newStatus, LocalDate explicitPaymentDate, LocalDate today, Instant now) {
        this.status = validateStatus(newStatus);
        this.paymentDate = resolvePaymentDate(this.status, explicitPaymentDate, today);
        this.updatedAt = Objects.requireNonNull(now, NOW_REQUIRED);
    }

    public void confirmEstimate(
            Money actualAmount,
            TransactionStatus targetStatus,
            LocalDate explicitPaymentDate,
            LocalDate today,
            Instant now
    ) {
        if (this.status != TransactionStatus.ESTIMATED) {
            throw new BusinessRuleViolationException("Only ESTIMATED transactions can have their estimate confirmed.");
        }
        if (targetStatus == null || targetStatus == TransactionStatus.ESTIMATED) {
            throw new BusinessRuleViolationException("Target status for confirm-estimate must be PENDING or SETTLED.");
        }
        this.amount = validateAmount(actualAmount);
        this.status = targetStatus;
        this.paymentDate = resolvePaymentDate(targetStatus, explicitPaymentDate, today);
        this.updatedAt = Objects.requireNonNull(now, NOW_REQUIRED);
    }

    public void applyRecurrencePropagation(
            String description,
            Money amount,
            LocalDate dueDate,
            UUID categoryId,
            UUID beneficiaryId,
            String notes,
            Instant now
    ) {
        if (this.status == TransactionStatus.SETTLED) {
            throw new BusinessRuleViolationException("Cannot propagate recurrence changes to a SETTLED transaction.");
        }
        this.description = validateDescription(description);
        this.amount = validateAmount(amount);
        this.dueDate = dueDate;
        this.categoryId = categoryId;
        this.beneficiaryId = beneficiaryId;
        this.notes = validateNotes(notes);
        this.updatedAt = Objects.requireNonNull(now, NOW_REQUIRED);
    }

    private static LocalDate resolvePaymentDate(TransactionStatus status, LocalDate explicitPaymentDate, LocalDate today) {
        if (status == TransactionStatus.SETTLED) {
            return explicitPaymentDate != null ? explicitPaymentDate : Objects.requireNonNull(today, "today must not be null");
        }
        return null;
    }

    private static TransactionType validateType(TransactionType value) {
        if (value == null) {
            throw new DomainValidationException("type", "Transaction type is required.");
        }
        return value;
    }

    private static TransactionStatus validateStatus(TransactionStatus value) {
        if (value == null) {
            throw new DomainValidationException("status", "Transaction status is required.");
        }
        return value;
    }

    private static Money validateAmount(Money value) {
        if (value == null || value.amount().signum() <= 0) {
            throw new DomainValidationException("amount", "Amount must be greater than zero.");
        }
        return value;
    }

    private static String validateDescription(String value) {
        if (value == null || value.isBlank()) {
            throw new DomainValidationException("description", "Transaction description must not be blank.");
        }
        String trimmed = value.trim();
        if (trimmed.length() > MAX_DESCRIPTION_LENGTH) {
            throw new DomainValidationException("description", "Transaction description must not exceed " + MAX_DESCRIPTION_LENGTH + " characters.");
        }
        return trimmed;
    }

    private static String validateNotes(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.length() > MAX_NOTES_LENGTH) {
            throw new DomainValidationException("notes", "Transaction notes must not exceed " + MAX_NOTES_LENGTH + " characters.");
        }
        return trimmed;
    }

    @Override
    public UUID getId() {
        return id;
    }

    public UUID getMonthlyBudgetId() {
        return monthlyBudgetId;
    }

    public TransactionType getType() {
        return type;
    }

    public String getDescription() {
        return description;
    }

    public Money getAmount() {
        return amount;
    }

    public TransactionStatus getStatus() {
        return status;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public LocalDate getPaymentDate() {
        return paymentDate;
    }

    public String getNotes() {
        return notes;
    }

    public UUID getCategoryId() {
        return categoryId;
    }

    public UUID getBeneficiaryId() {
        return beneficiaryId;
    }

    public UUID getSourceRecurringTransactionId() {
        return sourceRecurringTransactionId;
    }

    public Installment getInstallment() {
        return installment;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
