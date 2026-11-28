package io.github.tiaggofg.lumo.infrastructure.auth;

import jakarta.ws.rs.core.NewCookie;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AuthCookieHelperTest {

    @Test
    void shouldApplyLaxSameSiteByDefaultAndWhenConfigured() {
        AuthCookieHelper helper = new AuthCookieHelper(mockConfig("LAX", false));

        assertAllCookiesSameSite(helper, NewCookie.SameSite.LAX, false);
    }

    @Test
    void shouldApplyNoneSameSiteCaseInsensitivelyToAllAuthCookies() {
        AuthCookieHelper helper = new AuthCookieHelper(mockConfig("none", true));

        assertAllCookiesSameSite(helper, NewCookie.SameSite.NONE, true);
    }

    @Test
    void shouldApplyStrictSameSiteCaseInsensitivelyToAllAuthCookies() {
        AuthCookieHelper helper = new AuthCookieHelper(mockConfig("Strict", true));

        assertAllCookiesSameSite(helper, NewCookie.SameSite.STRICT, true);
    }

    @Test
    void shouldFallbackToLaxWhenBlankAndRejectUnsupportedSameSite() {
        AuthCookieHelper blankHelper = new AuthCookieHelper(mockConfig("  ", false));
        assertThat(blankHelper.accessCookie("tok").getSameSite()).isEqualTo(NewCookie.SameSite.LAX);

        AuthCookieHelper invalidHelper = new AuthCookieHelper(mockConfig("BOGUS", true));
        assertThatThrownBy(() -> invalidHelper.accessCookie("tok"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("LUMO_AUTH_COOKIE_SAME_SITE");
    }

    private void assertAllCookiesSameSite(AuthCookieHelper helper, NewCookie.SameSite expected, boolean secure) {
        NewCookie[] cookies = {
                helper.accessCookie("access-tok"),
                helper.refreshCookie("refresh-tok"),
                helper.oauthStateCookie("state-tok"),
                helper.clearAccessCookie(),
                helper.clearRefreshCookie(),
                helper.clearOAuthStateCookie()
        };
        for (NewCookie cookie : cookies) {
            assertThat(cookie.isHttpOnly()).isTrue();
            assertThat(cookie.isSecure()).isEqualTo(secure);
            assertThat(cookie.getSameSite()).isEqualTo(expected);
        }
    }

    private AuthConfig mockConfig(String sameSite, boolean secure) {
        AuthConfig config = mock(AuthConfig.class);
        when(config.cookieSameSite()).thenReturn(sameSite);
        when(config.cookieSecure()).thenReturn(secure);
        when(config.accessTokenTtl()).thenReturn(Duration.ofMinutes(15));
        when(config.refreshTokenTtl()).thenReturn(Duration.ofDays(30));
        when(config.oauthStateTtl()).thenReturn(Duration.ofMinutes(5));
        return config;
    }
}
