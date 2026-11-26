package io.github.tiaggofg.lumo.application.catalog;

import io.github.tiaggofg.lumo.domain.catalog.Category;
import io.github.tiaggofg.lumo.domain.transaction.TransactionType;

import java.time.Instant;
import java.util.UUID;

public record CategoryOutput(
        UUID id,
        String name,
        TransactionType type,
        String color,
        String icon,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
    public static CategoryOutput from(Category category) {
        return new CategoryOutput(
                category.getId(),
                category.getName(),
                category.getType(),
                category.getColor(),
                category.getIcon(),
                category.isActive(),
                category.getCreatedAt(),
                category.getUpdatedAt()
        );
    }
}
