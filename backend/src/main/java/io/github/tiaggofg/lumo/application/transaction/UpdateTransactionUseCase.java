package io.github.tiaggofg.lumo.application.transaction;

import io.github.tiaggofg.lumo.application.catalog.CatalogReferenceValidator;
import io.github.tiaggofg.lumo.application.stereotype.Command;
import io.github.tiaggofg.lumo.domain.shared.Money;
import io.github.tiaggofg.lumo.domain.shared.ResourceNotFoundException;
import io.github.tiaggofg.lumo.domain.transaction.Transaction;
import io.github.tiaggofg.lumo.domain.transaction.TransactionRepository;
import io.github.tiaggofg.lumo.domain.transaction.TransactionStatus;
import io.github.tiaggofg.lumo.domain.transaction.TransactionType;
import jakarta.inject.Inject;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.UUID;

@Command
public class UpdateTransactionUseCase {

    private final TransactionRepository transactionRepository;
    private final TransactionQueryPort transactionQueryPort;
    private final CatalogReferenceValidator catalogValidator;
    private final Clock clock;

    @Inject
    public UpdateTransactionUseCase(
            TransactionRepository transactionRepository,
            TransactionQueryPort transactionQueryPort,
            CatalogReferenceValidator catalogValidator,
            Clock clock
    ) {
        this.transactionRepository = transactionRepository;
        this.transactionQueryPort = transactionQueryPort;
        this.catalogValidator = catalogValidator;
        this.clock = clock;
    }

    public record Input(
            UUID id,
            UUID monthlyBudgetId,
            TransactionType type,
            String description,
            BigDecimal amount,
            TransactionStatus status,
            LocalDate dueDate,
            LocalDate paymentDate,
            String notes,
            UUID categoryId,
            UUID beneficiaryId
    ) {
    }

    public TransactionQueryPort.TransactionOutput execute(Input input) {
        Transaction transaction = transactionRepository.findById(input.id())
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + input.id()));

        transaction.ensureBelongsToBudget(input.monthlyBudgetId());
        catalogValidator.validateCategory(input.categoryId(), input.type(), transaction.getCategoryId());
        catalogValidator.validateBeneficiary(input.beneficiaryId(), transaction.getBeneficiaryId());

        transaction.updateDetails(
                input.type(),
                input.description(),
                Money.positive(input.amount()),
                input.status(),
                input.dueDate(),
                input.paymentDate(),
                input.notes(),
                input.categoryId(),
                input.beneficiaryId(),
                LocalDate.now(clock),
                clock.instant()
        );

        transactionRepository.save(transaction);
        return transactionQueryPort.findOutputById(transaction.getId()).orElseThrow();
    }
}
