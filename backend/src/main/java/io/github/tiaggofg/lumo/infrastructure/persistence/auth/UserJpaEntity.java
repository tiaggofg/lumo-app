package io.github.tiaggofg.lumo.infrastructure.persistence.auth;

import io.github.tiaggofg.lumo.domain.auth.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
public class UserJpaEntity {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "google_sub", nullable = false, length = 255)
    private String googleSub;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "avatar_url", length = 1024)
    private String avatarUrl;

    @Column(name = "active", nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected UserJpaEntity() {
    }

    public static UserJpaEntity fromDomain(User user) {
        UserJpaEntity entity = new UserJpaEntity();
        entity.id = user.getId();
        entity.googleSub = user.getGoogleSub();
        entity.email = user.getEmail();
        entity.name = user.getName();
        entity.avatarUrl = user.getAvatarUrl();
        entity.active = user.isActive();
        entity.createdAt = user.getCreatedAt();
        entity.updatedAt = user.getUpdatedAt();
        return entity;
    }

    public User toDomain() {
        return User.reconstitute(id, googleSub, email, name, avatarUrl, active, createdAt, updatedAt);
    }

    public UUID getId() {
        return id;
    }
}
