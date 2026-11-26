package io.github.tiaggofg.lumo.infrastructure.persistence.catalog;

import io.github.tiaggofg.lumo.domain.catalog.Category;
import io.github.tiaggofg.lumo.domain.transaction.TransactionType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "categories")
public class CategoryJpaEntity {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false, length = 80)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 16)
    private TransactionType type;

    @Column(name = "color", length = 7)
    private String color;

    @Column(name = "icon", length = 50)
    private String icon;

    @Column(name = "active", nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected CategoryJpaEntity() {
    }

    public static CategoryJpaEntity fromDomain(Category category) {
        CategoryJpaEntity entity = new CategoryJpaEntity();
        entity.id = category.getId();
        entity.name = category.getName();
        entity.type = category.getType();
        entity.color = category.getColor();
        entity.icon = category.getIcon();
        entity.active = category.isActive();
        entity.createdAt = category.getCreatedAt();
        entity.updatedAt = category.getUpdatedAt();
        return entity;
    }

    public Category toDomain() {
        return Category.reconstitute(id, name, type, color, icon, active, createdAt, updatedAt);
    }

    public UUID getId() {
        return id;
    }
}
