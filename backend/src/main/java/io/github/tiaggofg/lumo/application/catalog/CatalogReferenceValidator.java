package io.github.tiaggofg.lumo.application.catalog;

import io.github.tiaggofg.lumo.domain.catalog.Beneficiary;
import io.github.tiaggofg.lumo.domain.catalog.BeneficiaryRepository;
import io.github.tiaggofg.lumo.domain.catalog.Category;
import io.github.tiaggofg.lumo.domain.catalog.CategoryRepository;
import io.github.tiaggofg.lumo.domain.shared.BusinessRuleViolationException;
import io.github.tiaggofg.lumo.domain.shared.DomainValidationException;
import io.github.tiaggofg.lumo.domain.shared.ResourceNotFoundException;
import io.github.tiaggofg.lumo.domain.transaction.TransactionType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.Objects;
import java.util.UUID;

@ApplicationScoped
public class CatalogReferenceValidator {

    private final CategoryRepository categoryRepository;
    private final BeneficiaryRepository beneficiaryRepository;

    @Inject
    public CatalogReferenceValidator(
            CategoryRepository categoryRepository,
            BeneficiaryRepository beneficiaryRepository
    ) {
        this.categoryRepository = categoryRepository;
        this.beneficiaryRepository = beneficiaryRepository;
    }

    public void validateCategory(UUID categoryId, TransactionType expectedType, UUID previousCategoryId) {
        if (categoryId == null) {
            return;
        }
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + categoryId));
        if (category.getType() != expectedType) {
            throw new DomainValidationException(
                    "categoryId",
                    "Category '" + category.getName() + "' has type " + category.getType()
                            + " and cannot be assigned to a " + expectedType + " record.");
        }
        boolean unchanged = Objects.equals(categoryId, previousCategoryId);
        if (!category.isActive() && !unchanged) {
            throw new BusinessRuleViolationException(
                    "Category '" + category.getName() + "' is inactive and cannot be assigned.");
        }
    }

    public void validateBeneficiary(UUID beneficiaryId, UUID previousBeneficiaryId) {
        if (beneficiaryId == null) {
            return;
        }
        Beneficiary beneficiary = beneficiaryRepository.findById(beneficiaryId)
                .orElseThrow(() -> new ResourceNotFoundException("Beneficiary not found: " + beneficiaryId));
        boolean unchanged = Objects.equals(beneficiaryId, previousBeneficiaryId);
        if (!beneficiary.isActive() && !unchanged) {
            throw new BusinessRuleViolationException(
                    "Beneficiary '" + beneficiary.getName() + "' is inactive and cannot be assigned.");
        }
    }
}
