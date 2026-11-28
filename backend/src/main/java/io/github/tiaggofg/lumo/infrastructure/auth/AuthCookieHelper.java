package io.github.tiaggofg.lumo.infrastructure.auth;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.NewCookie;

import java.util.Locale;

@ApplicationScoped
public class AuthCookieHelper {

    public static final String ACCESS_COOKIE_NAME = "lumo_access";
    public static final String REFRESH_COOKIE_NAME = "lumo_refresh";
    public static final String OAUTH_STATE_COOKIE_NAME = "lumo_oauth_state";

    private static final String ACCESS_COOKIE_PATH = "/api";
    private static final String AUTH_COOKIE_PATH = "/api/v1/auth";

    private final AuthConfig authConfig;

    @Inject
    public AuthCookieHelper(AuthConfig authConfig) {
        this.authConfig = authConfig;
    }

    public NewCookie accessCookie(String token) {
        return buildCookie(
                ACCESS_COOKIE_NAME,
                token,
                ACCESS_COOKIE_PATH,
                (int) authConfig.accessTokenTtl().toSeconds()
        );
    }

    public NewCookie refreshCookie(String token) {
        return buildCookie(
                REFRESH_COOKIE_NAME,
                token,
                AUTH_COOKIE_PATH,
                (int) authConfig.refreshTokenTtl().toSeconds()
        );
    }

    public NewCookie oauthStateCookie(String encodedState) {
        return buildCookie(
                OAUTH_STATE_COOKIE_NAME,
                encodedState,
                AUTH_COOKIE_PATH,
                (int) authConfig.oauthStateTtl().toSeconds()
        );
    }

    public NewCookie clearAccessCookie() {
        return buildCookie(ACCESS_COOKIE_NAME, "", ACCESS_COOKIE_PATH, 0);
    }

    public NewCookie clearRefreshCookie() {
        return buildCookie(REFRESH_COOKIE_NAME, "", AUTH_COOKIE_PATH, 0);
    }

    public NewCookie clearOAuthStateCookie() {
        return buildCookie(OAUTH_STATE_COOKIE_NAME, "", AUTH_COOKIE_PATH, 0);
    }

    private NewCookie buildCookie(String name, String value, String path, int maxAgeSeconds) {
        return new NewCookie.Builder(name)
                .value(value)
                .path(path)
                .maxAge(maxAgeSeconds)
                .httpOnly(true)
                .secure(authConfig.cookieSecure())
                .sameSite(resolveSameSite())
                .build();
    }

    NewCookie.SameSite resolveSameSite() {
        String raw = authConfig.cookieSameSite();
        if (raw == null || raw.isBlank()) {
            return NewCookie.SameSite.LAX;
        }
        return switch (raw.trim().toUpperCase(Locale.ROOT)) {
            case "NONE" -> NewCookie.SameSite.NONE;
            case "STRICT" -> NewCookie.SameSite.STRICT;
            case "LAX" -> NewCookie.SameSite.LAX;
            default -> throw new IllegalStateException(
                    "Unsupported LUMO_AUTH_COOKIE_SAME_SITE value: " + raw
            );
        };
    }
}
