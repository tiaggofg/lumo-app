package io.github.tiaggofg.lumo.infrastructure.persistence.budget;

import io.github.tiaggofg.lumo.application.budget.BudgetReadModelPort;
import io.github.tiaggofg.lumo.domain.budget.MonthlyBudget;
import io.github.tiaggofg.lumo.domain.budget.MonthlyBudgetRepository;
import io.github.tiaggofg.lumo.domain.shared.CompetenceMonth;
import io.github.tiaggofg.lumo.domain.shared.Money;
import io.github.tiaggofg.lumo.domain.transaction.Transaction;
import io.github.tiaggofg.lumo.domain.transaction.TransactionRepository;
import io.github.tiaggofg.lumo.domain.transaction.TransactionStatus;
import io.github.tiaggofg.lumo.domain.transaction.TransactionType;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@QuarkusTest
class BudgetReadModelIT {

    private static final UUID CAT_MORADIA = UUID.fromString("10000000-0000-0000-0000-000000000001");
    private static final UUID CAT_CONTAS = UUID.fromString("10000000-0000-0000-0000-000000000002");
    private static final UUID CAT_CARTAO = UUID.fromString("10000000-0000-0000-0000-000000000003");
    private static final UUID CAT_SAUDE = UUID.fromString("10000000-0000-0000-0000-000000000004");
    private static final UUID CAT_SALARIO = UUID.fromString("10000000-0000-0000-0000-000000000010");
    private static final UUID BEN_FAMILIA = UUID.fromString("20000000-0000-0000-0000-000000000001");

    @Inject
    EntityManager entityManager;

    @Inject
    MonthlyBudgetRepository budgetRepository;

    @Inject
    TransactionRepository transactionRepository;

    @Inject
    BudgetReadModelPort readModelPort;

