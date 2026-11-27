package io.github.tiaggofg.lumo.domain.auth;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface RefreshSessionRepository {

    Optional<RefreshSession> findByTokenHash(String tokenHash);

    RefreshSession save(RefreshSession session);

    boolean revokeIfActive(UUID sessionId, Instant revokedAt);
}
