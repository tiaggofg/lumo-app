package io.github.tiaggofg.lumo.domain.catalog;

import io.github.tiaggofg.lumo.domain.shared.DomainValidationException;
import io.github.tiaggofg.lumo.domain.stereotype.AggregateRoot;
import io.github.tiaggofg.lumo.domain.transaction.TransactionType;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import java.util.regex.Pattern;

public final class Category implements AggregateRoot<UUID> {

    private static final int MAX_NAME_LENGTH = 80;
    private static final int MAX_ICON_LENGTH = 50;
    private static final String NOW_REQUIRED = "now must not be null";
    private static final Pattern HEX_COLOR_PATTERN = Pattern.compile("^#[0-9A-Fa-f]{6}$");

    private final UUID id;
    private String name;
    private final TransactionType type;
    private String color;
    private String icon;
    private boolean active;
    private final Instant createdAt;
    private Instant updatedAt;

    private Category(
            UUID id,
            String name,
            TransactionType type,
            String color,
            String icon,
            boolean active,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = Objects.requireNonNull(id, "id must not be null");
        this.name = validateName(name);
        if (type == null) {
            throw new DomainValidationException("type", "Category type is required.");
        }
        this.type = type;
        this.color = validateColor(color);
        this.icon = validateIcon(icon);
        this.active = active;
        this.createdAt = Objects.requireNonNull(createdAt, "createdAt must not be null");
        this.updatedAt = Objects.requireNonNull(updatedAt, "updatedAt must not be null");
    }

    public static Category create(String name, TransactionType type, String color, String icon, Instant now) {
        Instant timestamp = Objects.requireNonNull(now, NOW_REQUIRED);
        return new Category(UUID.randomUUID(), name, type, color, icon, true, timestamp, timestamp);
    }

    public static Category reconstitute(
            UUID id,
            String name,
            TransactionType type,
            String color,
            String icon,
            boolean active,
            Instant createdAt,
            Instant updatedAt
    ) {
        return new Category(id, name, type, color, icon, active, createdAt, updatedAt);
    }

    public void update(String name, String color, String icon, Instant now) {
        this.name = validateName(name);
        this.color = validateColor(color);
        this.icon = validateIcon(icon);
        this.updatedAt = Objects.requireNonNull(now, NOW_REQUIRED);
    }

    public void deactivate(Instant now) {
        this.active = false;
        this.updatedAt = Objects.requireNonNull(now, NOW_REQUIRED);
    }

    public void activate(Instant now) {
        this.active = true;
        this.updatedAt = Objects.requireNonNull(now, NOW_REQUIRED);
    }

    private static String validateName(String value) {
        if (value == null || value.isBlank()) {
            throw new DomainValidationException("name", "Category name must not be blank.");
        }
        String trimmed = value.trim();
        if (trimmed.length() > MAX_NAME_LENGTH) {
            throw new DomainValidationException("name", "Category name must not exceed " + MAX_NAME_LENGTH + " characters.");
        }
        return trimmed;
    }

    private static String validateColor(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        if (!HEX_COLOR_PATTERN.matcher(trimmed).matches()) {
            throw new DomainValidationException("color", "Category color must be a valid hex code (#RRGGBB).");
        }
        return trimmed.toUpperCase();
    }

    private static String validateIcon(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.length() > MAX_ICON_LENGTH) {
            throw new DomainValidationException("icon", "Category icon must not exceed " + MAX_ICON_LENGTH + " characters.");
        }
        return trimmed;
    }

    @Override
    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public TransactionType getType() {
        return type;
    }

    public String getColor() {
        return color;
    }

    public String getIcon() {
        return icon;
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
