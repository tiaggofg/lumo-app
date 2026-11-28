package io.github.tiaggofg.lumo.infrastructure.auth;

import jakarta.ws.rs.core.NewCookie;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AuthStartupValidatorTest {

    @Test
    void shouldFailInProdWhenSecretIsMissingOrShort() {
        AuthConfig blankConfig = baseValidConfig("");
        AuthStartupValidator blankValidator = new AuthStartupValidator(blankConfig);
        assertThatThrownBy(() -> blankValidator.validate(true))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("LUMO_AUTH_JWT_SECRET");

        AuthConfig shortConfig = baseValidConfig("too-short-secret");
        AuthStartupValidator shortValidator = new AuthStartupValidator(shortConfig);
        assertThatThrownBy(() -> shortValidator.validate(true))
                .isInstanceOf(IllegalStateException.class);
        assertThatCode(() -> shortValidator.validate(false)).doesNotThrowAnyException();

        AuthConfig validConfig = baseValidConfig("a-very-strong-production-secret-32-chars-minimum");
        AuthStartupValidator validValidator = new AuthStartupValidator(validConfig);
        assertThatCode(() -> validValidator.validate(true)).doesNotThrowAnyException();
    }

    @Test
    void shouldFailWhenCookieSameSiteIsUnsupported() {
        AuthConfig invalidConfig = baseValidConfig("a-very-strong-production-secret-32-chars-minimum");
        when(invalidConfig.cookieSameSite()).thenReturn("INVALID");
        AuthStartupValidator validator = new AuthStartupValidator(invalidConfig);

        assertThatThrownBy(() -> validator.validate(false))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("LUMO_AUTH_COOKIE_SAME_SITE");
    }

    @Test
    void shouldFailWhenCookieSameSiteIsNoneWithoutSecureCookie() {
        AuthConfig upperNone = baseValidConfig("a-very-strong-production-secret-32-chars-minimum");
        when(upperNone.cookieSameSite()).thenReturn("NONE");
        when(upperNone.cookieSecure()).thenReturn(false);

        assertThatThrownBy(() -> new AuthStartupValidator(upperNone).validate(false))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("cookie-secure=true");

        AuthConfig lowerNone = baseValidConfig("a-very-strong-production-secret-32-chars-minimum");
        when(lowerNone.cookieSameSite()).thenReturn("none");
        when(lowerNone.cookieSecure()).thenReturn(false);

        assertThatThrownBy(() -> new AuthStartupValidator(lowerNone).validate(true))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("cookie-secure=true");
    }

    @Test
    void shouldAcceptValidCookieSameSitePoliciesCaseInsensitively() {
        AuthConfig noneSecure = baseValidConfig("a-very-strong-production-secret-32-chars-minimum");
        when(noneSecure.cookieSameSite()).thenReturn("none");
        when(noneSecure.cookieSecure()).thenReturn(true);
        assertThatCode(() -> new AuthStartupValidator(noneSecure).validate(true)).doesNotThrowAnyException();

        AuthConfig laxInsecure = baseValidConfig("a-very-strong-production-secret-32-chars-minimum");
        when(laxInsecure.cookieSameSite()).thenReturn("Lax");
        when(laxInsecure.cookieSecure()).thenReturn(false);
        assertThatCode(() -> new AuthStartupValidator(laxInsecure).validate(false)).doesNotThrowAnyException();

        AuthConfig strictConfig = baseValidConfig("a-very-strong-production-secret-32-chars-minimum");
        when(strictConfig.cookieSameSite()).thenReturn("strict");
        when(strictConfig.cookieSecure()).thenReturn(true);
        assertThatCode(() -> new AuthStartupValidator(strictConfig).validate(true)).doesNotThrowAnyException();
    }

    @Test
    void shouldFailWhenFrontendUrlHasInvalidSchemeOrMissingHost() {
        for (String invalidUrl : new String[]{
                "lumo.example.com",
                "javascript:alert(1)",
                "ftp://lumo.example.com",
                "https://",
                "http://bad host"
        }) {
            AuthConfig config = baseValidConfig("a-very-strong-production-secret-32-chars-minimum");
            when(config.frontendUrl()).thenReturn(Optional.of(invalidUrl));
            AuthStartupValidator validator = new AuthStartupValidator(config);

            assertThatThrownBy(() -> validator.validate(false))
                    .as("Expected failure for frontendUrl=%s", invalidUrl)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("LUMO_FRONTEND_URL");
        }
    }

    @Test
    void shouldAcceptBlankOrValidHttpAndHttpsFrontendUrls() {
        List<Optional<String>> validUrls = List.of(
                Optional.empty(),
                Optional.of(""),
                Optional.of("   "),
                Optional.of("http://localhost:4200"),
                Optional.of("https://lumo.example.com"),
                Optional.of("https://lumo.example.com/")
        );
        for (Optional<String> validUrl : validUrls) {
            AuthConfig config = baseValidConfig("a-very-strong-production-secret-32-chars-minimum");
            when(config.frontendUrl()).thenReturn(validUrl);
            assertThatCode(() -> new AuthStartupValidator(config).validate(true))
                    .doesNotThrowAnyException();
        }
    }

    private AuthConfig baseValidConfig(String jwtSecret) {
        AuthConfig config = mock(AuthConfig.class);
        when(config.jwtSecret()).thenReturn(Optional.of(jwtSecret));
        when(config.cookieSameSite()).thenReturn("LAX");
        when(config.cookieSecure()).thenReturn(true);
        when(config.frontendUrl()).thenReturn(Optional.empty());
        return config;
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
