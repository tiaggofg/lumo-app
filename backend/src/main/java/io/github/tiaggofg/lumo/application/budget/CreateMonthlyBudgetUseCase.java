package io.github.tiaggofg.lumo.application.budget;

import io.github.tiaggofg.lumo.application.recurrence.RecurringMaterializationService;
import io.github.tiaggofg.lumo.application.stereotype.Command;
import io.github.tiaggofg.lumo.domain.budget.MonthlyBudget;
import io.github.tiaggofg.lumo.domain.budget.MonthlyBudgetRepository;
import io.github.tiaggofg.lumo.domain.shared.CompetenceMonth;
import io.github.tiaggofg.lumo.domain.shared.ResourceConflictException;
import jakarta.inject.Inject;

import java.time.Clock;

@Command
public class CreateMonthlyBudgetUseCase {

    private final MonthlyBudgetRepository budgetRepository;
    private final RecurringMaterializationService materializationService;
    private final BudgetReadModelPort readModelPort;
    private final Clock clock;

    @Inject
    public CreateMonthlyBudgetUseCase(
            MonthlyBudgetRepository budgetRepository,
            RecurringMaterializationService materializationService,
            BudgetReadModelPort readModelPort,
            Clock clock
    ) {
        this.budgetRepository = budgetRepository;
        this.materializationService = materializationService;
        this.readModelPort = readModelPort;
        this.clock = clock;
    }

    public BudgetReadModelPort.CreateMonthlyBudgetOutput execute(String competenceMonthRaw) {
        CompetenceMonth competenceMonth = CompetenceMonth.parse(competenceMonthRaw);
        if (budgetRepository.existsByCompetenceMonth(competenceMonth)) {
            throw new ResourceConflictException(
                    "MonthlyBudget already exists for competence " + competenceMonth.toIsoString() + ".");
        }

        MonthlyBudget saved = budgetRepository.save(MonthlyBudget.create(competenceMonth, clock.instant()));
        int materializedCount = materializationService.materializeAllEligibleForBudget(saved);

        BudgetReadModelPort.BudgetSummaryOutput summary = readModelPort.findDetailById(saved.getId())
                .map(BudgetReadModelPort.MonthlyBudgetDetailOutput::summary)
                .orElse(BudgetReadModelPort.BudgetSummaryOutput.zero());

        return new BudgetReadModelPort.CreateMonthlyBudgetOutput(
                saved.getId(),
                saved.getCompetenceMonth().toIsoString(),
                materializedCount,
                summary,
                saved.getCreatedAt(),
                saved.getUpdatedAt()
        );
    }
}
