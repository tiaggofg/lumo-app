package io.github.tiaggofg.lumo.infrastructure.persistence.auth;

import io.github.tiaggofg.lumo.domain.auth.RefreshSession;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "refresh_sessions")
public class RefreshSessionJpaEntity {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "token_hash", nullable = false, length = 64)
    private String tokenHash;

    @Column(name = "user_agent", length = 512)
    private String userAgent;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected RefreshSessionJpaEntity() {
    }

    public static RefreshSessionJpaEntity fromDomain(RefreshSession session) {
        RefreshSessionJpaEntity entity = new RefreshSessionJpaEntity();
        entity.id = session.getId();
        entity.userId = session.getUserId();
        entity.tokenHash = session.getTokenHash();
        entity.userAgent = session.getUserAgent();
        entity.expiresAt = session.getExpiresAt();
        entity.revokedAt = session.getRevokedAt();
        entity.createdAt = session.getCreatedAt();
        return entity;
    }

    public RefreshSession toDomain() {
        return RefreshSession.reconstitute(id, userId, tokenHash, userAgent, expiresAt, revokedAt, createdAt);
    }

    public UUID getId() {
        return id;
    }
}
