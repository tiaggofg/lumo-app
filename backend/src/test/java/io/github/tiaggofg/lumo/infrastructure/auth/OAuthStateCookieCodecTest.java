package io.github.tiaggofg.lumo.infrastructure.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class OAuthStateCookieCodecTest {

    private static final Instant NOW = Instant.parse("2026-11-27T12:00:00Z");

    private AuthConfig mockConfig() {
        AuthConfig config = mock(AuthConfig.class);
        when(config.jwtSecret()).thenReturn(Optional.of("super-secret-jwt-key-with-more-than-32-characters"));
        when(config.oauthStateTtl()).thenReturn(Duration.ofMinutes(5));
        return config;
    }

    @Test
    void shouldEncodeDecodeAndVerifyStateCookieAndRejectTamperedOrExpired() {
        AuthConfig config = mockConfig();
        ObjectMapper mapper = new ObjectMapper();
        OAuthStateCookieCodec codec = new OAuthStateCookieCodec(config, mapper, Clock.fixed(NOW, ZoneOffset.UTC));

        OAuthStateCookieCodec.OAuthStatePayload payload = codec.createStatePayload("/budgets/123?tab=expenses");
        String encoded = codec.encode(payload);

        Optional<OAuthStateCookieCodec.OAuthStatePayload> decoded = codec.decodeAndVerify(encoded);
        assertThat(decoded).isPresent();
        assertThat(decoded.get().state()).isEqualTo(payload.state());
        assertThat(decoded.get().codeVerifier()).isEqualTo(payload.codeVerifier());
        assertThat(decoded.get().returnUrl()).isEqualTo("/budgets/123?tab=expenses");
        assertThat(codec.computePkceS256Challenge(payload.codeVerifier())).isNotBlank();

        // Tampered
        assertThat(codec.decodeAndVerify(encoded + "a")).isEmpty();

        // Expired
        OAuthStateCookieCodec laterCodec = new OAuthStateCookieCodec(
                config, mapper, Clock.fixed(NOW.plus(Duration.ofMinutes(6)), ZoneOffset.UTC));
        assertThat(laterCodec.decodeAndVerify(encoded)).isEmpty();
    }

    @Test
    void shouldSanitizeOpenRedirectUrlsToDefaultDashboard() {
        assertThat(OAuthStateCookieCodec.sanitizeReturnUrl("/budgets")).isEqualTo("/budgets");
        assertThat(OAuthStateCookieCodec.sanitizeReturnUrl("/recurrences?active=true")).isEqualTo("/recurrences?active=true");
        assertThat(OAuthStateCookieCodec.sanitizeReturnUrl(null)).isEqualTo("/dashboard");
        assertThat(OAuthStateCookieCodec.sanitizeReturnUrl("  ")).isEqualTo("/dashboard");
        assertThat(OAuthStateCookieCodec.sanitizeReturnUrl("https://evil.com")).isEqualTo("/dashboard");
        assertThat(OAuthStateCookieCodec.sanitizeReturnUrl("//evil.com/path")).isEqualTo("/dashboard");
        assertThat(OAuthStateCookieCodec.sanitizeReturnUrl("/\\evil.com")).isEqualTo("/dashboard");
        assertThat(OAuthStateCookieCodec.sanitizeReturnUrl("/login")).isEqualTo("/dashboard");
        assertThat(OAuthStateCookieCodec.sanitizeReturnUrl("/login?error=oauth_failed")).isEqualTo("/dashboard");
    }
}
