package io.github.tiaggofg.lumo.application.catalog;

import io.github.tiaggofg.lumo.application.stereotype.Command;
import io.github.tiaggofg.lumo.domain.catalog.BeneficiaryRepository;
import io.github.tiaggofg.lumo.domain.shared.ResourceConflictException;
import io.github.tiaggofg.lumo.domain.shared.ResourceNotFoundException;
import jakarta.inject.Inject;

import java.util.UUID;

@Command
public class DeleteBeneficiaryUseCase {

    private final BeneficiaryRepository beneficiaryRepository;

    @Inject
    public DeleteBeneficiaryUseCase(BeneficiaryRepository beneficiaryRepository) {
        this.beneficiaryRepository = beneficiaryRepository;
    }

    public void execute(UUID id) {
        if (beneficiaryRepository.findById(id).isEmpty()) {
            throw new ResourceNotFoundException("Beneficiary not found: " + id);
        }
        if (beneficiaryRepository.isReferencedInAnyRecord(id)) {
            throw new ResourceConflictException(
                    "Beneficiary cannot be deleted because it is referenced by existing transactions or recurrences.");
        }
        beneficiaryRepository.deleteById(id);
    }
}
