package io.github.tiaggofg.lumo.application.recurrence;

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
import io.github.tiaggofg.lumo.domain.shared.ResourceNotFoundException;
import io.github.tiaggofg.lumo.domain.transaction.TransactionType;
import io.github.tiaggofg.lumo.infrastructure.web.error.ProblemDetail;
import io.github.tiaggofg.lumo.infrastructure.web.error.ProblemDetailExceptionMapper;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class BackendBranchCoverageTest {

    private static final Clock FIXED_CLOCK = Clock.fixed(Instant.parse("2026-11-26T12:00:00Z"), ZoneOffset.UTC);

    @Test
    void activateAndListRecurrencesShouldResolveCategoryAndBeneficiaryNames() {
        RecurringTransactionRepository recRepo = mock(RecurringTransactionRepository.class);
        CategoryRepository catRepo = mock(CategoryRepository.class);
        BeneficiaryRepository benRepo = mock(BeneficiaryRepository.class);

        Category cat = Category.create("Moradia", TransactionType.EXPENSE, "#6366F1", null, FIXED_CLOCK.instant());
        Beneficiary ben = Beneficiary.create("Família", FIXED_CLOCK.instant());
        RecurringTransaction rule = RecurringTransaction.create(
                TransactionType.EXPENSE, "Aluguel", Money.positive(new BigDecimal("800.00")),
                RecurrenceAmountType.FIXED, RecurrenceType.INDEFINITE,
                CompetenceMonth.parse("2026-11"), null, null, null, 5,
                cat.getId(), ben.getId(), null, FIXED_CLOCK.instant()
        );
        rule.deactivate(FIXED_CLOCK.instant());

        when(recRepo.findById(rule.getId())).thenReturn(Optional.of(rule));
        when(recRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(catRepo.findById(cat.getId())).thenReturn(Optional.of(cat));
        when(benRepo.findById(ben.getId())).thenReturn(Optional.of(ben));

        ActivateRecurringTransactionUseCase activateUseCase =
                new ActivateRecurringTransactionUseCase(recRepo, catRepo, benRepo, FIXED_CLOCK);
        RecurringTransactionOutput activated = activateUseCase.execute(rule.getId());

        assertThat(activated.active()).isTrue();
        assertThat(activated.categoryName()).isEqualTo("Moradia");
        assertThat(activated.beneficiaryName()).isEqualTo("Família");

        when(recRepo.findAll(true, TransactionType.EXPENSE, null)).thenReturn(List.of(rule));
        when(catRepo.findAll(null, null)).thenReturn(List.of(cat));
        when(benRepo.findAll(null)).thenReturn(List.of(ben));

        ListRecurringTransactionsUseCase listUseCase =
                new ListRecurringTransactionsUseCase(recRepo, catRepo, benRepo);
        List<RecurringTransactionOutput> list = listUseCase.execute(true, TransactionType.EXPENSE, null);

        assertThat(list).hasSize(1);
        assertThat(list.getFirst().categoryName()).isEqualTo("Moradia");
    }

    @Test
    void activateRecurrenceShouldThrowNotFoundForUnknownId() {
        RecurringTransactionRepository recRepo = mock(RecurringTransactionRepository.class);
        when(recRepo.findById(any())).thenReturn(Optional.empty());
        ActivateRecurringTransactionUseCase activateUseCase = new ActivateRecurringTransactionUseCase(
                recRepo, mock(CategoryRepository.class), mock(BeneficiaryRepository.class), FIXED_CLOCK);

        assertThatThrownBy(() -> activateUseCase.execute(UUID.randomUUID()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void problemDetailMapperShouldHandleWebApplicationExceptionAndForeignKeyViolation() {
        ProblemDetailExceptionMapper mapper = new ProblemDetailExceptionMapper();

        Response notFound = mapper.toResponse(new NotFoundException("Path not found"));
        assertThat(notFound.getStatus()).isEqualTo(404);
        assertThat(((ProblemDetail) notFound.getEntity()).type()).isEqualTo("https://lumo.local/problems/not-found");

        Response fkConflict = mapper.toResponse(new RuntimeException(new SQLException("fk violation", "23503")));
        assertThat(fkConflict.getStatus()).isEqualTo(409);
        assertThat(((ProblemDetail) fkConflict.getEntity()).detail()).contains("conflicts");
    }
}
