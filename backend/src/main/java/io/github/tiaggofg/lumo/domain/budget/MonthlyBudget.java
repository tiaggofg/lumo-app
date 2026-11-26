package io.github.tiaggofg.lumo.domain.budget;

import io.github.tiaggofg.lumo.domain.shared.CompetenceMonth;
import io.github.tiaggofg.lumo.domain.shared.DomainValidationException;
import io.github.tiaggofg.lumo.domain.stereotype.AggregateRoot;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public final class MonthlyBudget implements AggregateRoot<UUID> {

    private final UUID id;
    private final CompetenceMonth competenceMonth;
    private final Instant createdAt;
    private final Instant updatedAt;

    private MonthlyBudget(UUID id, CompetenceMonth competenceMonth, Instant createdAt, Instant updatedAt) {
        this.id = Objects.requireNonNull(id, "id must not be null");
        if (competenceMonth == null) {
            throw new DomainValidationException("competenceMonth", "Competence month is required.");
        }
        this.competenceMonth = competenceMonth;
        this.createdAt = Objects.requireNonNull(createdAt, "createdAt must not be null");
        this.updatedAt = Objects.requireNonNull(updatedAt, "updatedAt must not be null");
    }

    public static MonthlyBudget create(CompetenceMonth competenceMonth, Instant now) {
        Instant timestamp = Objects.requireNonNull(now, "now must not be null");
        return new MonthlyBudget(UUID.randomUUID(), competenceMonth, timestamp, timestamp);
    }

    public static MonthlyBudget reconstitute(UUID id, CompetenceMonth competenceMonth, Instant createdAt, Instant updatedAt) {
        return new MonthlyBudget(id, competenceMonth, createdAt, updatedAt);
    }

    @Override
    public UUID getId() {
        return id;
    }

    public CompetenceMonth getCompetenceMonth() {
        return competenceMonth;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
