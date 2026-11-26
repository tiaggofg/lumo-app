package io.github.tiaggofg.lumo.domain.recurrence;

import io.github.tiaggofg.lumo.domain.shared.BusinessRuleViolationException;
import io.github.tiaggofg.lumo.domain.shared.CompetenceMonth;
import io.github.tiaggofg.lumo.domain.shared.DomainValidationException;
import io.github.tiaggofg.lumo.domain.shared.Installment;
import io.github.tiaggofg.lumo.domain.shared.Money;
import io.github.tiaggofg.lumo.domain.stereotype.AggregateRoot;
import io.github.tiaggofg.lumo.domain.transaction.Transaction;
import io.github.tiaggofg.lumo.domain.transaction.TransactionStatus;
import io.github.tiaggofg.lumo.domain.transaction.TransactionType;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

public final class RecurringTransaction implements AggregateRoot<UUID> {

    private static final int MAX_DESCRIPTION_LENGTH = 140;
    private static final int MAX_NOTES_LENGTH = 500;
    private static final String NOW_REQUIRED = "now must not be null";

    private final UUID id;
    private TransactionType type;
    private String description;
    private Money amount;
    private RecurrenceAmountType amountType;
    private RecurrenceType recurrenceType;
    private CompetenceMonth startMonth;
    private CompetenceMonth endMonth;
    private Integer totalInstallments;
    private Integer startingInstallment;
    private Integer dueDay;
    private UUID categoryId;
    private UUID beneficiaryId;
    private String notes;
    private boolean active;
    private boolean hasGeneratedTransactions;
    private final Instant createdAt;
    private Instant updatedAt;

    private RecurringTransaction(
            UUID id,
            TransactionType type,
            String description,
            Money amount,
            RecurrenceAmountType amountType,
            RecurrenceType recurrenceType,
            CompetenceMonth startMonth,
            CompetenceMonth endMonth,
            Integer totalInstallments,
            Integer startingInstallment,
            Integer dueDay,
            UUID categoryId,
            UUID beneficiaryId,
            String notes,
            boolean active,
            boolean hasGeneratedTransactions,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = Objects.requireNonNull(id, "id must not be null");
        applyValidatedState(
                type, description, amount, amountType, recurrenceType,
                startMonth, endMonth, totalInstallments, startingInstallment,
                dueDay, categoryId, beneficiaryId, notes
        );
        this.active = active;
        this.hasGeneratedTransactions = hasGeneratedTransactions;
        this.createdAt = Objects.requireNonNull(createdAt, "createdAt must not be null");
        this.updatedAt = Objects.requireNonNull(updatedAt, "updatedAt must not be null");
    }

    public static RecurringTransaction create(
            TransactionType type,
            String description,
            Money amount,
            RecurrenceAmountType amountType,
            RecurrenceType recurrenceType,
            CompetenceMonth startMonth,
            CompetenceMonth endMonth,
            Integer totalInstallments,
            Integer startingInstallment,
            Integer dueDay,
            UUID categoryId,
            UUID beneficiaryId,
            String notes,
            Instant now
    ) {
        Instant timestamp = Objects.requireNonNull(now, NOW_REQUIRED);
        return new RecurringTransaction(
                UUID.randomUUID(),
                type,
                description,
                amount,
                amountType,
                recurrenceType,
                startMonth,
                endMonth,
                totalInstallments,
                startingInstallment,
                dueDay,
                categoryId,
                beneficiaryId,
                notes,
                true,
                false,
                timestamp,
                timestamp
        );
    }

    public static RecurringTransaction reconstitute(
            UUID id,
            TransactionType type,
            String description,
            Money amount,
            RecurrenceAmountType amountType,
            RecurrenceType recurrenceType,
            CompetenceMonth startMonth,
            CompetenceMonth endMonth,
            Integer totalInstallments,
            Integer startingInstallment,
            Integer dueDay,
            UUID categoryId,
            UUID beneficiaryId,
            String notes,
            boolean active,
            boolean hasGeneratedTransactions,
            Instant createdAt,
            Instant updatedAt
    ) {
        return new RecurringTransaction(
                id, type, description, amount, amountType, recurrenceType,
                startMonth, endMonth, totalInstallments, startingInstallment,
                dueDay, categoryId, beneficiaryId, notes, active,
                hasGeneratedTransactions, createdAt, updatedAt
        );
    }

