package io.github.tiaggofg.lumo.application.recurrence;

import io.github.tiaggofg.lumo.application.stereotype.Command;
import io.github.tiaggofg.lumo.domain.catalog.Beneficiary;
import io.github.tiaggofg.lumo.domain.catalog.BeneficiaryRepository;
import io.github.tiaggofg.lumo.domain.catalog.Category;
import io.github.tiaggofg.lumo.domain.catalog.CategoryRepository;
import io.github.tiaggofg.lumo.domain.recurrence.RecurringTransaction;
import io.github.tiaggofg.lumo.domain.recurrence.RecurringTransactionRepository;
import io.github.tiaggofg.lumo.domain.shared.ResourceNotFoundException;
import jakarta.inject.Inject;

import java.time.Clock;
import java.util.UUID;

@Command
public class ActivateRecurringTransactionUseCase {

    private final RecurringTransactionRepository recurringRepository;
    private final CategoryRepository categoryRepository;
    private final BeneficiaryRepository beneficiaryRepository;
    private final Clock clock;

    @Inject
    public ActivateRecurringTransactionUseCase(
            RecurringTransactionRepository recurringRepository,
            CategoryRepository categoryRepository,
            BeneficiaryRepository beneficiaryRepository,
            Clock clock
    ) {
        this.recurringRepository = recurringRepository;
        this.categoryRepository = categoryRepository;
        this.beneficiaryRepository = beneficiaryRepository;
        this.clock = clock;
    }

    public RecurringTransactionOutput execute(UUID id) {
        RecurringTransaction rule = recurringRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RecurringTransaction not found: " + id));

        rule.activate(clock.instant());
        RecurringTransaction saved = recurringRepository.save(rule);

        Category category = saved.getCategoryId() != null
                ? categoryRepository.findById(saved.getCategoryId()).orElse(null) : null;
        Beneficiary beneficiary = saved.getBeneficiaryId() != null
                ? beneficiaryRepository.findById(saved.getBeneficiaryId()).orElse(null) : null;

        return RecurringTransactionOutput.from(saved, category, beneficiary);
    }
}
