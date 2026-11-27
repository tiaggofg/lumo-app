package io.github.tiaggofg.lumo.application.auth;

import java.time.Instant;
import java.util.UUID;

public record AccessTokenClaims(
        UUID userId,
        String email,
        Instant expiresAt
) {
}
