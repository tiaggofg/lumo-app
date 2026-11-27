package io.github.tiaggofg.lumo.domain.auth;

import io.github.tiaggofg.lumo.domain.shared.DomainValidationException;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class UserTest {

    private static final Instant NOW = Instant.parse("2026-11-27T12:00:00Z");

    @Test
    void shouldCreateActiveUserWithNormalizedEmailAndTrimmedFields() {
        User user = User.createFromGoogle(
                "  google-sub-123  ",
                "  Alice@Example.COM  ",
                "  Alice Silva  ",
                "  https://lh3.googleusercontent.com/a/avatar  ",
                NOW
        );

        assertThat(user.getId()).isNotNull();
        assertThat(user.getGoogleSub()).isEqualTo("google-sub-123");
        assertThat(user.getEmail()).isEqualTo("alice@example.com");
        assertThat(user.getName()).isEqualTo("Alice Silva");
        assertThat(user.getAvatarUrl()).isEqualTo("https://lh3.googleusercontent.com/a/avatar");
        assertThat(user.isActive()).isTrue();
        assertThat(user.getCreatedAt()).isEqualTo(NOW);
        assertThat(user.getUpdatedAt()).isEqualTo(NOW);
    }

    @Test
    void shouldSyncGoogleProfileAndDeactivateUser() {
        User user = User.createFromGoogle("sub-1", "alice@example.com", "Alice", null, NOW);
        Instant later = NOW.plusSeconds(3600);

        user.syncGoogleProfile("ALICE.NEW@EXAMPLE.COM", "Alice Oliveira", "https://example.com/p.png", later);
        assertThat(user.getEmail()).isEqualTo("alice.new@example.com");
        assertThat(user.getName()).isEqualTo("Alice Oliveira");
        assertThat(user.getAvatarUrl()).isEqualTo("https://example.com/p.png");
        assertThat(user.getUpdatedAt()).isEqualTo(later);

        Instant deactivatedAt = later.plusSeconds(60);
        user.deactivate(deactivatedAt);
        assertThat(user.isActive()).isFalse();
        assertThat(user.getUpdatedAt()).isEqualTo(deactivatedAt);
    }

    @Test
    void shouldReconstitutePersistedUser() {
        UUID id = UUID.randomUUID();
        User user = User.reconstitute(id, "sub-2", "bob@example.com", "Bob", "  ", false, NOW, NOW);

        assertThat(user.getId()).isEqualTo(id);
        assertThat(user.getAvatarUrl()).isNull();
        assertThat(user.isActive()).isFalse();
    }

    @Test
    void shouldRejectInvalidFields() {
        assertThatThrownBy(() -> User.createFromGoogle(" ", "a@b.com", "Name", null, NOW))
                .isInstanceOf(DomainValidationException.class);
        assertThatThrownBy(() -> User.createFromGoogle("x".repeat(256), "a@b.com", "Name", null, NOW))
                .isInstanceOf(DomainValidationException.class);
        assertThatThrownBy(() -> User.createFromGoogle("sub", "invalid-email", "Name", null, NOW))
                .isInstanceOf(DomainValidationException.class);
        assertThatThrownBy(() -> User.createFromGoogle("sub", "a".repeat(250) + "@b.com", "Name", null, NOW))
                .isInstanceOf(DomainValidationException.class);
        assertThatThrownBy(() -> User.createFromGoogle("sub", "a@b.com", " ", null, NOW))
                .isInstanceOf(DomainValidationException.class);
        assertThatThrownBy(() -> User.createFromGoogle("sub", "a@b.com", "n".repeat(201), null, NOW))
                .isInstanceOf(DomainValidationException.class);
        assertThatThrownBy(() -> User.createFromGoogle("sub", "a@b.com", "Name", "u".repeat(1025), NOW))
                .isInstanceOf(DomainValidationException.class);
    }
}
