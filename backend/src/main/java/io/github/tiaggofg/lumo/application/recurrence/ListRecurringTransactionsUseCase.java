package io.github.tiaggofg.lumo.application.recurrence;

import io.github.tiaggofg.lumo.application.stereotype.Query;
import io.github.tiaggofg.lumo.domain.catalog.Beneficiary;
import io.github.tiaggofg.lumo.domain.catalog.BeneficiaryRepository;
import io.github.tiaggofg.lumo.domain.catalog.Category;
import io.github.tiaggofg.lumo.domain.catalog.CategoryRepository;
import io.github.tiaggofg.lumo.domain.recurrence.RecurrenceType;
import io.github.tiaggofg.lumo.domain.recurrence.RecurringTransactionRepository;
import io.github.tiaggofg.lumo.domain.transaction.TransactionType;
import jakarta.inject.Inject;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Query
public class ListRecurringTransactionsUseCase {

    private final RecurringTransactionRepository recurringRepository;
    private final CategoryRepository categoryRepository;
    private final BeneficiaryRepository beneficiaryRepository;

    @Inject
    public ListRecurringTransactionsUseCase(
            RecurringTransactionRepository recurringRepository,
            CategoryRepository categoryRepository,
            BeneficiaryRepository beneficiaryRepository
    ) {
        this.recurringRepository = recurringRepository;
        this.categoryRepository = categoryRepository;
        this.beneficiaryRepository = beneficiaryRepository;
    }

    public List<RecurringTransactionOutput> execute(Boolean active, TransactionType type, RecurrenceType recurrenceType) {
        Map<UUID, Category> categories = categoryRepository.findAll(null, null).stream()
                .collect(Collectors.toMap(Category::getId, Function.identity()));
        Map<UUID, Beneficiary> beneficiaries = beneficiaryRepository.findAll(null).stream()
                .collect(Collectors.toMap(Beneficiary::getId, Function.identity()));

        return recurringRepository.findAll(active, type, recurrenceType).stream()
                .map(rule -> RecurringTransactionOutput.from(
                        rule,
                        rule.getCategoryId() != null ? categories.get(rule.getCategoryId()) : null,
                        rule.getBeneficiaryId() != null ? beneficiaries.get(rule.getBeneficiaryId()) : null
                ))
                .toList();
    }
}
