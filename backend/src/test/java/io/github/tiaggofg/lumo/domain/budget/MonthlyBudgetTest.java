package io.github.tiaggofg.lumo.domain.budget;

import io.github.tiaggofg.lumo.domain.shared.CompetenceMonth;
import io.github.tiaggofg.lumo.domain.shared.DomainValidationException;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class MonthlyBudgetTest {

    private static final Instant NOW = Instant.parse("2026-11-26T12:00:00Z");

    @Test
    void shouldCreateMonthlyBudgetWithGeneratedUuid() {
        MonthlyBudget budget = MonthlyBudget.create(CompetenceMonth.parse("2026-11"), NOW);

        assertThat(budget.getId()).isNotNull();
        assertThat(budget.getCompetenceMonth().toIsoString()).isEqualTo("2026-11");
        assertThat(budget.getCreatedAt()).isEqualTo(NOW);
        assertThat(budget.getUpdatedAt()).isEqualTo(NOW);
    }

    @Test
    void shouldRejectNullCompetenceMonth() {
        assertThatThrownBy(() -> MonthlyBudget.create(null, NOW))
                .isInstanceOf(DomainValidationException.class);
    }

    @Test
    void shouldReconstituteBudgetWithoutGeneratingNewId() {
        MonthlyBudget original = MonthlyBudget.create(CompetenceMonth.parse("2026-10"), NOW);
        MonthlyBudget reconstituted = MonthlyBudget.reconstitute(
                original.getId(), original.getCompetenceMonth(), original.getCreatedAt(), original.getUpdatedAt());

        assertThat(reconstituted.getId()).isEqualTo(original.getId());
        assertThat(reconstituted.getCompetenceMonth()).isEqualTo(original.getCompetenceMonth());
    }

    @Test
    void shouldNotPersistTotalFieldsInAggregateRoot() {
        var fieldNames = Arrays.stream(MonthlyBudget.class.getDeclaredFields())
                .map(Field::getName)
                .toList();

        assertThat(fieldNames).doesNotContain(
                "totalIncome", "totalExpense", "balance",
                "plannedIncome", "realizedIncome", "plannedExpense", "realizedExpense"
        );
    }
}
