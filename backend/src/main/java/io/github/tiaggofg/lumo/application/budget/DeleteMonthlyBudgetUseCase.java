package io.github.tiaggofg.lumo.application.budget;

import io.github.tiaggofg.lumo.application.stereotype.Command;
import io.github.tiaggofg.lumo.domain.budget.MonthlyBudgetRepository;
import io.github.tiaggofg.lumo.domain.shared.ResourceConflictException;
import io.github.tiaggofg.lumo.domain.shared.ResourceNotFoundException;
import io.github.tiaggofg.lumo.domain.transaction.TransactionRepository;
import jakarta.inject.Inject;

import java.util.UUID;

@Command
public class DeleteMonthlyBudgetUseCase {

    private final MonthlyBudgetRepository budgetRepository;
    private final TransactionRepository transactionRepository;

    @Inject
    public DeleteMonthlyBudgetUseCase(
            MonthlyBudgetRepository budgetRepository,
            TransactionRepository transactionRepository
    ) {
        this.budgetRepository = budgetRepository;
        this.transactionRepository = transactionRepository;
    }

    public void execute(UUID id) {
        if (budgetRepository.findById(id).isEmpty()) {
            throw new ResourceNotFoundException("MonthlyBudget not found: " + id);
        }
        if (transactionRepository.existsByMonthlyBudgetId(id)) {
            throw new ResourceConflictException(
                    "MonthlyBudget cannot be deleted because it has associated transactions.");
        }
        budgetRepository.deleteById(id);
    }
}
