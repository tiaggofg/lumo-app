package io.github.tiaggofg.lumo.infrastructure.persistence.catalog;

import io.github.tiaggofg.lumo.domain.catalog.Beneficiary;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "beneficiaries")
public class BeneficiaryJpaEntity {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false, length = 80)
    private String name;

    @Column(name = "active", nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected BeneficiaryJpaEntity() {
    }

    public static BeneficiaryJpaEntity fromDomain(Beneficiary beneficiary) {
        BeneficiaryJpaEntity entity = new BeneficiaryJpaEntity();
        entity.id = beneficiary.getId();
        entity.name = beneficiary.getName();
        entity.active = beneficiary.isActive();
        entity.createdAt = beneficiary.getCreatedAt();
        entity.updatedAt = beneficiary.getUpdatedAt();
        return entity;
    }

    public Beneficiary toDomain() {
        return Beneficiary.reconstitute(id, name, active, createdAt, updatedAt);
    }

    public UUID getId() {
        return id;
    }
}
