package io.github.tiaggofg.lumo.infrastructure.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.tiaggofg.lumo.application.auth.AccessTokenClaims;
import io.github.tiaggofg.lumo.domain.auth.User;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class JwtTokenServiceTest {

    private static final Instant NOW = Instant.parse("2026-11-27T12:00:00Z");
    private static final String SECRET = "super-secret-jwt-key-with-more-than-32-characters";

    private AuthConfig mockConfig() {
        AuthConfig config = mock(AuthConfig.class);
        when(config.jwtSecret()).thenReturn(Optional.of(SECRET));
        when(config.accessTokenTtl()).thenReturn(Duration.ofMinutes(15));
        return config;
    }

    @Test
    void shouldIssueAndVerifyValidAccessTokenAndRejectTamperedOrExpiredTokens() {
        AuthConfig config = mockConfig();
        ObjectMapper mapper = new ObjectMapper();
        JwtTokenService service = new JwtTokenService(config, mapper, Clock.fixed(NOW, ZoneOffset.UTC));
        User user = User.createFromGoogle("sub-1", "alice@example.com", "Alice", null, NOW);

        String jwt = service.issueAccessToken(user);
        Optional<AccessTokenClaims> verified = service.verifyAccessToken(jwt);

        assertThat(verified).isPresent();
        assertThat(verified.get().userId()).isEqualTo(user.getId());
        assertThat(verified.get().email()).isEqualTo("alice@example.com");
        assertThat(verified.get().expiresAt()).isEqualTo(NOW.plus(Duration.ofMinutes(15)));

        // Tampered token
        assertThat(service.verifyAccessToken(jwt + "x")).isEmpty();
        assertThat(service.verifyAccessToken("not.a.jwt")).isEmpty();
        assertThat(service.verifyAccessToken(" ")).isEmpty();

        // Expired token
        JwtTokenService futureService = new JwtTokenService(
                config, mapper, Clock.fixed(NOW.plus(Duration.ofMinutes(16)), ZoneOffset.UTC));
        assertThat(futureService.verifyAccessToken(jwt)).isEmpty();
    }

    @Test
    void shouldGenerateOpaqueTokenAndSha256Hex() {
        JwtTokenService service = new JwtTokenService(mockConfig(), new ObjectMapper(), Clock.fixed(NOW, ZoneOffset.UTC));

        String token1 = service.generateOpaqueToken();
        String token2 = service.generateOpaqueToken();
        assertThat(token1).isNotEqualTo(token2);
        assertThat(token1.length()).isGreaterThanOrEqualTo(42);

        String hash = service.sha256Hex("hello-world");
        assertThat(hash).hasSize(64).matches("^[0-9a-f]{64}$");
        assertThat(service.sha256Hex("hello-world")).isEqualTo(hash);
    }
}
