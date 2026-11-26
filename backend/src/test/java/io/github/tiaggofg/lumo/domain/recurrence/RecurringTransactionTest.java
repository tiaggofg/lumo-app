package io.github.tiaggofg.lumo.domain.recurrence;

import io.github.tiaggofg.lumo.domain.shared.BusinessRuleViolationException;
import io.github.tiaggofg.lumo.domain.shared.CompetenceMonth;
import io.github.tiaggofg.lumo.domain.shared.DomainValidationException;
import io.github.tiaggofg.lumo.domain.shared.Installment;
import io.github.tiaggofg.lumo.domain.shared.Money;
import io.github.tiaggofg.lumo.domain.transaction.Transaction;
import io.github.tiaggofg.lumo.domain.transaction.TransactionStatus;
import io.github.tiaggofg.lumo.domain.transaction.TransactionType;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RecurringTransactionTest {

    private static final Instant NOW = Instant.parse("2026-11-26T12:00:00Z");
    private static final UUID BUDGET_ID = UUID.randomUUID();

    @Test
    void indefiniteFixedRuleShouldBeEligibleFromStartMonthOnwardAndMaterializePending() {
        RecurringTransaction rule = RecurringTransaction.create(
                TransactionType.EXPENSE, "Aluguel", Money.positive(new BigDecimal("800.00")),
                RecurrenceAmountType.FIXED, RecurrenceType.INDEFINITE,
                CompetenceMonth.parse("2026-10"), null, null, null, 31, null, null, "Casa", NOW
        );

        assertThat(rule.isEligibleFor(CompetenceMonth.parse("2026-09"))).isFalse();
        assertThat(rule.isEligibleFor(CompetenceMonth.parse("2026-10"))).isTrue();
        assertThat(rule.isEligibleFor(CompetenceMonth.parse("2028-02"))).isTrue();

        Transaction febNonLeap = rule.materializeFor(BUDGET_ID, CompetenceMonth.parse("2027-02"), NOW);
        assertThat(febNonLeap.getStatus()).isEqualTo(TransactionStatus.PENDING);
        assertThat(febNonLeap.getDueDate()).isEqualTo(LocalDate.of(2027, 2, 28));
        assertThat(febNonLeap.getInstallment()).isNull();
        assertThat(febNonLeap.getSourceRecurringTransactionId()).isEqualTo(rule.getId());

        Transaction febLeap = rule.materializeFor(BUDGET_ID, CompetenceMonth.parse("2028-02"), NOW);
        assertThat(febLeap.getDueDate()).isEqualTo(LocalDate.of(2028, 2, 29));
    }

    @Test
    void estimatedAmountTypeShouldMaterializeAsEstimatedStatus() {
        RecurringTransaction rule = RecurringTransaction.create(
                TransactionType.EXPENSE, "Água", Money.positive(new BigDecimal("180.00")),
                RecurrenceAmountType.ESTIMATED, RecurrenceType.INDEFINITE,
                CompetenceMonth.parse("2026-11"), null, null, null, 20, null, null, null, NOW
        );

        Transaction txn = rule.materializeFor(BUDGET_ID, CompetenceMonth.parse("2026-11"), NOW);
        assertThat(txn.getStatus()).isEqualTo(TransactionStatus.ESTIMATED);
        assertThat(txn.getDueDate()).isEqualTo(LocalDate.of(2026, 11, 20));
    }

    @Test
    void fixedTermRuleShouldBeEligibleInclusivelyAndProduceNullInstallment() {
        RecurringTransaction rule = RecurringTransaction.create(
                TransactionType.EXPENSE, "Dentista - Tiago", Money.positive(new BigDecimal("150.00")),
                RecurrenceAmountType.FIXED, RecurrenceType.FIXED_TERM,
                CompetenceMonth.parse("2026-09"), CompetenceMonth.parse("2026-11"),
                null, null, null, null, null, "Até Novembro", NOW
        );

        assertThat(rule.isEligibleFor(CompetenceMonth.parse("2026-08"))).isFalse();
        assertThat(rule.isEligibleFor(CompetenceMonth.parse("2026-09"))).isTrue();
        assertThat(rule.isEligibleFor(CompetenceMonth.parse("2026-11"))).isTrue();
        assertThat(rule.isEligibleFor(CompetenceMonth.parse("2026-12"))).isFalse();

        Transaction nov = rule.materializeFor(BUDGET_ID, CompetenceMonth.parse("2026-11"), NOW);
        assertThat(nov.getInstallment()).isNull();
        assertThat(nov.getDueDate()).isNull();
    }

    @Test
    void installmentRuleStartingAtFourOfSixShouldGenerateFourFiveSixAndStop() {
        RecurringTransaction rule = RecurringTransaction.create(
                TransactionType.EXPENSE, "Cartão Sogra", Money.positive(new BigDecimal("58.66")),
                RecurrenceAmountType.FIXED, RecurrenceType.INSTALLMENT,
                CompetenceMonth.parse("2026-11"), null, 6, 4, 15, null, null, null, NOW
        );

        assertThat(rule.getEndMonth()).isEqualTo(CompetenceMonth.parse("2027-01"));
        assertThat(rule.isEligibleFor(CompetenceMonth.parse("2026-10"))).isFalse();
        assertThat(rule.isEligibleFor(CompetenceMonth.parse("2026-11"))).isTrue();
        assertThat(rule.isEligibleFor(CompetenceMonth.parse("2026-12"))).isTrue();
        assertThat(rule.isEligibleFor(CompetenceMonth.parse("2027-01"))).isTrue();
        assertThat(rule.isEligibleFor(CompetenceMonth.parse("2027-02"))).isFalse();

        assertThat(rule.materializeFor(BUDGET_ID, CompetenceMonth.parse("2026-11"), NOW).getInstallment())
                .isEqualTo(Installment.of(4, 6));
        assertThat(rule.materializeFor(BUDGET_ID, CompetenceMonth.parse("2026-12"), NOW).getInstallment())
                .isEqualTo(Installment.of(5, 6));
        assertThat(rule.materializeFor(BUDGET_ID, CompetenceMonth.parse("2027-01"), NOW).getInstallment())
                .isEqualTo(Installment.of(6, 6));
    }

    @Test
    void installmentRuleShouldDefaultStartingInstallmentToOne() {
        RecurringTransaction rule = RecurringTransaction.create(
                TransactionType.EXPENSE, "Seguro", Money.positive(new BigDecimal("200.00")),
                RecurrenceAmountType.FIXED, RecurrenceType.INSTALLMENT,
                CompetenceMonth.parse("2026-11"), null, 3, null, null, null, null, null, NOW
        );

        assertThat(rule.getStartingInstallment()).isEqualTo(1);
        assertThat(rule.getEndMonth()).isEqualTo(CompetenceMonth.parse("2027-01"));
    }

    @Test
    void shouldRejectFixedTermWithoutEndMonthOrEndBeforeStart() {
        assertThatThrownBy(() -> RecurringTransaction.create(
                TransactionType.EXPENSE, "Dentista", Money.positive(BigDecimal.TEN),
                RecurrenceAmountType.FIXED, RecurrenceType.FIXED_TERM,
                CompetenceMonth.parse("2026-11"), null, null, null, null, null, null, null, NOW))
                .isInstanceOf(DomainValidationException.class);

        assertThatThrownBy(() -> RecurringTransaction.create(
                TransactionType.EXPENSE, "Dentista", Money.positive(BigDecimal.TEN),
                RecurrenceAmountType.FIXED, RecurrenceType.FIXED_TERM,
                CompetenceMonth.parse("2026-11"), CompetenceMonth.parse("2026-10"), null, null, null, null, null, null, NOW))
                .isInstanceOf(DomainValidationException.class);
    }

    @Test
    void shouldRejectInvalidInstallmentParameters() {
        assertThatThrownBy(() -> RecurringTransaction.create(
                TransactionType.EXPENSE, "Parcela", Money.positive(BigDecimal.TEN),
                RecurrenceAmountType.FIXED, RecurrenceType.INSTALLMENT,
                CompetenceMonth.parse("2026-11"), null, 1, 1, null, null, null, null, NOW))
                .isInstanceOf(DomainValidationException.class);

        assertThatThrownBy(() -> RecurringTransaction.create(
                TransactionType.EXPENSE, "Parcela", Money.positive(BigDecimal.TEN),
                RecurrenceAmountType.FIXED, RecurrenceType.INSTALLMENT,
                CompetenceMonth.parse("2026-11"), null, 6, 7, null, null, null, null, NOW))
                .isInstanceOf(DomainValidationException.class);
    }

    @Test
    void shouldRejectOutOfRangeDueDay() {
        assertThatThrownBy(() -> RecurringTransaction.create(
                TransactionType.EXPENSE, "Aluguel", Money.positive(BigDecimal.TEN),
                RecurrenceAmountType.FIXED, RecurrenceType.INDEFINITE,
                CompetenceMonth.parse("2026-11"), null, null, null, 32, null, null, null, NOW))
                .isInstanceOf(DomainValidationException.class);
    }

    @Test
    void inactiveRuleShouldNotBeEligibleAndRejectMaterialization() {
        RecurringTransaction rule = RecurringTransaction.create(
                TransactionType.EXPENSE, "Aluguel", Money.positive(new BigDecimal("800.00")),
                RecurrenceAmountType.FIXED, RecurrenceType.INDEFINITE,
                CompetenceMonth.parse("2026-11"), null, null, null, null, null, null, null, NOW
        );
        rule.deactivate(NOW.plusSeconds(10));

        assertThat(rule.isActive()).isFalse();
        assertThat(rule.isEligibleFor(CompetenceMonth.parse("2026-11"))).isFalse();
        assertThatThrownBy(() -> rule.materializeFor(BUDGET_ID, CompetenceMonth.parse("2026-11"), NOW))
                .isInstanceOf(BusinessRuleViolationException.class);
    }

    @Test
    void shouldUpdateDefaultAmountAndMarkAsGenerated() {
        RecurringTransaction rule = RecurringTransaction.create(
                TransactionType.EXPENSE, "Água", Money.positive(new BigDecimal("180.00")),
                RecurrenceAmountType.ESTIMATED, RecurrenceType.INDEFINITE,
                CompetenceMonth.parse("2026-11"), null, null, null, null, null, null, null, NOW
        );

        rule.updateDefaultAmount(Money.positive(new BigDecimal("195.64")), NOW.plusSeconds(10));
        rule.markAsGenerated(NOW.plusSeconds(20));

        assertThat(rule.getAmount().amount()).isEqualByComparingTo("195.64");
        assertThat(rule.hasGeneratedTransactions()).isTrue();
    }
}
