package io.github.tiaggofg.lumo.application.transaction;

import io.github.tiaggofg.lumo.application.recurrence.RecurringOccurrenceExclusionPort;
import io.github.tiaggofg.lumo.application.stereotype.Command;
import io.github.tiaggofg.lumo.domain.shared.ResourceNotFoundException;
import io.github.tiaggofg.lumo.domain.transaction.Transaction;
import io.github.tiaggofg.lumo.domain.transaction.TransactionRepository;
import jakarta.inject.Inject;

import java.time.Clock;
import java.util.UUID;

@Command
public class DeleteTransactionUseCase {

    private final TransactionRepository transactionRepository;
    private final RecurringOccurrenceExclusionPort exclusionPort;
    private final Clock clock;

    @Inject
    public DeleteTransactionUseCase(
            TransactionRepository transactionRepository,
            RecurringOccurrenceExclusionPort exclusionPort,
            Clock clock
    ) {
        this.transactionRepository = transactionRepository;
        this.exclusionPort = exclusionPort;
        this.clock = clock;
    }

    public void execute(UUID id) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + id));

        if (transaction.getSourceRecurringTransactionId() != null) {
            exclusionPort.recordExclusion(
                    transaction.getMonthlyBudgetId(),
                    transaction.getSourceRecurringTransactionId(),
                    clock.instant()
            );
        }
        transactionRepository.deleteById(id);
    }
}
