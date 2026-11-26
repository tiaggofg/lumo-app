package io.github.tiaggofg.lumo.application.recurrence;

import io.github.tiaggofg.lumo.application.catalog.CatalogReferenceValidator;
import io.github.tiaggofg.lumo.application.transaction.ConfirmEstimateUseCase;
import io.github.tiaggofg.lumo.application.transaction.DeleteTransactionUseCase;
import io.github.tiaggofg.lumo.application.transaction.TransactionQueryPort;
import io.github.tiaggofg.lumo.domain.budget.MonthlyBudget;
import io.github.tiaggofg.lumo.domain.budget.MonthlyBudgetRepository;
import io.github.tiaggofg.lumo.domain.catalog.BeneficiaryRepository;
import io.github.tiaggofg.lumo.domain.catalog.CategoryRepository;
import io.github.tiaggofg.lumo.domain.recurrence.RecurrenceAmountType;
import io.github.tiaggofg.lumo.domain.recurrence.RecurrenceType;
import io.github.tiaggofg.lumo.domain.recurrence.RecurringTransaction;
import io.github.tiaggofg.lumo.domain.recurrence.RecurringTransactionRepository;
import io.github.tiaggofg.lumo.domain.shared.CompetenceMonth;
import io.github.tiaggofg.lumo.domain.shared.Money;
import io.github.tiaggofg.lumo.domain.shared.ResourceConflictException;
import io.github.tiaggofg.lumo.domain.transaction.Transaction;
import io.github.tiaggofg.lumo.domain.transaction.TransactionRepository;
import io.github.tiaggofg.lumo.domain.transaction.TransactionStatus;
import io.github.tiaggofg.lumo.domain.transaction.TransactionType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RecurringUseCasesTest {

    private static final Clock FIXED_CLOCK = Clock.fixed(Instant.parse("2026-11-15T12:00:00Z"), ZoneOffset.UTC);

    private RecurringTransactionRepository recurringRepository;
    private MonthlyBudgetRepository budgetRepository;
    private TransactionRepository transactionRepository;
    private RecurringOccurrenceExclusionPort exclusionPort;
    private CategoryRepository categoryRepository;
    private BeneficiaryRepository beneficiaryRepository;
    private CatalogReferenceValidator catalogValidator;
    private RecurringMaterializationService materializationService;

    @BeforeEach
    void setUp() {
        recurringRepository = mock(RecurringTransactionRepository.class);
        budgetRepository = mock(MonthlyBudgetRepository.class);
        transactionRepository = mock(TransactionRepository.class);
        exclusionPort = mock(RecurringOccurrenceExclusionPort.class);
        categoryRepository = mock(CategoryRepository.class);
        beneficiaryRepository = mock(BeneficiaryRepository.class);
        catalogValidator = new CatalogReferenceValidator(categoryRepository, beneficiaryRepository);
        materializationService = new RecurringMaterializationService(
                recurringRepository, budgetRepository, transactionRepository, exclusionPort, FIXED_CLOCK);

        when(recurringRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(transactionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void materializeAllEligibleForBudgetShouldSkipExcludedAndDuplicates() {
        MonthlyBudget budget = MonthlyBudget.create(CompetenceMonth.parse("2026-11"), FIXED_CLOCK.instant());
        RecurringTransaction eligible = RecurringTransaction.create(
                TransactionType.EXPENSE, "Aluguel", Money.positive(new BigDecimal("800.00")),
                RecurrenceAmountType.FIXED, RecurrenceType.INDEFINITE,
                CompetenceMonth.parse("2026-10"), null, null, null, 5, null, null, null, FIXED_CLOCK.instant());
        RecurringTransaction excluded = RecurringTransaction.create(
                TransactionType.EXPENSE, "Internet", Money.positive(new BigDecimal("100.00")),
                RecurrenceAmountType.FIXED, RecurrenceType.INDEFINITE,
                CompetenceMonth.parse("2026-10"), null, null, null, 10, null, null, null, FIXED_CLOCK.instant());

        when(recurringRepository.findAllActive()).thenReturn(List.of(eligible, excluded));
        when(exclusionPort.isExcluded(budget.getId(), excluded.getId())).thenReturn(true);

        int count = materializationService.materializeAllEligibleForBudget(budget);

        assertThat(count).isEqualTo(1);
        assertThat(eligible.hasGeneratedTransactions()).isTrue();
        assertThat(excluded.hasGeneratedTransactions()).isFalse();
    }

    @Test
    void createRecurrenceWithPastStartMonthShouldOnlyQueryCurrentAndFutureBudgets() {
        MonthlyBudget currentBudget = MonthlyBudget.create(CompetenceMonth.parse("2026-11"), FIXED_CLOCK.instant());
        when(budgetRepository.findByCompetenceMonthGreaterThanEqual(CompetenceMonth.parse("2026-11")))
                .thenReturn(List.of(currentBudget));

        CreateRecurringTransactionUseCase useCase = new CreateRecurringTransactionUseCase(
                recurringRepository, materializationService, catalogValidator, categoryRepository, beneficiaryRepository, FIXED_CLOCK);

        var output = useCase.execute(new CreateRecurringTransactionUseCase.Input(
                TransactionType.EXPENSE, "Aluguel", new BigDecimal("800.00"),
                RecurrenceAmountType.FIXED, RecurrenceType.INDEFINITE,
                "2026-08", null, null, null, 5, null, null, null));

        assertThat(output.materializedBudgetIds()).containsExactly(currentBudget.getId());
        verify(budgetRepository).findByCompetenceMonthGreaterThanEqual(CompetenceMonth.parse("2026-11"));
    }

    @Test
    void updateRecurrenceWithoutPropagationShouldNotTouchTransactions() {
        RecurringTransaction rule = RecurringTransaction.create(
                TransactionType.EXPENSE, "Aluguel", Money.positive(new BigDecimal("800.00")),
                RecurrenceAmountType.FIXED, RecurrenceType.INDEFINITE,
                CompetenceMonth.parse("2026-10"), null, null, null, 5, null, null, null, FIXED_CLOCK.instant());
        when(recurringRepository.findById(rule.getId())).thenReturn(Optional.of(rule));

        UpdateRecurringTransactionUseCase useCase = new UpdateRecurringTransactionUseCase(
                recurringRepository, transactionRepository, budgetRepository,
                catalogValidator, categoryRepository, beneficiaryRepository, FIXED_CLOCK);

        var output = useCase.execute(new UpdateRecurringTransactionUseCase.Input(
                rule.getId(), TransactionType.EXPENSE, "Aluguel Novo", new BigDecimal("850.00"),
                RecurrenceAmountType.FIXED, RecurrenceType.INDEFINITE,
                "2026-10", null, null, null, 10, null, null, null, false));

        assertThat(output.propagatedCount()).isZero();
        verify(transactionRepository, never()).findOpenBySourceRecurringIdAndCompetenceMonthGte(any(), any());
    }

    @Test
    void updateRecurrenceWithPropagationShouldUpdateOpenCurrentAndFutureTransactions() {
        MonthlyBudget budget = MonthlyBudget.create(CompetenceMonth.parse("2026-11"), FIXED_CLOCK.instant());
        RecurringTransaction rule = RecurringTransaction.create(
                TransactionType.EXPENSE, "Aluguel", Money.positive(new BigDecimal("800.00")),
                RecurrenceAmountType.FIXED, RecurrenceType.INDEFINITE,
                CompetenceMonth.parse("2026-10"), null, null, null, 5, null, null, null, FIXED_CLOCK.instant());
        Transaction openTxn = rule.materializeFor(budget.getId(), budget.getCompetenceMonth(), FIXED_CLOCK.instant());

        when(recurringRepository.findById(rule.getId())).thenReturn(Optional.of(rule));
        when(transactionRepository.findOpenBySourceRecurringIdAndCompetenceMonthGte(rule.getId(), CompetenceMonth.parse("2026-11")))
                .thenReturn(List.of(openTxn));
        when(budgetRepository.findById(budget.getId())).thenReturn(Optional.of(budget));

        UpdateRecurringTransactionUseCase useCase = new UpdateRecurringTransactionUseCase(
                recurringRepository, transactionRepository, budgetRepository,
                catalogValidator, categoryRepository, beneficiaryRepository, FIXED_CLOCK);

        var output = useCase.execute(new UpdateRecurringTransactionUseCase.Input(
                rule.getId(), TransactionType.EXPENSE, "Aluguel Reajustado", new BigDecimal("900.00"),
                RecurrenceAmountType.FIXED, RecurrenceType.INDEFINITE,
                "2026-10", null, null, null, 10, null, null, "Reajuste anual", true));

        assertThat(output.propagatedCount()).isEqualTo(1);
        assertThat(openTxn.getDescription()).isEqualTo("Aluguel Reajustado");
        assertThat(openTxn.getAmount().amount()).isEqualByComparingTo("900.00");
        assertThat(openTxn.getDueDate()).isEqualTo(LocalDate.of(2026, 11, 10));
    }

    @Test
    void deactivateWithRemoveFutureOpenShouldDeleteOpenTransactionsFromCurrentMonth() {
        RecurringTransaction rule = RecurringTransaction.create(
                TransactionType.EXPENSE, "Academia", Money.positive(new BigDecimal("120.00")),
                RecurrenceAmountType.FIXED, RecurrenceType.INDEFINITE,
                CompetenceMonth.parse("2026-10"), null, null, null, 5, null, null, null, FIXED_CLOCK.instant());
        when(recurringRepository.findById(rule.getId())).thenReturn(Optional.of(rule));
        when(transactionRepository.deleteOpenBySourceRecurringIdAndCompetenceMonthGte(rule.getId(), CompetenceMonth.parse("2026-11")))
                .thenReturn(2);

        DeactivateRecurringTransactionUseCase useCase = new DeactivateRecurringTransactionUseCase(
                recurringRepository, transactionRepository, categoryRepository, beneficiaryRepository, FIXED_CLOCK);

        var output = useCase.execute(rule.getId(), true);

        assertThat(output.recurrence().active()).isFalse();
        assertThat(output.removedTransactionsCount()).isEqualTo(2);
    }

    @Test
    void deleteRecurrenceShouldRejectWhenHasGeneratedTransactions() {
        RecurringTransaction rule = RecurringTransaction.create(
                TransactionType.EXPENSE, "Aluguel", Money.positive(new BigDecimal("800.00")),
                RecurrenceAmountType.FIXED, RecurrenceType.INDEFINITE,
                CompetenceMonth.parse("2026-10"), null, null, null, 5, null, null, null, FIXED_CLOCK.instant());
        rule.markAsGenerated(FIXED_CLOCK.instant());
        when(recurringRepository.findById(rule.getId())).thenReturn(Optional.of(rule));

        DeleteRecurringTransactionUseCase useCase = new DeleteRecurringTransactionUseCase(recurringRepository);

        assertThatThrownBy(() -> useCase.execute(rule.getId()))
                .isInstanceOf(ResourceConflictException.class);
    }

    @Test
    void deleteMaterializedTransactionShouldRecordExclusion() {
        UUID budgetId = UUID.randomUUID();
        UUID recurringId = UUID.randomUUID();
        Transaction txn = Transaction.createMaterialized(
                budgetId, TransactionType.EXPENSE, "Aluguel",
                Money.positive(new BigDecimal("800.00")), TransactionStatus.PENDING,
                null, null, null, null, recurringId, null, FIXED_CLOCK.instant());
        when(transactionRepository.findById(txn.getId())).thenReturn(Optional.of(txn));

        DeleteTransactionUseCase useCase = new DeleteTransactionUseCase(transactionRepository, exclusionPort, FIXED_CLOCK);
        useCase.execute(txn.getId());

        verify(exclusionPort).recordExclusion(budgetId, recurringId, FIXED_CLOCK.instant());
        verify(transactionRepository).deleteById(txn.getId());
    }

    @Test
    void confirmEstimateWithUpdateTemplateShouldUpdateRecurringDefaultAmount() {
        UUID budgetId = UUID.randomUUID();
        RecurringTransaction rule = RecurringTransaction.create(
                TransactionType.EXPENSE, "Água", Money.positive(new BigDecimal("180.00")),
                RecurrenceAmountType.ESTIMATED, RecurrenceType.INDEFINITE,
                CompetenceMonth.parse("2026-11"), null, null, null, 20, null, null, null, FIXED_CLOCK.instant());
        Transaction txn = rule.materializeFor(budgetId, CompetenceMonth.parse("2026-11"), FIXED_CLOCK.instant());

        TransactionQueryPort queryPort = mock(TransactionQueryPort.class);
        when(transactionRepository.findById(txn.getId())).thenReturn(Optional.of(txn));
        when(recurringRepository.findById(rule.getId())).thenReturn(Optional.of(rule));
        when(queryPort.findOutputById(txn.getId())).thenReturn(Optional.of(new TransactionQueryPort.TransactionOutput(
                txn.getId(), budgetId, TransactionType.EXPENSE, "Água", new BigDecimal("195.64"),
                TransactionStatus.PENDING, txn.getDueDate(), null, null, null, null, null, null, null,
                rule.getId(), null, null, txn.getCreatedAt(), txn.getUpdatedAt())));

        ConfirmEstimateUseCase useCase = new ConfirmEstimateUseCase(
                transactionRepository, queryPort, recurringRepository, FIXED_CLOCK);

        var output = useCase.execute(new ConfirmEstimateUseCase.Input(
                txn.getId(), new BigDecimal("195.64"), TransactionStatus.PENDING, null, true));

        assertThat(output.amount()).isEqualByComparingTo("195.64");
        assertThat(rule.getAmount().amount()).isEqualByComparingTo("195.64");
        verify(recurringRepository).save(eq(rule));
    }
}
