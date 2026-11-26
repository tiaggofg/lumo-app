package io.github.tiaggofg.lumo.domain.catalog;

import io.github.tiaggofg.lumo.domain.shared.DomainValidationException;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BeneficiaryTest {

    private static final Instant NOW = Instant.parse("2026-11-26T12:00:00Z");

    @Test
    void shouldCreateActiveBeneficiaryWithTrimmedName() {
        Beneficiary beneficiary = Beneficiary.create("  Tiago  ", NOW);

        assertThat(beneficiary.getId()).isNotNull();
        assertThat(beneficiary.getName()).isEqualTo("Tiago");
        assertThat(beneficiary.isActive()).isTrue();
        assertThat(beneficiary.getCreatedAt()).isEqualTo(NOW);
    }

    @Test
    void shouldRejectBlankName() {
        assertThatThrownBy(() -> Beneficiary.create(" ", NOW))
                .isInstanceOf(DomainValidationException.class);
    }

    @Test
    void shouldRejectNullName() {
        assertThatThrownBy(() -> Beneficiary.create(null, NOW))
                .isInstanceOf(DomainValidationException.class);
    }

    @Test
    void shouldRejectNameLongerThan80Characters() {
        assertThatThrownBy(() -> Beneficiary.create("x".repeat(81), NOW))
                .isInstanceOf(DomainValidationException.class)
                .hasMessageContaining("80");
    }

    @Test
    void shouldRenameDeactivateAndActivateBeneficiary() {
        Beneficiary beneficiary = Beneficiary.create("Tiago", NOW);
        Instant later = NOW.plusSeconds(30);

        beneficiary.rename("Tiago Godoy", later);
        assertThat(beneficiary.getName()).isEqualTo("Tiago Godoy");
        assertThat(beneficiary.getUpdatedAt()).isEqualTo(later);

        beneficiary.deactivate(later.plusSeconds(10));
        assertThat(beneficiary.isActive()).isFalse();

        beneficiary.activate(later.plusSeconds(20));
        assertThat(beneficiary.isActive()).isTrue();
    }
}
