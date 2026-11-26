package io.github.tiaggofg.lumo.application.catalog;

import io.github.tiaggofg.lumo.domain.catalog.Beneficiary;
import io.github.tiaggofg.lumo.domain.catalog.BeneficiaryRepository;
import io.github.tiaggofg.lumo.domain.catalog.Category;
import io.github.tiaggofg.lumo.domain.catalog.CategoryRepository;
import io.github.tiaggofg.lumo.domain.shared.ResourceConflictException;
import io.github.tiaggofg.lumo.domain.shared.ResourceNotFoundException;
import io.github.tiaggofg.lumo.domain.transaction.TransactionType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CatalogUseCasesTest {

    private static final Clock FIXED_CLOCK = Clock.fixed(Instant.parse("2026-11-26T12:00:00Z"), ZoneOffset.UTC);

    private CategoryRepository categoryRepository;
    private BeneficiaryRepository beneficiaryRepository;

    @BeforeEach
    void setUp() {
        categoryRepository = mock(CategoryRepository.class);
        beneficiaryRepository = mock(BeneficiaryRepository.class);
        when(categoryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(beneficiaryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void createCategoryShouldRejectDuplicateNameForSameType() {
        when(categoryRepository.existsByNameIgnoreCaseAndType("Pets", TransactionType.EXPENSE, null)).thenReturn(true);
        CreateCategoryUseCase useCase = new CreateCategoryUseCase(categoryRepository, FIXED_CLOCK);

        assertThatThrownBy(() -> useCase.execute(
                new CreateCategoryUseCase.Input("Pets", TransactionType.EXPENSE, "#112233", "pi pi-tag")))
                .isInstanceOf(ResourceConflictException.class);
    }

    @Test
    void deleteCategoryShouldRejectWhenReferenced() {
        Category existing = Category.create("Pets", TransactionType.EXPENSE, null, null, FIXED_CLOCK.instant());
        when(categoryRepository.findById(existing.getId())).thenReturn(Optional.of(existing));
        when(categoryRepository.isReferencedInAnyRecord(existing.getId())).thenReturn(true);

        DeleteCategoryUseCase useCase = new DeleteCategoryUseCase(categoryRepository);
        assertThatThrownBy(() -> useCase.execute(existing.getId()))
                .isInstanceOf(ResourceConflictException.class);
    }

    @Test
    void changeCategoryStatusShouldDeactivateAndActivate() {
        Category existing = Category.create("Pets", TransactionType.EXPENSE, null, null, FIXED_CLOCK.instant());
        when(categoryRepository.findById(existing.getId())).thenReturn(Optional.of(existing));

        ChangeCategoryStatusUseCase useCase = new ChangeCategoryStatusUseCase(categoryRepository, FIXED_CLOCK);
        CategoryOutput deactivated = useCase.execute(existing.getId(), false);
        assertThat(deactivated.active()).isFalse();

        CategoryOutput activated = useCase.execute(existing.getId(), true);
        assertThat(activated.active()).isTrue();
    }

    @Test
    void createBeneficiaryShouldRejectDuplicateName() {
        when(beneficiaryRepository.existsByNameIgnoreCase("Tiago", null)).thenReturn(true);
        CreateBeneficiaryUseCase useCase = new CreateBeneficiaryUseCase(beneficiaryRepository, FIXED_CLOCK);

        assertThatThrownBy(() -> useCase.execute("Tiago"))
                .isInstanceOf(ResourceConflictException.class);
    }

    @Test
    void deleteBeneficiaryShouldThrowNotFoundForUnknownId() {
        UUID unknownId = UUID.randomUUID();
        when(beneficiaryRepository.findById(unknownId)).thenReturn(Optional.empty());

        DeleteBeneficiaryUseCase useCase = new DeleteBeneficiaryUseCase(beneficiaryRepository);
        assertThatThrownBy(() -> useCase.execute(unknownId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteBeneficiaryShouldDeleteWhenUnreferenced() {
        Beneficiary existing = Beneficiary.create("Jéssica", FIXED_CLOCK.instant());
        when(beneficiaryRepository.findById(existing.getId())).thenReturn(Optional.of(existing));
        when(beneficiaryRepository.isReferencedInAnyRecord(existing.getId())).thenReturn(false);

        DeleteBeneficiaryUseCase useCase = new DeleteBeneficiaryUseCase(beneficiaryRepository);
        useCase.execute(existing.getId());

        verify(beneficiaryRepository).deleteById(existing.getId());
    }
}
