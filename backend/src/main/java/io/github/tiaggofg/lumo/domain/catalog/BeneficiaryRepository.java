package io.github.tiaggofg.lumo.domain.catalog;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BeneficiaryRepository {

    Beneficiary save(Beneficiary beneficiary);

    Optional<Beneficiary> findById(UUID id);

    List<Beneficiary> findAll(Boolean active);

    boolean existsByNameIgnoreCase(String name, UUID excludeId);

    boolean isReferencedInAnyRecord(UUID beneficiaryId);

    void deleteById(UUID id);
}
