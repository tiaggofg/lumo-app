package io.github.tiaggofg.lumo.infrastructure.persistence.auth;

import io.github.tiaggofg.lumo.domain.auth.RefreshSession;
import io.github.tiaggofg.lumo.domain.auth.RefreshSessionRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class RefreshSessionJpaRepositoryAdapter implements RefreshSessionRepository {

    private final EntityManager entityManager;

    @Inject
    public RefreshSessionJpaRepositoryAdapter(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Override
    public Optional<RefreshSession> findByTokenHash(String tokenHash) {
        List<RefreshSessionJpaEntity> results = entityManager.createQuery(
                        "SELECT s FROM RefreshSessionJpaEntity s WHERE s.tokenHash = :tokenHash",
                        RefreshSessionJpaEntity.class
                )
                .setParameter("tokenHash", tokenHash)
                .setMaxResults(1)
                .getResultList();
        return results.stream().findFirst().map(RefreshSessionJpaEntity::toDomain);
    }

    @Override
    public RefreshSession save(RefreshSession session) {
        RefreshSessionJpaEntity merged = entityManager.merge(RefreshSessionJpaEntity.fromDomain(session));
        entityManager.flush();
        return merged.toDomain();
    }

    @Override
    public boolean revokeIfActive(UUID sessionId, Instant revokedAt) {
        int updated = entityManager.createQuery(
                        "UPDATE RefreshSessionJpaEntity s SET s.revokedAt = :revokedAt "
                                + "WHERE s.id = :id AND s.revokedAt IS NULL"
                )
                .setParameter("revokedAt", revokedAt)
                .setParameter("id", sessionId)
                .executeUpdate();
        entityManager.flush();
        return updated == 1;
    }
}
