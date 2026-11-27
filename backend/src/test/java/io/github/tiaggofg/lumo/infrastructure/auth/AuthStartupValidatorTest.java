package io.github.tiaggofg.lumo.infrastructure.auth;

import jakarta.ws.rs.core.NewCookie;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AuthStartupValidatorTest {

    @Test
    void shouldFailInProdWhenSecretIsMissingOrShort() {
        AuthConfig blankConfig = mock(AuthConfig.class);
        when(blankConfig.jwtSecret()).thenReturn(Optional.of(""));
        AuthStartupValidator blankValidator = new AuthStartupValidator(blankConfig);
        assertThatThrownBy(() -> blankValidator.validate(true))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("LUMO_AUTH_JWT_SECRET");

        AuthConfig shortConfig = mock(AuthConfig.class);
        when(shortConfig.jwtSecret()).thenReturn(Optional.of("too-short-secret"));
        AuthStartupValidator shortValidator = new AuthStartupValidator(shortConfig);
        assertThatThrownBy(() -> shortValidator.validate(true))
                .isInstanceOf(IllegalStateException.class);
        assertThatCode(() -> shortValidator.validate(false)).doesNotThrowAnyException();

        AuthConfig validConfig = mock(AuthConfig.class);
        when(validConfig.jwtSecret()).thenReturn(Optional.of("a-very-strong-production-secret-32-chars-minimum"));
        AuthStartupValidator validValidator = new AuthStartupValidator(validConfig);
        assertThatCode(() -> validValidator.validate(true)).doesNotThrowAnyException();
    }

    @Test
    void shouldBuildHttpOnlySameSiteLaxCookiesAndClearCookies() {
        AuthConfig config = mock(AuthConfig.class);
        when(config.cookieSecure()).thenReturn(true);
        when(config.accessTokenTtl()).thenReturn(Duration.ofMinutes(15));
        when(config.refreshTokenTtl()).thenReturn(Duration.ofDays(30));
        when(config.oauthStateTtl()).thenReturn(Duration.ofMinutes(5));

        AuthCookieHelper helper = new AuthCookieHelper(config);

        NewCookie access = helper.accessCookie("jwt-val");
        assertThat(access.getName()).isEqualTo(AuthCookieHelper.ACCESS_COOKIE_NAME);
        assertThat(access.getPath()).isEqualTo("/api");
        assertThat(access.isHttpOnly()).isTrue();
        assertThat(access.isSecure()).isTrue();
        assertThat(access.getSameSite()).isEqualTo(NewCookie.SameSite.LAX);
        assertThat(access.getMaxAge()).isEqualTo(900);

        NewCookie refresh = helper.refreshCookie("ref-val");
        assertThat(refresh.getPath()).isEqualTo("/api/v1/auth");
        assertThat(refresh.getMaxAge()).isEqualTo(30 * 86400);

        NewCookie cleared = helper.clearRefreshCookie();
        assertThat(cleared.getMaxAge()).isZero();
        assertThat(cleared.getValue()).isEmpty();
        assertThat(helper.clearAccessCookie().getMaxAge()).isZero();
        assertThat(helper.clearOAuthStateCookie().getMaxAge()).isZero();
    }

    @Test
    void shouldEvaluateAuthConfigAdapterAllowlistAndFlags() {
        AuthConfig config = mock(AuthConfig.class);
        AuthConfig.GoogleConfig google = mock(AuthConfig.GoogleConfig.class);
        AuthConfig.DevLoginConfig devLogin = mock(AuthConfig.DevLoginConfig.class);
        when(config.google()).thenReturn(google);
        when(config.devLogin()).thenReturn(devLogin);
        when(google.clientId()).thenReturn(Optional.of("cid"));
        when(google.clientSecret()).thenReturn(Optional.of("csec"));
        when(devLogin.enabled()).thenReturn(true);
        when(config.accessTokenTtl()).thenReturn(Duration.ofMinutes(15));
        when(config.refreshTokenTtl()).thenReturn(Duration.ofDays(30));

        // Empty allowlist -> allows any email
        when(config.allowedEmails()).thenReturn(Optional.of(""));
        AuthConfigAdapter adapter = new AuthConfigAdapter(config);
        assertThat(adapter.isGoogleEnabled()).isTrue();
        assertThat(adapter.isDevLoginEnabled()).isTrue();
        assertThat(adapter.isEmailAllowed("anyone@example.com")).isTrue();
        assertThat(adapter.accessTokenTtl()).isEqualTo(Duration.ofMinutes(15));
        assertThat(adapter.refreshTokenTtl()).isEqualTo(Duration.ofDays(30));

        // Populated allowlist -> case-insensitive match
        when(config.allowedEmails()).thenReturn(Optional.of("Alice@Example.com, bob@example.com "));
        assertThat(adapter.isEmailAllowed("alice@example.com")).isTrue();
        assertThat(adapter.isEmailAllowed("BOB@EXAMPLE.COM")).isTrue();
        assertThat(adapter.isEmailAllowed("intruder@example.com")).isFalse();
        assertThat(adapter.isEmailAllowed(" ")).isFalse();
    }
}
