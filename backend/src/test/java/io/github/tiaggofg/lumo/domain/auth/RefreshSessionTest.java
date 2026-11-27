package io.github.tiaggofg.lumo.domain.auth;

import io.github.tiaggofg.lumo.domain.shared.DomainValidationException;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RefreshSessionTest {

    private static final Instant NOW = Instant.parse("2026-11-27T12:00:00Z");
    private static final String VALID_HASH = "a".repeat(64);

    @Test
    void shouldIssueUsableSessionAndRevokeIrreversibly() {
        UUID userId = UUID.randomUUID();
        Instant expiresAt = NOW.plusSeconds(86400);
        RefreshSession session = RefreshSession.issue(userId, VALID_HASH, "Mozilla/5.0", NOW, expiresAt);

        assertThat(session.getId()).isNotNull();
        assertThat(session.getUserId()).isEqualTo(userId);
        assertThat(session.getTokenHash()).isEqualTo(VALID_HASH);
        assertThat(session.getUserAgent()).isEqualTo("Mozilla/5.0");
        assertThat(session.getRevokedAt()).isNull();
        assertThat(session.isUsableAt(NOW.plusSeconds(100))).isTrue();
        assertThat(session.isUsableAt(expiresAt)).isFalse();
        assertThat(session.isUsableAt(expiresAt.plusSeconds(1))).isFalse();

        Instant revokedAt = NOW.plusSeconds(200);
        session.revoke(revokedAt);
        assertThat(session.getRevokedAt()).isEqualTo(revokedAt);
        assertThat(session.isUsableAt(NOW.plusSeconds(100))).isFalse();

        // Subsequent revoke keeps original timestamp (irreversible)
        session.revoke(revokedAt.plusSeconds(500));
        assertThat(session.getRevokedAt()).isEqualTo(revokedAt);
    }

    @Test
    void shouldTruncateOverlongUserAgentAndRejectInvalidHashOrExpiry() {
        UUID userId = UUID.randomUUID();
        RefreshSession session = RefreshSession.issue(userId, VALID_HASH, "u".repeat(600), NOW, NOW.plusSeconds(60));
        assertThat(session.getUserAgent()).hasSize(512);

        assertThatThrownBy(() -> RefreshSession.issue(userId, "short", null, NOW, NOW.plusSeconds(60)))
                .isInstanceOf(DomainValidationException.class);
        assertThatThrownBy(() -> RefreshSession.issue(userId, " ", null, NOW, NOW.plusSeconds(60)))
                .isInstanceOf(DomainValidationException.class);
        assertThatThrownBy(() -> RefreshSession.issue(userId, VALID_HASH, null, NOW, NOW))
                .isInstanceOf(DomainValidationException.class);
        assertThatThrownBy(() -> RefreshSession.issue(userId, VALID_HASH, null, NOW, NOW.minusSeconds(1)))
                .isInstanceOf(DomainValidationException.class);
    }
}
