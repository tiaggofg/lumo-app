package io.github.tiaggofg.lumo.application.catalog;

import io.github.tiaggofg.lumo.application.stereotype.Command;
import io.github.tiaggofg.lumo.domain.catalog.Beneficiary;
import io.github.tiaggofg.lumo.domain.catalog.BeneficiaryRepository;
import io.github.tiaggofg.lumo.domain.shared.ResourceNotFoundException;
import jakarta.inject.Inject;

import java.time.Clock;
import java.util.UUID;

@Command
public class ChangeBeneficiaryStatusUseCase {

    private final BeneficiaryRepository beneficiaryRepository;
    private final Clock clock;

    @Inject
    public ChangeBeneficiaryStatusUseCase(BeneficiaryRepository beneficiaryRepository, Clock clock) {
        this.beneficiaryRepository = beneficiaryRepository;
        this.clock = clock;
    }

    public BeneficiaryOutput execute(UUID id, boolean active) {
        Beneficiary beneficiary = beneficiaryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Beneficiary not found: " + id));
        if (active) {
            beneficiary.activate(clock.instant());
        } else {
            beneficiary.deactivate(clock.instant());
        }
        return BeneficiaryOutput.from(beneficiaryRepository.save(beneficiary));
    }
}
