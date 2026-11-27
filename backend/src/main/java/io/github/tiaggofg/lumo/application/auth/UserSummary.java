package io.github.tiaggofg.lumo.application.auth;

import io.github.tiaggofg.lumo.domain.auth.User;

import java.util.UUID;

public record UserSummary(
        UUID id,
        String email,
        String name,
        String avatarUrl
) {
    public static UserSummary from(User user) {
        return new UserSummary(user.getId(), user.getEmail(), user.getName(), user.getAvatarUrl());
    }
}
