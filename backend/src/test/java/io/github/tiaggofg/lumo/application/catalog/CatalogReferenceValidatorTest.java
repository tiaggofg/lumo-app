package io.github.tiaggofg.lumo.application.catalog;

import io.github.tiaggofg.lumo.domain.catalog.Beneficiary;
import io.github.tiaggofg.lumo.domain.catalog.BeneficiaryRepository;
import io.github.tiaggofg.lumo.domain.catalog.Category;
import io.github.tiaggofg.lumo.domain.catalog.CategoryRepository;
import io.github.tiaggofg.lumo.domain.shared.BusinessRuleViolationException;
import io.github.tiaggofg.lumo.domain.shared.DomainValidationException;
import io.github.tiaggofg.lumo.domain.shared.ResourceNotFoundException;
import io.github.tiaggofg.lumo.domain.transaction.TransactionType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CatalogReferenceValidatorTest {

    private static final Instant NOW = Instant.parse("2026-11-26T12:00:00Z");

    private CategoryRepository categoryRepository;
    private BeneficiaryRepository beneficiaryRepository;
    private CatalogReferenceValidator validator;

    @BeforeEach
    void setUp() {
        categoryRepository = mock(CategoryRepository.class);
        beneficiaryRepository = mock(BeneficiaryRepository.class);
        validator = new CatalogReferenceValidator(categoryRepository, beneficiaryRepository);
    }

    @Test
    void shouldAllowNullCategoryAndBeneficiary() {
        assertThatCode(() -> validator.validateCategory(null, TransactionType.EXPENSE, null)).doesNotThrowAnyException();
        assertThatCode(() -> validator.validateBeneficiary(null, null)).doesNotThrowAnyException();
    }

    @Test
    void shouldRejectMissingCategoryWith404() {
        UUID id = UUID.randomUUID();
        when(categoryRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> validator.validateCategory(id, TransactionType.EXPENSE, null))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void shouldRejectMismatchedCategoryTypeWith400() {
        Category incomeCat = Category.create("Salário", TransactionType.INCOME, null, null, NOW);
        when(categoryRepository.findById(incomeCat.getId())).thenReturn(Optional.of(incomeCat));

        assertThatThrownBy(() -> validator.validateCategory(incomeCat.getId(), TransactionType.EXPENSE, null))
                .isInstanceOf(DomainValidationException.class);
    }

    @Test
    void shouldRejectInactiveCategoryOnNewAssignmentButAllowWhenUnchanged() {
        Category cat = Category.create("Antiga", TransactionType.EXPENSE, null, null, NOW);
        cat.deactivate(NOW);
        when(categoryRepository.findById(cat.getId())).thenReturn(Optional.of(cat));

        assertThatThrownBy(() -> validator.validateCategory(cat.getId(), TransactionType.EXPENSE, null))
                .isInstanceOf(BusinessRuleViolationException.class);
        assertThatCode(() -> validator.validateCategory(cat.getId(), TransactionType.EXPENSE, cat.getId()))
                .doesNotThrowAnyException();
    }

    @Test
    void shouldRejectMissingAndInactiveBeneficiaryUnlessUnchanged() {
        UUID missingId = UUID.randomUUID();
        when(beneficiaryRepository.findById(missingId)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> validator.validateBeneficiary(missingId, null))
                .isInstanceOf(ResourceNotFoundException.class);

        Beneficiary ben = Beneficiary.create("Antigo", NOW);
        ben.deactivate(NOW);
        when(beneficiaryRepository.findById(ben.getId())).thenReturn(Optional.of(ben));

        assertThatThrownBy(() -> validator.validateBeneficiary(ben.getId(), null))
                .isInstanceOf(BusinessRuleViolationException.class);
        assertThatCode(() -> validator.validateBeneficiary(ben.getId(), ben.getId()))
                .doesNotThrowAnyException();
    }
}
