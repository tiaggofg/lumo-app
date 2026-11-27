package io.github.tiaggofg.lumo.application.auth;

import io.github.tiaggofg.lumo.domain.auth.User;

import java.util.Optional;

public interface TokenServicePort {

    String issueAccessToken(User user);

    Optional<AccessTokenClaims> verifyAccessToken(String token);

    String generateOpaqueToken();

    String sha256Hex(String rawToken);
}
