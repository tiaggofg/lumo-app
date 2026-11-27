package io.github.tiaggofg.lumo.domain.auth;

import io.github.tiaggofg.lumo.domain.shared.DomainValidationException;
import io.github.tiaggofg.lumo.domain.stereotype.AggregateRoot;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public final class RefreshSession implements AggregateRoot<UUID> {

    private static final int TOKEN_HASH_LENGTH = 64;
    private static final int MAX_USER_AGENT_LENGTH = 512;
    private static final String NOW_REQUIRED = "now must not be null";

    private final UUID id;
    private final UUID userId;
    private final String tokenHash;
    private final String userAgent;
    private final Instant expiresAt;
    private Instant revokedAt;
    private final Instant createdAt;

    private RefreshSession(
            UUID id,
            UUID userId,
            String tokenHash,
            String userAgent,
            Instant expiresAt,
            Instant revokedAt,
            Instant createdAt
    ) {
        this.id = Objects.requireNonNull(id, "id must not be null");
        this.userId = Objects.requireNonNull(userId, "userId must not be null");
        this.tokenHash = validateTokenHash(tokenHash);
        this.userAgent = sanitizeUserAgent(userAgent);
        this.createdAt = Objects.requireNonNull(createdAt, "createdAt must not be null");
        this.expiresAt = Objects.requireNonNull(expiresAt, "expiresAt must not be null");
        if (!this.expiresAt.isAfter(this.createdAt)) {
            throw new DomainValidationException("expiresAt", "Refresh session expiration must be after creation time.");
        }
        this.revokedAt = revokedAt;
    }

    public static RefreshSession issue(
            UUID userId,
            String tokenHash,
            String userAgent,
            Instant now,
            Instant expiresAt
    ) {
        Instant created = Objects.requireNonNull(now, NOW_REQUIRED);
        return new RefreshSession(UUID.randomUUID(), userId, tokenHash, userAgent, expiresAt, null, created);
    }

    public static RefreshSession reconstitute(
            UUID id,
            UUID userId,
            String tokenHash,
            String userAgent,
            Instant expiresAt,
            Instant revokedAt,
            Instant createdAt
    ) {
        return new RefreshSession(id, userId, tokenHash, userAgent, expiresAt, revokedAt, createdAt);
    }

    public boolean isUsableAt(Instant now) {
        Instant checkAt = Objects.requireNonNull(now, NOW_REQUIRED);
        return revokedAt == null && expiresAt.isAfter(checkAt);
    }

    public void revoke(Instant now) {
        Instant timestamp = Objects.requireNonNull(now, NOW_REQUIRED);
        if (this.revokedAt == null) {
            this.revokedAt = timestamp;
        }
    }

    private static String validateTokenHash(String value) {
        if (value == null || value.isBlank()) {
            throw new DomainValidationException("tokenHash", "Refresh token hash must not be blank.");
        }
        String trimmed = value.trim();
        if (trimmed.length() != TOKEN_HASH_LENGTH) {
            throw new DomainValidationException(
                    "tokenHash",
                    "Refresh token hash must be exactly " + TOKEN_HASH_LENGTH + " hex characters."
            );
        }
        return trimmed;
    }

    private static String sanitizeUserAgent(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.length() > MAX_USER_AGENT_LENGTH) {
            return trimmed.substring(0, MAX_USER_AGENT_LENGTH);
        }
        return trimmed;
    }

    @Override
    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Instant getRevokedAt() {
        return revokedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
