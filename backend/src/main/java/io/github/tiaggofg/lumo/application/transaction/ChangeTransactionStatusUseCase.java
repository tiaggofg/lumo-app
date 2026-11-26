package io.github.tiaggofg.lumo.application.transaction;

import io.github.tiaggofg.lumo.application.stereotype.Command;
import io.github.tiaggofg.lumo.domain.shared.ResourceNotFoundException;
import io.github.tiaggofg.lumo.domain.transaction.Transaction;
import io.github.tiaggofg.lumo.domain.transaction.TransactionRepository;
import io.github.tiaggofg.lumo.domain.transaction.TransactionStatus;
import jakarta.inject.Inject;

import java.time.Clock;
import java.time.LocalDate;
import java.util.UUID;

@Command
public class ChangeTransactionStatusUseCase {

    private final TransactionRepository transactionRepository;
    private final TransactionQueryPort transactionQueryPort;
    private final Clock clock;

    @Inject
    public ChangeTransactionStatusUseCase(
            TransactionRepository transactionRepository,
            TransactionQueryPort transactionQueryPort,
            Clock clock
    ) {
        this.transactionRepository = transactionRepository;
        this.transactionQueryPort = transactionQueryPort;
        this.clock = clock;
    }

    public TransactionQueryPort.TransactionOutput execute(UUID id, TransactionStatus status, LocalDate paymentDate) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + id));

        transaction.changeStatus(status, paymentDate, LocalDate.now(clock), clock.instant());
        transactionRepository.save(transaction);
        return transactionQueryPort.findOutputById(transaction.getId()).orElseThrow();
    }
}
