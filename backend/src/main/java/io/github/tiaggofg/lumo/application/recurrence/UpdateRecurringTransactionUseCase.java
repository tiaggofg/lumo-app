package io.github.tiaggofg.lumo.application.recurrence;

import io.github.tiaggofg.lumo.application.catalog.CatalogReferenceValidator;
import io.github.tiaggofg.lumo.application.stereotype.Command;
import io.github.tiaggofg.lumo.domain.budget.MonthlyBudget;
import io.github.tiaggofg.lumo.domain.budget.MonthlyBudgetRepository;
import io.github.tiaggofg.lumo.domain.catalog.Beneficiary;
import io.github.tiaggofg.lumo.domain.catalog.BeneficiaryRepository;
import io.github.tiaggofg.lumo.domain.catalog.Category;
import io.github.tiaggofg.lumo.domain.catalog.CategoryRepository;
import io.github.tiaggofg.lumo.domain.recurrence.RecurrenceAmountType;
import io.github.tiaggofg.lumo.domain.recurrence.RecurrenceType;
import io.github.tiaggofg.lumo.domain.recurrence.RecurringTransaction;
import io.github.tiaggofg.lumo.domain.recurrence.RecurringTransactionRepository;
import io.github.tiaggofg.lumo.domain.shared.CompetenceMonth;
import io.github.tiaggofg.lumo.domain.shared.Money;
import io.github.tiaggofg.lumo.domain.shared.ResourceNotFoundException;
import io.github.tiaggofg.lumo.domain.transaction.Transaction;
import io.github.tiaggofg.lumo.domain.transaction.TransactionRepository;
import io.github.tiaggofg.lumo.domain.transaction.TransactionType;
import jakarta.inject.Inject;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

@Command
public class UpdateRecurringTransactionUseCase {

    private final RecurringTransactionRepository recurringRepository;
    private final TransactionRepository transactionRepository;
    private final MonthlyBudgetRepository budgetRepository;
    private final CatalogReferenceValidator catalogValidator;
    private final CategoryRepository categoryRepository;
    private final BeneficiaryRepository beneficiaryRepository;
    private final Clock clock;

    @Inject
    public UpdateRecurringTransactionUseCase(
            RecurringTransactionRepository recurringRepository,
            TransactionRepository transactionRepository,
            MonthlyBudgetRepository budgetRepository,
            CatalogReferenceValidator catalogValidator,
            CategoryRepository categoryRepository,
            BeneficiaryRepository beneficiaryRepository,
            Clock clock
    ) {
        this.recurringRepository = recurringRepository;
        this.transactionRepository = transactionRepository;
        this.budgetRepository = budgetRepository;
        this.catalogValidator = catalogValidator;
        this.categoryRepository = categoryRepository;
        this.beneficiaryRepository = beneficiaryRepository;
        this.clock = clock;
    }

    public record Input(
            UUID id,
            TransactionType type,
            String description,
            BigDecimal amount,
            RecurrenceAmountType amountType,
            RecurrenceType recurrenceType,
            String startMonth,
            String endMonth,
            Integer totalInstallments,
            Integer startingInstallment,
            Integer dueDay,
            UUID categoryId,
            UUID beneficiaryId,
            String notes,
            boolean propagateToOpenTransactions
    ) {
    }

    public RecurringTransactionOutput.UpdateOutput execute(Input input) {
        RecurringTransaction rule = recurringRepository.findById(input.id())
                .orElseThrow(() -> new ResourceNotFoundException("RecurringTransaction not found: " + input.id()));

        catalogValidator.validateCategory(input.categoryId(), input.type(), rule.getCategoryId());
        catalogValidator.validateBeneficiary(input.beneficiaryId(), rule.getBeneficiaryId());

        Instant now = clock.instant();
        rule.updateDefinition(
                input.type(),
                input.description(),
                Money.positive(input.amount()),
                input.amountType(),
                input.recurrenceType(),
                CompetenceMonth.parse(input.startMonth()),
                input.endMonth() != null && !input.endMonth().isBlank() ? CompetenceMonth.parse(input.endMonth()) : null,
                input.totalInstallments(),
                input.startingInstallment(),
                input.dueDay(),
                input.categoryId(),
                input.beneficiaryId(),
                input.notes(),
                now
        );
        RecurringTransaction saved = recurringRepository.save(rule);

        int propagatedCount = 0;
        if (input.propagateToOpenTransactions()) {
            CompetenceMonth currentMonth = CompetenceMonth.of(YearMonth.now(clock));
            List<Transaction> openTransactions =
                    transactionRepository.findOpenBySourceRecurringIdAndCompetenceMonthGte(saved.getId(), currentMonth);
            for (Transaction txn : openTransactions) {
                LocalDate newDueDate = budgetRepository.findById(txn.getMonthlyBudgetId())
                        .map(MonthlyBudget::getCompetenceMonth)
                        .map(saved::resolveDueDateFor)
                        .orElse(null);
                txn.applyRecurrencePropagation(
                        saved.getDescription(),
                        saved.getAmount(),
                        newDueDate,
                        saved.getCategoryId(),
                        saved.getBeneficiaryId(),
                        saved.getNotes(),
                        now
                );
                transactionRepository.save(txn);
                propagatedCount++;
            }
        }

        Category category = saved.getCategoryId() != null
                ? categoryRepository.findById(saved.getCategoryId()).orElse(null) : null;
        Beneficiary beneficiary = saved.getBeneficiaryId() != null
                ? beneficiaryRepository.findById(saved.getBeneficiaryId()).orElse(null) : null;

        return new RecurringTransactionOutput.UpdateOutput(
                RecurringTransactionOutput.from(saved, category, beneficiary),
                propagatedCount
        );
    }
}
