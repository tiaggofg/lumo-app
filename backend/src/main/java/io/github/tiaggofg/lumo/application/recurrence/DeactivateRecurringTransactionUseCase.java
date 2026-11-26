package io.github.tiaggofg.lumo.application.recurrence;

import io.github.tiaggofg.lumo.application.stereotype.Command;
import io.github.tiaggofg.lumo.domain.catalog.Beneficiary;
import io.github.tiaggofg.lumo.domain.catalog.BeneficiaryRepository;
import io.github.tiaggofg.lumo.domain.catalog.Category;
import io.github.tiaggofg.lumo.domain.catalog.CategoryRepository;
import io.github.tiaggofg.lumo.domain.recurrence.RecurringTransaction;
import io.github.tiaggofg.lumo.domain.recurrence.RecurringTransactionRepository;
import io.github.tiaggofg.lumo.domain.shared.CompetenceMonth;
import io.github.tiaggofg.lumo.domain.shared.ResourceNotFoundException;
import io.github.tiaggofg.lumo.domain.transaction.TransactionRepository;
import jakarta.inject.Inject;

import java.time.Clock;
import java.time.YearMonth;
import java.util.UUID;

@Command
public class DeactivateRecurringTransactionUseCase {

    private final RecurringTransactionRepository recurringRepository;
    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final BeneficiaryRepository beneficiaryRepository;
    private final Clock clock;

    @Inject
    public DeactivateRecurringTransactionUseCase(
            RecurringTransactionRepository recurringRepository,
            TransactionRepository transactionRepository,
            CategoryRepository categoryRepository,
            BeneficiaryRepository beneficiaryRepository,
            Clock clock
    ) {
        this.recurringRepository = recurringRepository;
        this.transactionRepository = transactionRepository;
        this.categoryRepository = categoryRepository;
        this.beneficiaryRepository = beneficiaryRepository;
        this.clock = clock;
    }

    public RecurringTransactionOutput.DeactivateOutput execute(UUID id, boolean removeFutureOpenTransactions) {
        RecurringTransaction rule = recurringRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RecurringTransaction not found: " + id));

        rule.deactivate(clock.instant());
        RecurringTransaction saved = recurringRepository.save(rule);

        int removedCount = 0;
        if (removeFutureOpenTransactions) {
            CompetenceMonth currentMonth = CompetenceMonth.of(YearMonth.now(clock));
            removedCount = transactionRepository.deleteOpenBySourceRecurringIdAndCompetenceMonthGte(id, currentMonth);
        }

        Category category = saved.getCategoryId() != null
                ? categoryRepository.findById(saved.getCategoryId()).orElse(null) : null;
        Beneficiary beneficiary = saved.getBeneficiaryId() != null
                ? beneficiaryRepository.findById(saved.getBeneficiaryId()).orElse(null) : null;

        return new RecurringTransactionOutput.DeactivateOutput(
                RecurringTransactionOutput.from(saved, category, beneficiary),
                removedCount
        );
    }
}
