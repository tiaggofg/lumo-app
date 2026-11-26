package io.github.tiaggofg.lumo.domain.shared;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ValueObjectsTest {

    @Test
    void moneyPositiveShouldScaleToTwoDecimalsHalfUp() {
        Money money = Money.positive(new BigDecimal("195.645"));
        assertThat(money.amount()).isEqualByComparingTo("195.65");
        assertThat(money.currency()).isEqualTo("BRL");
    }

    @Test
    void moneyPositiveShouldRejectNullZeroAndNegative() {
        assertThatThrownBy(() -> Money.positive(null)).isInstanceOf(DomainValidationException.class);
        assertThatThrownBy(() -> Money.positive(BigDecimal.ZERO)).isInstanceOf(DomainValidationException.class);
        assertThatThrownBy(() -> Money.positive(new BigDecimal("-10.00"))).isInstanceOf(DomainValidationException.class);
    }

    @Test
    void moneyShouldSupportZeroAddAndSubtract() {
        Money income = Money.positive(new BigDecimal("6362.29"));
        Money expense = Money.positive(new BigDecimal("6178.42"));
        Money balance = income.subtract(expense);

        assertThat(balance.amount()).isEqualByComparingTo("183.87");
        assertThat(Money.zero().add(balance).amount()).isEqualByComparingTo("183.87");
    }

    @Test
    void moneyShouldRejectNonBrlCurrency() {
        assertThatThrownBy(() -> new Money(BigDecimal.TEN, "USD"))
                .isInstanceOf(DomainValidationException.class);
    }

    @Test
    void competenceMonthShouldParseIsoYearMonth() {
        CompetenceMonth month = CompetenceMonth.parse("2026-11");
        assertThat(month.toIsoString()).isEqualTo("2026-11");
        assertThat(month.plusMonths(2).toIsoString()).isEqualTo("2027-01");
    }

    @Test
    void competenceMonthShouldRejectInvalidFormats() {
        assertThatThrownBy(() -> CompetenceMonth.parse(null)).isInstanceOf(DomainValidationException.class);
        assertThatThrownBy(() -> CompetenceMonth.parse("2026-13")).isInstanceOf(DomainValidationException.class);
        assertThatThrownBy(() -> CompetenceMonth.parse("11-2026")).isInstanceOf(DomainValidationException.class);
    }

    @Test
    void competenceMonthClampDayShouldHandleFebruaryNonLeapAndLeapYears() {
        CompetenceMonth feb2026 = CompetenceMonth.parse("2026-02");
        CompetenceMonth feb2028 = CompetenceMonth.parse("2028-02");
        CompetenceMonth nov2026 = CompetenceMonth.parse("2026-11");

        assertThat(feb2026.clampDay(31)).isEqualTo(LocalDate.of(2026, 2, 28));
        assertThat(feb2028.clampDay(31)).isEqualTo(LocalDate.of(2028, 2, 29));
        assertThat(nov2026.clampDay(31)).isEqualTo(LocalDate.of(2026, 11, 30));
        assertThat(nov2026.clampDay(15)).isEqualTo(LocalDate.of(2026, 11, 15));
    }

    @Test
    void competenceMonthClampDayShouldRejectOutOfRangeDays() {
        CompetenceMonth nov = CompetenceMonth.parse("2026-11");
        assertThatThrownBy(() -> nov.clampDay(0)).isInstanceOf(DomainValidationException.class);
        assertThatThrownBy(() -> nov.clampDay(32)).isInstanceOf(DomainValidationException.class);
    }

    @Test
    void competenceMonthShouldComputeMonthsUntil() {
        CompetenceMonth start = CompetenceMonth.parse("2026-11");
        CompetenceMonth end = CompetenceMonth.parse("2027-01");
        assertThat(start.monthsUntil(end)).isEqualTo(2L);
    }

    @Test
    void installmentShouldFormatValidCurrentAndTotal() {
        Installment installment = Installment.of(4, 6);
        assertThat(installment.formatted()).isEqualTo("4/6");
    }

    @Test
    void installmentShouldRejectTotalLessThanTwo() {
        assertThatThrownBy(() -> Installment.of(1, 1)).isInstanceOf(DomainValidationException.class);
    }

    @Test
    void installmentShouldRejectCurrentOutOfBounds() {
        assertThatThrownBy(() -> Installment.of(0, 6)).isInstanceOf(DomainValidationException.class);
        assertThatThrownBy(() -> Installment.of(7, 6)).isInstanceOf(DomainValidationException.class);
    }
}
