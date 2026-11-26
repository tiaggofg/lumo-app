package io.github.tiaggofg.lumo.application.catalog;

import io.github.tiaggofg.lumo.application.stereotype.Command;
import io.github.tiaggofg.lumo.domain.catalog.Beneficiary;
import io.github.tiaggofg.lumo.domain.catalog.BeneficiaryRepository;
import io.github.tiaggofg.lumo.domain.shared.ResourceConflictException;
import io.github.tiaggofg.lumo.domain.shared.ResourceNotFoundException;
import jakarta.inject.Inject;

import java.time.Clock;
import java.util.UUID;

@Command
public class UpdateBeneficiaryUseCase {

    private final BeneficiaryRepository beneficiaryRepository;
    private final Clock clock;

    @Inject
    public UpdateBeneficiaryUseCase(BeneficiaryRepository beneficiaryRepository, Clock clock) {
        this.beneficiaryRepository = beneficiaryRepository;
        this.clock = clock;
    }

    public BeneficiaryOutput execute(UUID id, String name) {
        Beneficiary beneficiary = beneficiaryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Beneficiary not found: " + id));
        beneficiary.rename(name, clock.instant());
        if (beneficiaryRepository.existsByNameIgnoreCase(beneficiary.getName(), beneficiary.getId())) {
            throw new ResourceConflictException("Beneficiary '" + beneficiary.getName() + "' already exists.");
        }
        return BeneficiaryOutput.from(beneficiaryRepository.save(beneficiary));
    }
}
