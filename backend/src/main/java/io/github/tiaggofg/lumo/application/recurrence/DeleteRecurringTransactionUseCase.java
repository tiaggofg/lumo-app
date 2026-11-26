package io.github.tiaggofg.lumo.application.recurrence;

import io.github.tiaggofg.lumo.application.stereotype.Command;
import io.github.tiaggofg.lumo.domain.recurrence.RecurringTransaction;
import io.github.tiaggofg.lumo.domain.recurrence.RecurringTransactionRepository;
import io.github.tiaggofg.lumo.domain.shared.ResourceConflictException;
import io.github.tiaggofg.lumo.domain.shared.ResourceNotFoundException;
import jakarta.inject.Inject;

import java.util.UUID;

@Command
public class DeleteRecurringTransactionUseCase {

    private final RecurringTransactionRepository recurringRepository;

    @Inject
    public DeleteRecurringTransactionUseCase(RecurringTransactionRepository recurringRepository) {
        this.recurringRepository = recurringRepository;
    }

    public void execute(UUID id) {
        RecurringTransaction rule = recurringRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RecurringTransaction not found: " + id));
        if (rule.hasGeneratedTransactions()) {
            throw new ResourceConflictException(
                    "RecurringTransaction cannot be physically deleted because it has already generated transactions. Deactivate it instead.");
        }
        recurringRepository.deleteById(id);
    }
}
