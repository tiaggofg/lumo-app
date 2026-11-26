package io.github.tiaggofg.lumo.domain.budget;

import io.github.tiaggofg.lumo.domain.shared.CompetenceMonth;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MonthlyBudgetRepository {

    MonthlyBudget save(MonthlyBudget budget);

    Optional<MonthlyBudget> findById(UUID id);

    boolean existsByCompetenceMonth(CompetenceMonth competenceMonth);

    List<MonthlyBudget> findByCompetenceMonthGreaterThanEqual(CompetenceMonth competenceMonth);

    void deleteById(UUID id);
}
