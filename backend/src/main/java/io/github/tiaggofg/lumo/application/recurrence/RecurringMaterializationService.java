package io.github.tiaggofg.lumo.application.recurrence;

import io.github.tiaggofg.lumo.domain.budget.MonthlyBudget;
import io.github.tiaggofg.lumo.domain.budget.MonthlyBudgetRepository;
import io.github.tiaggofg.lumo.domain.recurrence.RecurringTransaction;
import io.github.tiaggofg.lumo.domain.recurrence.RecurringTransactionRepository;
import io.github.tiaggofg.lumo.domain.shared.CompetenceMonth;
import io.github.tiaggofg.lumo.domain.transaction.Transaction;
import io.github.tiaggofg.lumo.domain.transaction.TransactionRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.Clock;
import java.time.Instant;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class RecurringMaterializationService {

    private final RecurringTransactionRepository recurringRepository;
    private final MonthlyBudgetRepository budgetRepository;
    private final TransactionRepository transactionRepository;
    private final RecurringOccurrenceExclusionPort exclusionPort;
    private final Clock clock;

    @Inject
    public RecurringMaterializationService(
            RecurringTransactionRepository recurringRepository,
            MonthlyBudgetRepository budgetRepository,
            TransactionRepository transactionRepository,
            RecurringOccurrenceExclusionPort exclusionPort,
            Clock clock
    ) {
        this.recurringRepository = recurringRepository;
        this.budgetRepository = budgetRepository;
        this.transactionRepository = transactionRepository;
        this.exclusionPort = exclusionPort;
        this.clock = clock;
    }

    public int materializeAllEligibleForBudget(MonthlyBudget budget) {
        Instant now = clock.instant();
        List<RecurringTransaction> activeRules = recurringRepository.findAllActive();
        int materializedCount = 0;

        for (RecurringTransaction rule : activeRules) {
            if (tryMaterialize(rule, budget, now)) {
                materializedCount++;
            }
        }
        return materializedCount;
    }

    public List<UUID> materializeRuleForCurrentAndFutureBudgets(RecurringTransaction rule) {
        if (!rule.isActive()) {
            return List.of();
        }
        Instant now = clock.instant();
        CompetenceMonth currentMonth = CompetenceMonth.of(YearMonth.now(clock));
        List<MonthlyBudget> eligibleBudgets = budgetRepository.findByCompetenceMonthGreaterThanEqual(currentMonth);
        List<UUID> materializedBudgetIds = new ArrayList<>();

        for (MonthlyBudget budget : eligibleBudgets) {
            if (tryMaterialize(rule, budget, now)) {
                materializedBudgetIds.add(budget.getId());
            }
        }
        return materializedBudgetIds;
    }

    private boolean tryMaterialize(RecurringTransaction rule, MonthlyBudget budget, Instant now) {
        if (!rule.isEligibleFor(budget.getCompetenceMonth())) {
            return false;
        }
        if (exclusionPort.isExcluded(budget.getId(), rule.getId())) {
            return false;
        }
        if (transactionRepository.existsByMonthlyBudgetIdAndSourceRecurringTransactionId(budget.getId(), rule.getId())) {
            return false;
        }

        Transaction txn = rule.materializeFor(budget.getId(), budget.getCompetenceMonth(), now);
        transactionRepository.save(txn);
        if (!rule.hasGeneratedTransactions()) {
            rule.markAsGenerated(now);
            recurringRepository.save(rule);
        }
        return true;
    }
}
