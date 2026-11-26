package io.github.tiaggofg.lumo.infrastructure.persistence.transaction;

import io.github.tiaggofg.lumo.domain.shared.Installment;
import io.github.tiaggofg.lumo.domain.shared.Money;
import io.github.tiaggofg.lumo.domain.transaction.Transaction;
import io.github.tiaggofg.lumo.domain.transaction.TransactionStatus;
import io.github.tiaggofg.lumo.domain.transaction.TransactionType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "transactions")
public class TransactionJpaEntity {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "monthly_budget_id", nullable = false)
    private UUID monthlyBudgetId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 16)
    private TransactionType type;

    @Column(name = "description", nullable = false, length = 140)
    private String description;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 16)
    private TransactionStatus status;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "payment_date")
    private LocalDate paymentDate;

    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "category_id")
    private UUID categoryId;

    @Column(name = "beneficiary_id")
    private UUID beneficiaryId;

    @Column(name = "source_recurring_transaction_id")
    private UUID sourceRecurringTransactionId;

    @Column(name = "installment_current")
    private Integer installmentCurrent;

    @Column(name = "installment_total")
    private Integer installmentTotal;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected TransactionJpaEntity() {
    }

    public static TransactionJpaEntity fromDomain(Transaction txn) {
        TransactionJpaEntity entity = new TransactionJpaEntity();
        entity.id = txn.getId();
        entity.monthlyBudgetId = txn.getMonthlyBudgetId();
        entity.type = txn.getType();
        entity.description = txn.getDescription();
        entity.amount = txn.getAmount().amount();
        entity.status = txn.getStatus();
        entity.dueDate = txn.getDueDate();
        entity.paymentDate = txn.getPaymentDate();
        entity.notes = txn.getNotes();
        entity.categoryId = txn.getCategoryId();
        entity.beneficiaryId = txn.getBeneficiaryId();
        entity.sourceRecurringTransactionId = txn.getSourceRecurringTransactionId();
        if (txn.getInstallment() != null) {
            entity.installmentCurrent = txn.getInstallment().current();
            entity.installmentTotal = txn.getInstallment().total();
        }
        entity.createdAt = txn.getCreatedAt();
        entity.updatedAt = txn.getUpdatedAt();
        return entity;
    }

    public Transaction toDomain() {
        Installment installment = (installmentCurrent != null && installmentTotal != null)
                ? Installment.of(installmentCurrent, installmentTotal)
                : null;
        return Transaction.reconstitute(
                id,
                monthlyBudgetId,
                type,
                description,
                Money.positive(amount),
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

    public UUID getId() {
        return id;
    }
}
