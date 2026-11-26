package io.github.tiaggofg.lumo.application.transaction;

import io.github.tiaggofg.lumo.application.stereotype.Query;
import io.github.tiaggofg.lumo.domain.budget.MonthlyBudgetRepository;
import io.github.tiaggofg.lumo.domain.shared.ResourceNotFoundException;
import io.github.tiaggofg.lumo.domain.transaction.TransactionStatus;
import io.github.tiaggofg.lumo.domain.transaction.TransactionType;
import jakarta.inject.Inject;

import java.util.List;
import java.util.UUID;

@Query
public class ListBudgetTransactionsUseCase {

    private final MonthlyBudgetRepository budgetRepository;
    private final TransactionQueryPort transactionQueryPort;

    @Inject
    public ListBudgetTransactionsUseCase(
            MonthlyBudgetRepository budgetRepository,
            TransactionQueryPort transactionQueryPort
    ) {
        this.budgetRepository = budgetRepository;
        this.transactionQueryPort = transactionQueryPort;
    }

    public List<TransactionQueryPort.TransactionOutput> execute(
            UUID budgetId,
            TransactionType type,
            TransactionStatus status,
            UUID categoryId,
            UUID beneficiaryId,
            String search
    ) {
        if (budgetRepository.findById(budgetId).isEmpty()) {
            throw new ResourceNotFoundException("MonthlyBudget not found: " + budgetId);
        }
        return transactionQueryPort.findByBudgetWithFilters(budgetId, type, status, categoryId, beneficiaryId, search);
    }
}
