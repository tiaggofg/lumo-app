package io.github.tiaggofg.lumo.domain.auth;

import io.github.tiaggofg.lumo.domain.shared.DomainValidationException;
import io.github.tiaggofg.lumo.domain.stereotype.AggregateRoot;

import java.time.Instant;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

public final class User implements AggregateRoot<UUID> {

    private static final int MAX_GOOGLE_SUB_LENGTH = 255;
    private static final int MAX_EMAIL_LENGTH = 255;
    private static final int MAX_NAME_LENGTH = 200;
    private static final int MAX_AVATAR_URL_LENGTH = 1024;
    private static final String NOW_REQUIRED = "now must not be null";
    private static final String CHARS_SUFFIX = " characters.";
    private static final String EMAIL_FIELD = "email";

    private final UUID id;
    private final String googleSub;
    private String email;
    private String name;
    private String avatarUrl;
    private boolean active;
    private final Instant createdAt;
    private Instant updatedAt;

    private User(
            UUID id,
            String googleSub,
            String email,
            String name,
            String avatarUrl,
            boolean active,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = Objects.requireNonNull(id, "id must not be null");
        this.googleSub = validateGoogleSub(googleSub);
        this.email = validateEmail(email);
        this.name = validateName(name);
        this.avatarUrl = validateAvatarUrl(avatarUrl);
        this.active = active;
        this.createdAt = Objects.requireNonNull(createdAt, "createdAt must not be null");
        this.updatedAt = Objects.requireNonNull(updatedAt, "updatedAt must not be null");
    }

    public static User createFromGoogle(
            String googleSub,
            String email,
            String name,
            String avatarUrl,
            Instant now
    ) {
        Instant timestamp = Objects.requireNonNull(now, NOW_REQUIRED);
        return new User(UUID.randomUUID(), googleSub, email, name, avatarUrl, true, timestamp, timestamp);
    }

    public static User reconstitute(
            UUID id,
            String googleSub,
            String email,
            String name,
            String avatarUrl,
            boolean active,
            Instant createdAt,
            Instant updatedAt
    ) {
        return new User(id, googleSub, email, name, avatarUrl, active, createdAt, updatedAt);
    }

    public void syncGoogleProfile(String email, String name, String avatarUrl, Instant now) {
        this.email = validateEmail(email);
        this.name = validateName(name);
        this.avatarUrl = validateAvatarUrl(avatarUrl);
        this.updatedAt = Objects.requireNonNull(now, NOW_REQUIRED);
    }

    public void deactivate(Instant now) {
        this.active = false;
        this.updatedAt = Objects.requireNonNull(now, NOW_REQUIRED);
    }

    private static String validateGoogleSub(String value) {
        if (value == null || value.isBlank()) {
            throw new DomainValidationException("googleSub", "Google subject must not be blank.");
        }
        String trimmed = value.trim();
        if (trimmed.length() > MAX_GOOGLE_SUB_LENGTH) {
            throw new DomainValidationException(
                    "googleSub",
                    "Google subject must not exceed " + MAX_GOOGLE_SUB_LENGTH + CHARS_SUFFIX
            );
        }
        return trimmed;
    }

    private static String validateEmail(String value) {
        if (value == null || value.isBlank()) {
            throw new DomainValidationException(EMAIL_FIELD, "User email must not be blank.");
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        if (normalized.length() > MAX_EMAIL_LENGTH) {
            throw new DomainValidationException(
                    EMAIL_FIELD,
                    "User email must not exceed " + MAX_EMAIL_LENGTH + CHARS_SUFFIX
            );
        }
        if (!normalized.contains("@") || normalized.startsWith("@") || normalized.endsWith("@")) {
            throw new DomainValidationException(EMAIL_FIELD, "User email must be a valid email address.");
        }
        return normalized;
    }

    private static String validateName(String value) {
        if (value == null || value.isBlank()) {
            throw new DomainValidationException("name", "User name must not be blank.");
        }
        String trimmed = value.trim();
        if (trimmed.length() > MAX_NAME_LENGTH) {
            throw new DomainValidationException(
                    "name",
                    "User name must not exceed " + MAX_NAME_LENGTH + CHARS_SUFFIX
            );
        }
        return trimmed;
    }

    private static String validateAvatarUrl(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.length() > MAX_AVATAR_URL_LENGTH) {
            throw new DomainValidationException(
                    "avatarUrl",
                    "Avatar URL must not exceed " + MAX_AVATAR_URL_LENGTH + CHARS_SUFFIX
            );
        }
        return trimmed;
    }

    @Override
    public UUID getId() {
        return id;
    }

    public String getGoogleSub() {
        return googleSub;
    }

    public String getEmail() {
        return email;
    }

    public String getName() {
        return name;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public boolean isActive() {
        return active;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
