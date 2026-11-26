package io.github.tiaggofg.lumo.domain.transaction;

import io.github.tiaggofg.lumo.domain.shared.CompetenceMonth;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TransactionRepository {

    Transaction save(Transaction transaction);

    Optional<Transaction> findById(UUID id);

    boolean existsByMonthlyBudgetId(UUID monthlyBudgetId);

    boolean existsByMonthlyBudgetIdAndSourceRecurringTransactionId(UUID monthlyBudgetId, UUID recurringTransactionId);

    List<Transaction> findOpenBySourceRecurringIdAndCompetenceMonthGte(UUID recurringTransactionId, CompetenceMonth fromMonth);

    void deleteById(UUID id);

    int deleteOpenBySourceRecurringIdAndCompetenceMonthGte(UUID recurringTransactionId, CompetenceMonth fromMonth);
}
