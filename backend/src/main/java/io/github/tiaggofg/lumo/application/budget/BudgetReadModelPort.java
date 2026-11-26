package io.github.tiaggofg.lumo.application.budget;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BudgetReadModelPort {

    List<MonthlyBudgetListItemOutput> findAllSummariesOrderedByCompetenceDesc();

    Optional<MonthlyBudgetDetailOutput> findDetailById(UUID budgetId);

    record BudgetSummaryOutput(
            BigDecimal plannedIncome,
            BigDecimal realizedIncome,
            BigDecimal plannedExpense,
            BigDecimal realizedExpense,
            BigDecimal plannedBalance,
            BigDecimal realizedBalance
    ) {
        public static BudgetSummaryOutput of(
                BigDecimal plannedIncome,
                BigDecimal realizedIncome,
                BigDecimal plannedExpense,
                BigDecimal realizedExpense
        ) {
            BigDecimal pi = scale(plannedIncome);
            BigDecimal ri = scale(realizedIncome);
            BigDecimal pe = scale(plannedExpense);
            BigDecimal re = scale(realizedExpense);
            return new BudgetSummaryOutput(pi, ri, pe, re, pi.subtract(pe), ri.subtract(re));
        }

        public static BudgetSummaryOutput zero() {
            return of(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
        }

        private static BigDecimal scale(BigDecimal value) {
            return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
        }
    }

    record StatusCountsOutput(long estimated, long pending, long settled) {
    }

    record BreakdownItemOutput(
            UUID id,
            String name,
            String color,
            BigDecimal plannedAmount,
            BigDecimal realizedAmount,
            long count
    ) {
    }

    record MonthlyBudgetListItemOutput(
            UUID id,
            String competenceMonth,
            BudgetSummaryOutput summary,
            long transactionCount,
            Instant createdAt,
            Instant updatedAt
    ) {
    }

    record MonthlyBudgetDetailOutput(
            UUID id,
            String competenceMonth,
            BudgetSummaryOutput summary,
            StatusCountsOutput statusCounts,
            List<BreakdownItemOutput> expensesByCategory,
            List<BreakdownItemOutput> expensesByBeneficiary,
            Instant createdAt,
            Instant updatedAt
    ) {
    }

    record CreateMonthlyBudgetOutput(
            UUID id,
            String competenceMonth,
            int materializedCount,
            BudgetSummaryOutput summary,
            Instant createdAt,
            Instant updatedAt
    ) {
    }
}
