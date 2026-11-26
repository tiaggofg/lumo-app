package io.github.tiaggofg.lumo.application.catalog;

import io.github.tiaggofg.lumo.application.stereotype.Command;
import io.github.tiaggofg.lumo.domain.catalog.Beneficiary;
import io.github.tiaggofg.lumo.domain.catalog.BeneficiaryRepository;
import io.github.tiaggofg.lumo.domain.shared.ResourceConflictException;
import jakarta.inject.Inject;

import java.time.Clock;

@Command
public class CreateBeneficiaryUseCase {

    private final BeneficiaryRepository beneficiaryRepository;
    private final Clock clock;

    @Inject
    public CreateBeneficiaryUseCase(BeneficiaryRepository beneficiaryRepository, Clock clock) {
        this.beneficiaryRepository = beneficiaryRepository;
        this.clock = clock;
    }

    public BeneficiaryOutput execute(String name) {
        Beneficiary beneficiary = Beneficiary.create(name, clock.instant());
        if (beneficiaryRepository.existsByNameIgnoreCase(beneficiary.getName(), null)) {
            throw new ResourceConflictException("Beneficiary '" + beneficiary.getName() + "' already exists.");
        }
        return BeneficiaryOutput.from(beneficiaryRepository.save(beneficiary));
    }
}
