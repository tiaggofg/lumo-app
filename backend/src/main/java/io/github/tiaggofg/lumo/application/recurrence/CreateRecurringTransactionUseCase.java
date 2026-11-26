package io.github.tiaggofg.lumo.application.recurrence;

import io.github.tiaggofg.lumo.application.catalog.CatalogReferenceValidator;
import io.github.tiaggofg.lumo.application.stereotype.Command;
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
import io.github.tiaggofg.lumo.domain.transaction.TransactionType;
import jakarta.inject.Inject;

import java.math.BigDecimal;
import java.time.Clock;
import java.util.List;
import java.util.UUID;

@Command
public class CreateRecurringTransactionUseCase {

    private final RecurringTransactionRepository recurringRepository;
    private final RecurringMaterializationService materializationService;
    private final CatalogReferenceValidator catalogValidator;
    private final CategoryRepository categoryRepository;
    private final BeneficiaryRepository beneficiaryRepository;
    private final Clock clock;

    @Inject
    public CreateRecurringTransactionUseCase(
            RecurringTransactionRepository recurringRepository,
            RecurringMaterializationService materializationService,
            CatalogReferenceValidator catalogValidator,
            CategoryRepository categoryRepository,
            BeneficiaryRepository beneficiaryRepository,
            Clock clock
    ) {
        this.recurringRepository = recurringRepository;
        this.materializationService = materializationService;
        this.catalogValidator = catalogValidator;
        this.categoryRepository = categoryRepository;
        this.beneficiaryRepository = beneficiaryRepository;
        this.clock = clock;
    }

    public record Input(
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
            String notes
    ) {
    }

    public RecurringTransactionOutput.CreateOutput execute(Input input) {
        catalogValidator.validateCategory(input.categoryId(), input.type(), null);
        catalogValidator.validateBeneficiary(input.beneficiaryId(), null);

        RecurringTransaction rule = RecurringTransaction.create(
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
                clock.instant()
        );

        RecurringTransaction saved = recurringRepository.save(rule);
        List<UUID> materializedBudgetIds = materializationService.materializeRuleForCurrentAndFutureBudgets(saved);

        Category category = saved.getCategoryId() != null
                ? categoryRepository.findById(saved.getCategoryId()).orElse(null) : null;
        Beneficiary beneficiary = saved.getBeneficiaryId() != null
                ? beneficiaryRepository.findById(saved.getBeneficiaryId()).orElse(null) : null;

        return new RecurringTransactionOutput.CreateOutput(
                RecurringTransactionOutput.from(saved, category, beneficiary),
                materializedBudgetIds
        );
    }
}
