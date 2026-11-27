package io.github.tiaggofg.lumo.infrastructure.persistence.auth;

import io.github.tiaggofg.lumo.domain.auth.RefreshSession;
import io.github.tiaggofg.lumo.domain.auth.RefreshSessionRepository;
import io.github.tiaggofg.lumo.domain.auth.User;
import io.github.tiaggofg.lumo.domain.auth.UserRepository;
import io.github.tiaggofg.lumo.domain.shared.DomainValidationException;
import io.github.tiaggofg.lumo.infrastructure.auth.AuthConfig;
import io.github.tiaggofg.lumo.infrastructure.auth.AuthConfigAdapter;
import io.github.tiaggofg.lumo.infrastructure.auth.JwtTokenService;
import io.github.tiaggofg.lumo.infrastructure.auth.OAuthStateCookieCodec;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@QuarkusTest
class AuthPersistenceIT {

    @Inject
    UserRepository userRepository;

    @Inject
    RefreshSessionRepository refreshSessionRepository;

    @Inject
    JwtTokenService jwtTokenService;

    @Inject
    OAuthStateCookieCodec stateCookieCodec;

    @Test
    @Transactional
    void shouldPersistFindAndUpdateUserByGoogleSubAndEmail() {
        Instant now = Instant.parse("2026-11-27T12:00:00Z");
        String suffix = UUID.randomUUID().toString();
        User created = User.createFromGoogle(
                "google-sub-" + suffix,
                "user-" + suffix + "@example.com",
                "Maria Silva",
                "https://example.com/avatar.png",
                now
        );

        User saved = userRepository.save(created);
        assertThat(userRepository.findById(saved.getId())).isPresent();
        assertThat(userRepository.findByGoogleSub(saved.getGoogleSub())).isPresent();
        assertThat(userRepository.findByEmail(saved.getEmail().toUpperCase())).isPresent();

        saved.syncGoogleProfile(saved.getEmail(), "Maria Oliveira", "https://example.com/new.png", now.plusSeconds(60));
        userRepository.save(saved);

        User reloaded = userRepository.findById(saved.getId()).orElseThrow();
        assertThat(reloaded.getName()).isEqualTo("Maria Oliveira");
        assertThat(reloaded.getAvatarUrl()).isEqualTo("https://example.com/new.png");
    }

    @Test
    @Transactional
    void shouldPersistRefreshSessionAndRevokeAtomicallyOnlyOnce() {
        Instant now = Instant.parse("2026-11-27T12:00:00Z");
        String suffix = UUID.randomUUID().toString();
        User user = userRepository.save(User.createFromGoogle(
                "google-sub-sess-" + suffix,
                "sess-" + suffix + "@example.com",
                "Joao Souza",
                null,
                now
        ));

        String tokenHash = (suffix.replace("-", "") + suffix.replace("-", "")).substring(0, 64);
        RefreshSession session = RefreshSession.issue(
                user.getId(),
                tokenHash,
                "Playwright/Test",
                now,
                now.plusSeconds(86400 * 30L)
        );
        RefreshSession saved = refreshSessionRepository.save(session);

        assertThat(refreshSessionRepository.findByTokenHash(tokenHash)).isPresent();
        assertThat(refreshSessionRepository.revokeIfActive(saved.getId(), now.plusSeconds(120))).isTrue();
        assertThat(refreshSessionRepository.revokeIfActive(saved.getId(), now.plusSeconds(240))).isFalse();
    }

    @Test
    void shouldValidateAuthEdgeCasesInQuarkusRuntime() {
        Instant now = Instant.parse("2026-11-27T12:00:00Z");

        // OAuthStateCookieCodec edge cases
        assertThat(OAuthStateCookieCodec.sanitizeReturnUrl(null)).isEqualTo("/dashboard");
        assertThat(OAuthStateCookieCodec.sanitizeReturnUrl("https://evil.com")).isEqualTo("/dashboard");
        assertThat(OAuthStateCookieCodec.sanitizeReturnUrl("//evil.com")).isEqualTo("/dashboard");
        assertThat(OAuthStateCookieCodec.sanitizeReturnUrl("/login?error=x")).isEqualTo("/dashboard");
        assertThat(stateCookieCodec.decodeAndVerify(null)).isEmpty();
        assertThat(stateCookieCodec.decodeAndVerify("malformed")).isEmpty();
        assertThat(stateCookieCodec.decodeAndVerify("abc.def")).isEmpty();

        // JwtTokenService edge cases
        assertThat(jwtTokenService.verifyAccessToken(null)).isEmpty();
        assertThat(jwtTokenService.verifyAccessToken("only.two")).isEmpty();
        assertThat(jwtTokenService.verifyAccessToken("a.b.c")).isEmpty();

        // AuthConfigAdapter allowlist edge cases
        AuthConfig cfg = mock(AuthConfig.class);
        when(cfg.allowedEmails()).thenReturn(Optional.of("alice@example.com, bob@example.com"));
        AuthConfigAdapter adapter = new AuthConfigAdapter(cfg);
        assertThat(adapter.isEmailAllowed("ALICE@EXAMPLE.COM")).isTrue();
        assertThat(adapter.isEmailAllowed("other@example.com")).isFalse();
        assertThat(adapter.isEmailAllowed(" ")).isFalse();

        // Domain validation edge cases
        assertThatThrownBy(() -> User.createFromGoogle(" ", "a@b.com", "Name", null, now))
                .isInstanceOf(DomainValidationException.class);
        assertThatThrownBy(() -> User.createFromGoogle("sub", "bad-email", "Name", null, now))
                .isInstanceOf(DomainValidationException.class);
        assertThatThrownBy(() -> User.createFromGoogle("sub", "a@b.com", " ", null, now))
                .isInstanceOf(DomainValidationException.class);
        assertThatThrownBy(() -> RefreshSession.issue(UUID.randomUUID(), "short", null, now, now.plusSeconds(60)))
                .isInstanceOf(DomainValidationException.class);
        assertThatThrownBy(() -> RefreshSession.issue(UUID.randomUUID(), "a".repeat(64), null, now, now))
                .isInstanceOf(DomainValidationException.class);

        RefreshSession session = RefreshSession.issue(UUID.randomUUID(), "b".repeat(64), "x".repeat(600), now, now.plusSeconds(60));
        assertThat(session.getUserAgent()).hasSize(512);
        session.revoke(now.plusSeconds(10));
        assertThat(session.isUsableAt(now.plusSeconds(20))).isFalse();
    }
}
