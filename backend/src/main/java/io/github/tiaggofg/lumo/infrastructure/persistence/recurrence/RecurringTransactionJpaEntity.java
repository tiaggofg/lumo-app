package io.github.tiaggofg.lumo.infrastructure.persistence.recurrence;

import io.github.tiaggofg.lumo.domain.recurrence.RecurrenceAmountType;
import io.github.tiaggofg.lumo.domain.recurrence.RecurrenceType;
import io.github.tiaggofg.lumo.domain.recurrence.RecurringTransaction;
import io.github.tiaggofg.lumo.domain.shared.CompetenceMonth;
import io.github.tiaggofg.lumo.domain.shared.Money;
import io.github.tiaggofg.lumo.domain.transaction.TransactionType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "recurring_transactions")
public class RecurringTransactionJpaEntity {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 16)
    private TransactionType type;

    @Column(name = "description", nullable = false, length = 140)
    private String description;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "amount_type", nullable = false, length = 16)
    private RecurrenceAmountType amountType;

    @Enumerated(EnumType.STRING)
    @Column(name = "recurrence_type", nullable = false, length = 16)
    private RecurrenceType recurrenceType;

    @Column(name = "start_month", nullable = false, length = 7)
    private String startMonth;

    @Column(name = "end_month", length = 7)
    private String endMonth;

    @Column(name = "total_installments")
    private Integer totalInstallments;

    @Column(name = "starting_installment")
    private Integer startingInstallment;

    @Column(name = "due_day")
    private Integer dueDay;

    @Column(name = "category_id")
    private UUID categoryId;

    @Column(name = "beneficiary_id")
    private UUID beneficiaryId;

    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "active", nullable = false)
    private boolean active;

    @Column(name = "has_generated_transactions", nullable = false)
    private boolean hasGeneratedTransactions;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected RecurringTransactionJpaEntity() {
    }

    public static RecurringTransactionJpaEntity fromDomain(RecurringTransaction rule) {
        RecurringTransactionJpaEntity entity = new RecurringTransactionJpaEntity();
        entity.id = rule.getId();
        entity.type = rule.getType();
        entity.description = rule.getDescription();
        entity.amount = rule.getAmount().amount();
        entity.amountType = rule.getAmountType();
        entity.recurrenceType = rule.getRecurrenceType();
        entity.startMonth = rule.getStartMonth().toIsoString();
        entity.endMonth = rule.getEndMonth() != null ? rule.getEndMonth().toIsoString() : null;
        entity.totalInstallments = rule.getTotalInstallments();
        entity.startingInstallment = rule.getStartingInstallment();
        entity.dueDay = rule.getDueDay();
        entity.categoryId = rule.getCategoryId();
        entity.beneficiaryId = rule.getBeneficiaryId();
        entity.notes = rule.getNotes();
        entity.active = rule.isActive();
        entity.hasGeneratedTransactions = rule.hasGeneratedTransactions();
        entity.createdAt = rule.getCreatedAt();
        entity.updatedAt = rule.getUpdatedAt();
        return entity;
    }

    public RecurringTransaction toDomain() {
        return RecurringTransaction.reconstitute(
                id,
                type,
                description,
                Money.positive(amount),
                amountType,
                recurrenceType,
                CompetenceMonth.parse(startMonth),
                endMonth != null ? CompetenceMonth.parse(endMonth) : null,
                totalInstallments,
                startingInstallment,
                dueDay,
                categoryId,
                beneficiaryId,
                notes,
                active,
                hasGeneratedTransactions,
                createdAt,
                updatedAt
        );
    }
}