    @BeforeEach
    @Transactional
    void cleanDb() {
        entityManager.createNativeQuery("DELETE FROM recurring_occurrence_exclusions").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM transactions").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM recurring_transactions").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM monthly_budgets").executeUpdate();
    }

    @Test
    void shouldReturnZeroTotalsAndEmptyBreakdownsForEmptyBudget() {
        MonthlyBudget budget = createBudget("2026-10");

        var detail = readModelPort.findDetailById(budget.getId()).orElseThrow();
        assertThat(detail.summary().plannedIncome()).isEqualByComparingTo("0.00");
        assertThat(detail.summary().realizedIncome()).isEqualByComparingTo("0.00");
        assertThat(detail.summary().plannedExpense()).isEqualByComparingTo("0.00");
        assertThat(detail.summary().realizedExpense()).isEqualByComparingTo("0.00");
        assertThat(detail.summary().plannedBalance()).isEqualByComparingTo("0.00");
        assertThat(detail.summary().realizedBalance()).isEqualByComparingTo("0.00");
        assertThat(detail.expensesByCategory()).isEmpty();
        assertThat(detail.expensesByBeneficiary()).isEmpty();
    }

    @Test
    void shouldMatchExactSpreadsheetMathFor13ExpensesAnd1Income() {
        MonthlyBudget budget = createBudget("2026-11");

        // Income: Salário R$ 6.362,29 (SETTLED)
        saveTxn(budget.getId(), TransactionType.INCOME, "Salário", "6362.29", TransactionStatus.SETTLED, CAT_SALARIO, BEN_FAMILIA);

        // 13 Expenses totaling R$ 6.178,42 (mix of SETTLED, PENDING, ESTIMATED and uncategorized)
        saveTxn(budget.getId(), TransactionType.EXPENSE, "Aluguel", "800.00", TransactionStatus.SETTLED, CAT_MORADIA, BEN_FAMILIA);
        saveTxn(budget.getId(), TransactionType.EXPENSE, "Água", "180.00", TransactionStatus.ESTIMATED, CAT_CONTAS, BEN_FAMILIA);
        saveTxn(budget.getId(), TransactionType.EXPENSE, "Energia", "220.00", TransactionStatus.PENDING, CAT_CONTAS, BEN_FAMILIA);
        saveTxn(budget.getId(), TransactionType.EXPENSE, "Internet", "110.00", TransactionStatus.SETTLED, CAT_CONTAS, BEN_FAMILIA);
        saveTxn(budget.getId(), TransactionType.EXPENSE, "Dentista - Tiago", "150.00", TransactionStatus.SETTLED, CAT_SAUDE, BEN_FAMILIA);
        saveTxn(budget.getId(), TransactionType.EXPENSE, "Dentista - Jéssica", "150.00", TransactionStatus.PENDING, CAT_SAUDE, null);
        saveTxn(budget.getId(), TransactionType.EXPENSE, "Cartão Nubank", "1850.00", TransactionStatus.SETTLED, CAT_CARTAO, BEN_FAMILIA);
        saveTxn(budget.getId(), TransactionType.EXPENSE, "Cartão Inter", "920.50", TransactionStatus.SETTLED, CAT_CARTAO, BEN_FAMILIA);
        saveTxn(budget.getId(), TransactionType.EXPENSE, "Cartão Sogra", "58.66", TransactionStatus.SETTLED, CAT_CARTAO, BEN_FAMILIA);
        saveTxn(budget.getId(), TransactionType.EXPENSE, "Supermercado", "950.00", TransactionStatus.SETTLED, null, BEN_FAMILIA);
        saveTxn(budget.getId(), TransactionType.EXPENSE, "Farmácia", "189.26", TransactionStatus.SETTLED, CAT_SAUDE, BEN_FAMILIA);
        saveTxn(budget.getId(), TransactionType.EXPENSE, "Combustível", "400.00", TransactionStatus.SETTLED, null, null);
        saveTxn(budget.getId(), TransactionType.EXPENSE, "Streaming", "200.00", TransactionStatus.SETTLED, null, BEN_FAMILIA);

        var detail = readModelPort.findDetailById(budget.getId()).orElseThrow();

        // Planned: 6362.29 - 6178.42 = 183.87
        assertThat(detail.summary().plannedIncome()).isEqualByComparingTo("6362.29");
        assertThat(detail.summary().realizedIncome()).isEqualByComparingTo("6362.29");
        assertThat(detail.summary().plannedExpense()).isEqualByComparingTo("6178.42");
        // Realized expense excludes Água (180.00), Energia (220.00), Dentista - Jéssica (150.00) = 550.00
        assertThat(detail.summary().realizedExpense()).isEqualByComparingTo("5628.42");
        assertThat(detail.summary().plannedBalance()).isEqualByComparingTo("183.87");
        assertThat(detail.summary().realizedBalance()).isEqualByComparingTo("733.87");

        assertThat(detail.statusCounts().estimated()).isEqualTo(1L);
        assertThat(detail.statusCounts().pending()).isEqualTo(2L);
        assertThat(detail.statusCounts().settled()).isEqualTo(11L);

        assertThat(detail.expensesByCategory())
                .extracting(BudgetReadModelPort.BreakdownItemOutput::name)
                .contains("Cartão de Crédito", "Sem categoria", "Moradia", "Contas Básicas", "Saúde");
        assertThat(detail.expensesByBeneficiary())
                .extracting(BudgetReadModelPort.BreakdownItemOutput::name)
                .contains("Família", "Sem beneficiário");
    }

    @Transactional
    MonthlyBudget createBudget(String competence) {
        return budgetRepository.save(MonthlyBudget.create(CompetenceMonth.parse(competence), Instant.now()));
    }

    @Transactional
    void saveTxn(
            UUID budgetId,
            TransactionType type,
            String desc,
            String amount,
            TransactionStatus status,
            UUID catId,
            UUID benId
    ) {
        transactionRepository.save(Transaction.createManual(
                budgetId, type, desc, Money.positive(new BigDecimal(amount)), status,
                null, status == TransactionStatus.SETTLED ? LocalDate.of(2026, 11, 10) : null,
                null, catId, benId, LocalDate.of(2026, 11, 10), Instant.now()
        ));
    }
}
