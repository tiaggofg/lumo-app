package io.github.tiaggofg.lumo.domain.transaction;

import io.github.tiaggofg.lumo.domain.shared.BusinessRuleViolationException;
import io.github.tiaggofg.lumo.domain.shared.DomainValidationException;
import io.github.tiaggofg.lumo.domain.shared.Installment;
import io.github.tiaggofg.lumo.domain.shared.Money;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TransactionTest {

    private static final UUID BUDGET_ID = UUID.randomUUID();
    private static final LocalDate TODAY = LocalDate.of(2026, 11, 26);
    private static final Instant NOW = Instant.parse("2026-11-26T12:00:00Z");

    @Test
    void shouldCreatePendingManualTransactionWithNullPaymentDate() {
        Transaction txn = Transaction.createManual(
                BUDGET_ID, TransactionType.EXPENSE, "Aluguel",
                Money.positive(new BigDecimal("800.00")), TransactionStatus.PENDING,
                LocalDate.of(2026, 11, 5), LocalDate.of(2026, 11, 1), null, null, null, TODAY, NOW
        );

        assertThat(txn.getId()).isNotNull();
        assertThat(txn.getMonthlyBudgetId()).isEqualTo(BUDGET_ID);
        assertThat(txn.getStatus()).isEqualTo(TransactionStatus.PENDING);
        assertThat(txn.getPaymentDate()).isNull();
    }

    @Test
    void shouldAutoPopulatePaymentDateWhenCreatedAsSettledWithoutDate() {
        Transaction txn = Transaction.createManual(
                BUDGET_ID, TransactionType.INCOME, "Salário",
                Money.positive(new BigDecimal("6362.29")), TransactionStatus.SETTLED,
                null, null, null, null, null, TODAY, NOW
        );

        assertThat(txn.getStatus()).isEqualTo(TransactionStatus.SETTLED);
        assertThat(txn.getPaymentDate()).isEqualTo(TODAY);
    }

    @Test
    void shouldPreserveExplicitPaymentDateWhenSettled() {
        LocalDate explicit = LocalDate.of(2026, 11, 10);
        Transaction txn = Transaction.createManual(
                BUDGET_ID, TransactionType.EXPENSE, "Internet",
                Money.positive(new BigDecimal("100.00")), TransactionStatus.SETTLED,
                null, explicit, null, null, null, TODAY, NOW
        );

        assertThat(txn.getPaymentDate()).isEqualTo(explicit);
    }

    @Test
    void shouldPopulatePaymentDateOnTransitionToSettledAndClearOnRevert() {
        Transaction txn = Transaction.createManual(
                BUDGET_ID, TransactionType.EXPENSE, "Água",
                Money.positive(new BigDecimal("180.00")), TransactionStatus.PENDING,
                null, null, null, null, null, TODAY, NOW
        );

        txn.changeStatus(TransactionStatus.SETTLED, null, TODAY, NOW.plusSeconds(10));
        assertThat(txn.getStatus()).isEqualTo(TransactionStatus.SETTLED);
        assertThat(txn.getPaymentDate()).isEqualTo(TODAY);

        txn.changeStatus(TransactionStatus.PENDING, null, TODAY, NOW.plusSeconds(20));
        assertThat(txn.getStatus()).isEqualTo(TransactionStatus.PENDING);
        assertThat(txn.getPaymentDate()).isNull();

        txn.changeStatus(TransactionStatus.SETTLED, LocalDate.of(2026, 11, 20), TODAY, NOW.plusSeconds(30));
        txn.changeStatus(TransactionStatus.ESTIMATED, null, TODAY, NOW.plusSeconds(40));
        assertThat(txn.getPaymentDate()).isNull();
    }

    @Test
    void shouldEnforceMonthlyBudgetIdImmutability() {
        Transaction txn = Transaction.createManual(
                BUDGET_ID, TransactionType.EXPENSE, "Aluguel",
                Money.positive(new BigDecimal("800.00")), TransactionStatus.PENDING,
                null, null, null, null, null, TODAY, NOW
        );

        txn.ensureBelongsToBudget(BUDGET_ID);
        UUID otherBudgetId = UUID.randomUUID();
        assertThatThrownBy(() -> txn.ensureBelongsToBudget(otherBudgetId))
                .isInstanceOf(DomainValidationException.class)
                .hasMessageContaining("immutable");
    }

    @Test
    void shouldConfirmEstimateToPending() {
        Transaction txn = Transaction.createManual(
                BUDGET_ID, TransactionType.EXPENSE, "Água",
                Money.positive(new BigDecimal("180.00")), TransactionStatus.ESTIMATED,
                null, null, null, null, null, TODAY, NOW
        );

        txn.confirmEstimate(Money.positive(new BigDecimal("195.64")), TransactionStatus.PENDING, null, TODAY, NOW.plusSeconds(10));

        assertThat(txn.getAmount().amount()).isEqualByComparingTo("195.64");
        assertThat(txn.getStatus()).isEqualTo(TransactionStatus.PENDING);
        assertThat(txn.getPaymentDate()).isNull();
    }

    @Test
    void shouldConfirmEstimateToSettledAndFillPaymentDate() {
        Transaction txn = Transaction.createManual(
                BUDGET_ID, TransactionType.EXPENSE, "Água",
                Money.positive(new BigDecimal("180.00")), TransactionStatus.ESTIMATED,
                null, null, null, null, null, TODAY, NOW
        );

        txn.confirmEstimate(Money.positive(new BigDecimal("195.64")), TransactionStatus.SETTLED, null, TODAY, NOW.plusSeconds(10));

        assertThat(txn.getStatus()).isEqualTo(TransactionStatus.SETTLED);
        assertThat(txn.getPaymentDate()).isEqualTo(TODAY);
    }

    @Test
    void shouldRejectConfirmEstimateWhenNotEstimated() {
        Transaction txn = Transaction.createManual(
                BUDGET_ID, TransactionType.EXPENSE, "Aluguel",
                Money.positive(new BigDecimal("800.00")), TransactionStatus.PENDING,
                null, null, null, null, null, TODAY, NOW
        );

        assertThatThrownBy(() -> txn.confirmEstimate(
                Money.positive(new BigDecimal("850.00")), TransactionStatus.SETTLED, null, TODAY, NOW))
                .isInstanceOf(BusinessRuleViolationException.class);
    }

    @Test
    void shouldRejectConfirmEstimateWhenTargetStatusIsEstimated() {
        Transaction txn = Transaction.createManual(
                BUDGET_ID, TransactionType.EXPENSE, "Água",
                Money.positive(new BigDecimal("180.00")), TransactionStatus.ESTIMATED,
                null, null, null, null, null, TODAY, NOW
        );

        assertThatThrownBy(() -> txn.confirmEstimate(
                Money.positive(new BigDecimal("195.64")), TransactionStatus.ESTIMATED, null, TODAY, NOW))
                .isInstanceOf(BusinessRuleViolationException.class);
    }

    @Test
    void shouldApplyRecurrencePropagationToOpenTransaction() {
        UUID recurringId = UUID.randomUUID();
        Transaction txn = Transaction.createMaterialized(
                BUDGET_ID, TransactionType.EXPENSE, "Aluguel",
                Money.positive(new BigDecimal("800.00")), TransactionStatus.PENDING,
                LocalDate.of(2026, 11, 5), null, null, null, recurringId, Installment.of(4, 6), NOW
        );

        txn.applyRecurrencePropagation(
                "Aluguel Atualizado", Money.positive(new BigDecimal("850.00")),
                LocalDate.of(2026, 11, 10), null, null, "Reajuste", NOW.plusSeconds(10));

        assertThat(txn.getDescription()).isEqualTo("Aluguel Atualizado");
        assertThat(txn.getAmount().amount()).isEqualByComparingTo("850.00");
        assertThat(txn.getDueDate()).isEqualTo(LocalDate.of(2026, 11, 10));
        assertThat(txn.getNotes()).isEqualTo("Reajuste");
    }

    @Test
    void shouldRejectRecurrencePropagationOnSettledTransaction() {
        Transaction txn = Transaction.createManual(
                BUDGET_ID, TransactionType.EXPENSE, "Aluguel",
                Money.positive(new BigDecimal("800.00")), TransactionStatus.SETTLED,
                null, TODAY, null, null, null, TODAY, NOW
        );

        assertThatThrownBy(() -> txn.applyRecurrencePropagation(
                "Aluguel Atualizado", Money.positive(new BigDecimal("850.00")),
                null, null, null, null, NOW.plusSeconds(10)))
                .isInstanceOf(BusinessRuleViolationException.class);
    }

    @Test
    void shouldRejectBlankDescriptionAndLongDescription() {
        assertThatThrownBy(() -> Transaction.createManual(
                BUDGET_ID, TransactionType.EXPENSE, "  ",
                Money.positive(BigDecimal.TEN), TransactionStatus.PENDING,
                null, null, null, null, null, TODAY, NOW))
                .isInstanceOf(DomainValidationException.class);

        assertThatThrownBy(() -> Transaction.createManual(
                BUDGET_ID, TransactionType.EXPENSE, "d".repeat(141),
                Money.positive(BigDecimal.TEN), TransactionStatus.PENDING,
                null, null, null, null, null, TODAY, NOW))
                .isInstanceOf(DomainValidationException.class);
    }

    @Test
    void shouldRejectNotesLongerThan500Characters() {
        assertThatThrownBy(() -> Transaction.createManual(
                BUDGET_ID, TransactionType.EXPENSE, "Cartão",
                Money.positive(BigDecimal.TEN), TransactionStatus.PENDING,
                null, null, "n".repeat(501), null, null, TODAY, NOW))
                .isInstanceOf(DomainValidationException.class);
    }

    @Test
    void shouldRejectMaterializedTransactionStartingAsSettled() {
        assertThatThrownBy(() -> Transaction.createMaterialized(
                BUDGET_ID, TransactionType.EXPENSE, "Aluguel",
                Money.positive(BigDecimal.TEN), TransactionStatus.SETTLED,
                null, null, null, null, UUID.randomUUID(), null, NOW))
                .isInstanceOf(DomainValidationException.class);
    }
}
