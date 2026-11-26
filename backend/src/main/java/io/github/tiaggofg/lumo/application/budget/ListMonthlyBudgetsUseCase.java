package io.github.tiaggofg.lumo.application.budget;

import io.github.tiaggofg.lumo.application.stereotype.Query;
import jakarta.inject.Inject;

import java.util.List;

@Query
public class ListMonthlyBudgetsUseCase {

    private final BudgetReadModelPort readModelPort;

    @Inject
    public ListMonthlyBudgetsUseCase(BudgetReadModelPort readModelPort) {
        this.readModelPort = readModelPort;
    }

    public List<BudgetReadModelPort.MonthlyBudgetListItemOutput> execute() {
        return readModelPort.findAllSummariesOrderedByCompetenceDesc();
    }
}
