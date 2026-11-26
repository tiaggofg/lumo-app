package io.github.tiaggofg.lumo.domain.recurrence;

import io.github.tiaggofg.lumo.domain.transaction.TransactionType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RecurringTransactionRepository {

    RecurringTransaction save(RecurringTransaction recurringTransaction);

    Optional<RecurringTransaction> findById(UUID id);

    List<RecurringTransaction> findAll(Boolean active, TransactionType type, RecurrenceType recurrenceType);

    List<RecurringTransaction> findAllActive();

    void deleteById(UUID id);
}
