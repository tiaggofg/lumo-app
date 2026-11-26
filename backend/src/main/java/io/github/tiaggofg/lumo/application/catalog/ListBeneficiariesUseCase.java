package io.github.tiaggofg.lumo.application.catalog;

import io.github.tiaggofg.lumo.application.stereotype.Query;
import io.github.tiaggofg.lumo.domain.catalog.BeneficiaryRepository;
import jakarta.inject.Inject;

import java.util.List;

@Query
public class ListBeneficiariesUseCase {

    private final BeneficiaryRepository beneficiaryRepository;

    @Inject
    public ListBeneficiariesUseCase(BeneficiaryRepository beneficiaryRepository) {
        this.beneficiaryRepository = beneficiaryRepository;
    }

    public List<BeneficiaryOutput> execute(Boolean active) {
        return beneficiaryRepository.findAll(active).stream()
                .map(BeneficiaryOutput::from)
                .toList();
    }
}
