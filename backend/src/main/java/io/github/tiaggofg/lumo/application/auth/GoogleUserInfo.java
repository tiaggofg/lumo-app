package io.github.tiaggofg.lumo.application.auth;

public record GoogleUserInfo(
        String sub,
        String email,
        boolean emailVerified,
        String name,
        String avatarUrl
) {
}
