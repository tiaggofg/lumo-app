package io.github.tiaggofg.lumo.application.budget;

import io.github.tiaggofg.lumo.application.stereotype.Query;
import io.github.tiaggofg.lumo.domain.shared.ResourceNotFoundException;
import jakarta.inject.Inject;

import java.util.UUID;

@Query
public class GetMonthlyBudgetDetailUseCase {

    private final BudgetReadModelPort readModelPort;

    @Inject
    public GetMonthlyBudgetDetailUseCase(BudgetReadModelPort readModelPort) {
        this.readModelPort = readModelPort;
    }

    public BudgetReadModelPort.MonthlyBudgetDetailOutput execute(UUID id) {
        return readModelPort.findDetailById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MonthlyBudget not found: " + id));
    }
}
