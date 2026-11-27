package io.github.tiaggofg.lumo.application.auth;

public record AuthSessionResult(
        UserSummary user,
        String accessToken,
        String refreshToken
) {
}
