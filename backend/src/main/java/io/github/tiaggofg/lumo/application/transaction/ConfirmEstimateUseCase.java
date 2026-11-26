package io.github.tiaggofg.lumo.application.transaction;

import io.github.tiaggofg.lumo.application.stereotype.Command;
import io.github.tiaggofg.lumo.domain.recurrence.RecurringTransactionRepository;
import io.github.tiaggofg.lumo.domain.shared.Money;
import io.github.tiaggofg.lumo.domain.shared.ResourceNotFoundException;
import io.github.tiaggofg.lumo.domain.transaction.Transaction;
import io.github.tiaggofg.lumo.domain.transaction.TransactionRepository;
import io.github.tiaggofg.lumo.domain.transaction.TransactionStatus;
import jakarta.inject.Inject;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Command
public class ConfirmEstimateUseCase {

    private final TransactionRepository transactionRepository;
    private final TransactionQueryPort transactionQueryPort;
    private final RecurringTransactionRepository recurringRepository;
    private final Clock clock;

    @Inject
    public ConfirmEstimateUseCase(
            TransactionRepository transactionRepository,
            TransactionQueryPort transactionQueryPort,
            RecurringTransactionRepository recurringRepository,
            Clock clock
    ) {
        this.transactionRepository = transactionRepository;
        this.transactionQueryPort = transactionQueryPort;
        this.recurringRepository = recurringRepository;
        this.clock = clock;
    }

    public record Input(
            UUID id,
            BigDecimal amount,
            TransactionStatus targetStatus,
            LocalDate paymentDate,
            boolean updateRecurringTemplate
    ) {
    }

    public TransactionQueryPort.TransactionOutput execute(Input input) {
        Transaction transaction = transactionRepository.findById(input.id())
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + input.id()));

        Instant now = clock.instant();
        Money actualAmount = Money.positive(input.amount());
        transaction.confirmEstimate(actualAmount, input.targetStatus(), input.paymentDate(), LocalDate.now(clock), now);
        transactionRepository.save(transaction);

        if (input.updateRecurringTemplate() && transaction.getSourceRecurringTransactionId() != null) {
            recurringRepository.findById(transaction.getSourceRecurringTransactionId()).ifPresent(rule -> {
                rule.updateDefaultAmount(actualAmount, now);
                recurringRepository.save(rule);
            });
        }

        return transactionQueryPort.findOutputById(transaction.getId()).orElseThrow();
    }
}
