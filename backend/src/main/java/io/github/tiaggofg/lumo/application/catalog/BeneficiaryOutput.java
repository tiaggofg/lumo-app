package io.github.tiaggofg.lumo.application.catalog;

import io.github.tiaggofg.lumo.domain.catalog.Beneficiary;

import java.time.Instant;
import java.util.UUID;

public record BeneficiaryOutput(
        UUID id,
        String name,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
    public static BeneficiaryOutput from(Beneficiary beneficiary) {
        return new BeneficiaryOutput(
                beneficiary.getId(),
                beneficiary.getName(),
                beneficiary.isActive(),
                beneficiary.getCreatedAt(),
                beneficiary.getUpdatedAt()
        );
    }
}
