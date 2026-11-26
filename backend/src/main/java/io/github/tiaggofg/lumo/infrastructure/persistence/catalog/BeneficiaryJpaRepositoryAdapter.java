package io.github.tiaggofg.lumo.infrastructure.persistence.catalog;

import io.github.tiaggofg.lumo.domain.catalog.Beneficiary;
import io.github.tiaggofg.lumo.domain.catalog.BeneficiaryRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class BeneficiaryJpaRepositoryAdapter implements BeneficiaryRepository {

    private final EntityManager entityManager;

    @Inject
    public BeneficiaryJpaRepositoryAdapter(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Override
    public Beneficiary save(Beneficiary beneficiary) {
        BeneficiaryJpaEntity merged = entityManager.merge(BeneficiaryJpaEntity.fromDomain(beneficiary));
        entityManager.flush();
        return merged.toDomain();
    }

    @Override
    public Optional<Beneficiary> findById(UUID id) {
        BeneficiaryJpaEntity entity = entityManager.find(BeneficiaryJpaEntity.class, id);
        return Optional.ofNullable(entity).map(BeneficiaryJpaEntity::toDomain);
    }

    @Override
    public List<Beneficiary> findAll(Boolean active) {
        StringBuilder jpql = new StringBuilder("SELECT b FROM BeneficiaryJpaEntity b WHERE 1=1");
        if (active != null) {
            jpql.append(" AND b.active = :active");
        }
        jpql.append(" ORDER BY LOWER(b.name) ASC, b.name ASC");

        TypedQuery<BeneficiaryJpaEntity> query = entityManager.createQuery(jpql.toString(), BeneficiaryJpaEntity.class);
        if (active != null) {
            query.setParameter("active", active);
        }
        return query.getResultList().stream().map(BeneficiaryJpaEntity::toDomain).toList();
    }

    @Override
    public boolean existsByNameIgnoreCase(String name, UUID excludeId) {
        String jpql = excludeId == null
                ? "SELECT COUNT(b) FROM BeneficiaryJpaEntity b WHERE LOWER(b.name) = LOWER(:name)"
                : "SELECT COUNT(b) FROM BeneficiaryJpaEntity b WHERE LOWER(b.name) = LOWER(:name) AND b.id <> :excludeId";
        TypedQuery<Long> query = entityManager.createQuery(jpql, Long.class)
                .setParameter("name", name.trim());
        if (excludeId != null) {
            query.setParameter("excludeId", excludeId);
        }
        return query.getSingleResult() > 0;
    }

    @Override
    public boolean isReferencedInAnyRecord(UUID beneficiaryId) {
        Number count = (Number) entityManager.createNativeQuery("""
                SELECT (
                    SELECT COUNT(*) FROM transactions WHERE beneficiary_id = :beneficiaryId
                ) + (
                    SELECT COUNT(*) FROM recurring_transactions WHERE beneficiary_id = :beneficiaryId
                )
                """)
                .setParameter("beneficiaryId", beneficiaryId)
                .getSingleResult();
        return count.longValue() > 0;
    }

    @Override
    public void deleteById(UUID id) {
        BeneficiaryJpaEntity entity = entityManager.find(BeneficiaryJpaEntity.class, id);
        if (entity != null) {
            entityManager.remove(entity);
            entityManager.flush();
        }
    }
}
