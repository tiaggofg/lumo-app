package io.github.tiaggofg.lumo.application.transaction;

import io.github.tiaggofg.lumo.application.catalog.CatalogReferenceValidator;
import io.github.tiaggofg.lumo.application.stereotype.Command;
import io.github.tiaggofg.lumo.domain.budget.MonthlyBudgetRepository;
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
public class CreateTransactionUseCase {

    private final MonthlyBudgetRepository budgetRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionQueryPort transactionQueryPort;
    private final CatalogReferenceValidator catalogValidator;
    private final Clock clock;

    @Inject
    public CreateTransactionUseCase(
            MonthlyBudgetRepository budgetRepository,
            TransactionRepository transactionRepository,
            TransactionQueryPort transactionQueryPort,
            CatalogReferenceValidator catalogValidator,
            Clock clock
    ) {
        this.budgetRepository = budgetRepository;
        this.transactionRepository = transactionRepository;
        this.transactionQueryPort = transactionQueryPort;
        this.catalogValidator = catalogValidator;
        this.clock = clock;
    }

    public record Input(
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
        if (budgetRepository.findById(input.monthlyBudgetId()).isEmpty()) {
            throw new ResourceNotFoundException("MonthlyBudget not found: " + input.monthlyBudgetId());
        }

        catalogValidator.validateCategory(input.categoryId(), input.type(), null);
        catalogValidator.validateBeneficiary(input.beneficiaryId(), null);

        Transaction transaction = Transaction.createManual(
                input.monthlyBudgetId(),
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

        Transaction saved = transactionRepository.save(transaction);
        return transactionQueryPort.findOutputById(saved.getId()).orElseThrow();
    }
}