    public boolean isEligibleFor(CompetenceMonth month) {
        if (!active || month == null || month.isBefore(startMonth)) {
            return false;
        }
        return switch (recurrenceType) {
            case INDEFINITE -> true;
            case FIXED_TERM -> !month.isAfter(endMonth);
            case INSTALLMENT -> {
                long offset = startMonth.monthsUntil(month);
                yield offset >= 0 && offset <= (totalInstallments - startingInstallment);
            }
        };
    }

    public Transaction materializeFor(UUID budgetId, CompetenceMonth month, Instant now) {
        if (!isEligibleFor(month)) {
            throw new BusinessRuleViolationException(
                    "RecurringTransaction '" + description + "' is not eligible for competence " + month + ".");
        }
        TransactionStatus status = amountType == RecurrenceAmountType.FIXED
                ? TransactionStatus.PENDING
                : TransactionStatus.ESTIMATED;
        LocalDate dueDate = dueDay != null ? month.clampDay(dueDay) : null;
        Installment installment = null;
        if (recurrenceType == RecurrenceType.INSTALLMENT) {
            int currentInstallment = (int) (startingInstallment + startMonth.monthsUntil(month));
            installment = Installment.of(currentInstallment, totalInstallments);
        }
        return Transaction.createMaterialized(
                budgetId,
                type,
                description,
                amount,
                status,
                dueDate,
                notes,
                categoryId,
                beneficiaryId,
                id,
                installment,
                now
        );
    }

    public LocalDate resolveDueDateFor(CompetenceMonth month) {
        return dueDay != null ? month.clampDay(dueDay) : null;
    }

    public void updateDefinition(
            TransactionType type,
            String description,
            Money amount,
            RecurrenceAmountType amountType,
            RecurrenceType recurrenceType,
            CompetenceMonth startMonth,
            CompetenceMonth endMonth,
            Integer totalInstallments,
            Integer startingInstallment,
            Integer dueDay,
            UUID categoryId,
            UUID beneficiaryId,
            String notes,
            Instant now
    ) {
        applyValidatedState(
                type, description, amount, amountType, recurrenceType,
                startMonth, endMonth, totalInstallments, startingInstallment,
                dueDay, categoryId, beneficiaryId, notes
        );
        this.updatedAt = Objects.requireNonNull(now, NOW_REQUIRED);
    }

    public void updateDefaultAmount(Money newAmount, Instant now) {
        if (newAmount == null || newAmount.amount().signum() <= 0) {
            throw new DomainValidationException("amount", "Amount must be greater than zero.");
        }
        this.amount = newAmount;
        this.updatedAt = Objects.requireNonNull(now, NOW_REQUIRED);
    }

    public void markAsGenerated(Instant now) {
        this.hasGeneratedTransactions = true;
        this.updatedAt = Objects.requireNonNull(now, NOW_REQUIRED);
    }

    public void deactivate(Instant now) {
        this.active = false;
        this.updatedAt = Objects.requireNonNull(now, NOW_REQUIRED);
    }

    public void activate(Instant now) {
        this.active = true;
        this.updatedAt = Objects.requireNonNull(now, NOW_REQUIRED);
    }

    private record ModeParameters(
            CompetenceMonth endMonth,
            Integer totalInstallments,
            Integer startingInstallment
    ) {
    }

    private void applyValidatedState(
            TransactionType type,
            String description,
            Money amount,
            RecurrenceAmountType amountType,
            RecurrenceType recurrenceType,
            CompetenceMonth startMonth,
            CompetenceMonth endMonth,
            Integer totalInstallments,
            Integer startingInstallment,
            Integer dueDay,
            UUID categoryId,
            UUID beneficiaryId,
            String notes
    ) {
        requireNonNullField(type, "type", "Recurrence type (INCOME/EXPENSE) is required.");
        String trimmedDesc = validateDescription(description);
        validatePositiveAmount(amount);
        requireNonNullField(amountType, "amountType", "Recurrence amount type is required.");
        requireNonNullField(recurrenceType, "recurrenceType", "Recurrence mode is required.");
        requireNonNullField(startMonth, "startMonth", "Start month is required.");
        validateDueDay(dueDay);
        String normalizedNotes = validateNotes(notes);
        ModeParameters modeParams = resolveModeParameters(
                recurrenceType, startMonth, endMonth, totalInstallments, startingInstallment);

        this.type = type;
        this.description = trimmedDesc;
        this.amount = amount;
        this.amountType = amountType;
        this.recurrenceType = recurrenceType;
        this.startMonth = startMonth;
        this.endMonth = modeParams.endMonth();
        this.totalInstallments = modeParams.totalInstallments();
        this.startingInstallment = modeParams.startingInstallment();
        this.dueDay = dueDay;
        this.categoryId = categoryId;
        this.beneficiaryId = beneficiaryId;
        this.notes = normalizedNotes;
    }

