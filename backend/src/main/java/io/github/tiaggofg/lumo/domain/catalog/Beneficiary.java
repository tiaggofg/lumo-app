package io.github.tiaggofg.lumo.domain.catalog;

import io.github.tiaggofg.lumo.domain.shared.DomainValidationException;
import io.github.tiaggofg.lumo.domain.stereotype.AggregateRoot;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public final class Beneficiary implements AggregateRoot<UUID> {

    private static final int MAX_NAME_LENGTH = 80;
    private static final String NOW_REQUIRED = "now must not be null";

    private final UUID id;
    private String name;
    private boolean active;
    private final Instant createdAt;
    private Instant updatedAt;

    private Beneficiary(UUID id, String name, boolean active, Instant createdAt, Instant updatedAt) {
        this.id = Objects.requireNonNull(id, "id must not be null");
        this.name = validateName(name);
        this.active = active;
        this.createdAt = Objects.requireNonNull(createdAt, "createdAt must not be null");
        this.updatedAt = Objects.requireNonNull(updatedAt, "updatedAt must not be null");
    }

    public static Beneficiary create(String name, Instant now) {
        Instant timestamp = Objects.requireNonNull(now, NOW_REQUIRED);
        return new Beneficiary(UUID.randomUUID(), name, true, timestamp, timestamp);
    }

    public static Beneficiary reconstitute(UUID id, String name, boolean active, Instant createdAt, Instant updatedAt) {
        return new Beneficiary(id, name, active, createdAt, updatedAt);
    }

    public void rename(String name, Instant now) {
        this.name = validateName(name);
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
            throw new DomainValidationException("name", "Beneficiary name must not be blank.");
        }
        String trimmed = value.trim();
        if (trimmed.length() > MAX_NAME_LENGTH) {
            throw new DomainValidationException("name", "Beneficiary name must not exceed " + MAX_NAME_LENGTH + " characters.");
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