    private static void requireNonNullField(Object value, String field, String message) {
        if (value == null) {
            throw new DomainValidationException(field, message);
        }
    }

    private static String validateDescription(String description) {
        if (description == null || description.isBlank()) {
            throw new DomainValidationException("description", "Recurrence description must not be blank.");
        }
        String trimmed = description.trim();
        if (trimmed.length() > MAX_DESCRIPTION_LENGTH) {
            throw new DomainValidationException(
                    "description", "Recurrence description must not exceed " + MAX_DESCRIPTION_LENGTH + " characters.");
        }
        return trimmed;
    }

    private static void validatePositiveAmount(Money amount) {
        if (amount == null || amount.amount().signum() <= 0) {
            throw new DomainValidationException("amount", "Amount must be greater than zero.");
        }
    }

    private static void validateDueDay(Integer dueDay) {
        if (dueDay != null && (dueDay < 1 || dueDay > 31)) {
            throw new DomainValidationException("dueDay", "Due day must be between 1 and 31.");
        }
    }

    private static String validateNotes(String notes) {
        if (notes == null || notes.isBlank()) {
            return null;
        }
        String trimmed = notes.trim();
        if (trimmed.length() > MAX_NOTES_LENGTH) {
            throw new DomainValidationException("notes", "Notes must not exceed " + MAX_NOTES_LENGTH + " characters.");
        }
        return trimmed;
    }

    private static ModeParameters resolveModeParameters(
            RecurrenceType recurrenceType,
            CompetenceMonth startMonth,
            CompetenceMonth endMonth,
            Integer totalInstallments,
            Integer startingInstallment
    ) {
        return switch (recurrenceType) {
            case INDEFINITE -> new ModeParameters(null, null, null);
            case FIXED_TERM -> {
                if (endMonth == null) {
                    throw new DomainValidationException("endMonth", "End month is required for FIXED_TERM recurrences.");
                }
                if (endMonth.isBefore(startMonth)) {
                    throw new DomainValidationException("endMonth", "End month must not be before start month.");
                }
                yield new ModeParameters(endMonth, null, null);
            }
            case INSTALLMENT -> {
                if (totalInstallments == null || totalInstallments < 2) {
                    throw new DomainValidationException("totalInstallments", "Total installments must be at least 2.");
                }
                int startInst = startingInstallment != null ? startingInstallment : 1;
                if (startInst < 1 || startInst > totalInstallments) {
                    throw new DomainValidationException(
                            "startingInstallment",
                            "Starting installment must be between 1 and " + totalInstallments + ".");
                }
                CompetenceMonth derivedEnd = startMonth.plusMonths((long) totalInstallments - startInst);
                yield new ModeParameters(derivedEnd, totalInstallments, startInst);
            }
        };
    }

    @Override
    public UUID getId() {
        return id;
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

    public RecurrenceAmountType getAmountType() {
        return amountType;
    }

    public RecurrenceType getRecurrenceType() {
        return recurrenceType;
    }

    public CompetenceMonth getStartMonth() {
        return startMonth;
    }

    public CompetenceMonth getEndMonth() {
        return endMonth;
    }

    public Integer getTotalInstallments() {
        return totalInstallments;
    }

    public Integer getStartingInstallment() {
        return startingInstallment;
    }

    public Integer getDueDay() {
        return dueDay;
    }

    public UUID getCategoryId() {
        return categoryId;
    }

    public UUID getBeneficiaryId() {
        return beneficiaryId;
    }

    public String getNotes() {
        return notes;
    }

    public boolean isActive() {
        return active;
    }

    public boolean hasGeneratedTransactions() {
        return hasGeneratedTransactions;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
