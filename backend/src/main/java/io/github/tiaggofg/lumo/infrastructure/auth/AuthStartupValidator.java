package io.github.tiaggofg.lumo.infrastructure.auth;

import io.quarkus.runtime.Startup;
import io.quarkus.runtime.configuration.ConfigUtils;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Set;

@Startup
@ApplicationScoped
public class AuthStartupValidator {

    public static final int MIN_JWT_SECRET_BYTES = 32;
    private static final Set<String> SUPPORTED_SAME_SITE = Set.of("LAX", "NONE", "STRICT");

    private final AuthConfig authConfig;

    @Inject
    public AuthStartupValidator(AuthConfig authConfig) {
        this.authConfig = authConfig;
    }

    @PostConstruct
    void onStart() {
        validate(ConfigUtils.getProfiles().contains("prod"));
    }

    public void validate(boolean isProdProfile) {
        String secret = authConfig.jwtSecret().orElse("").trim();
        if (isProdProfile && secret.getBytes(StandardCharsets.UTF_8).length < MIN_JWT_SECRET_BYTES) {
            throw new IllegalStateException(
                    "LUMO_AUTH_JWT_SECRET must be configured with at least "
                            + MIN_JWT_SECRET_BYTES
                            + " characters in prod profile."
            );
        }

        validateCookieSameSite();
        validateFrontendUrl();
    }

    private void validateCookieSameSite() {
        String raw = authConfig.cookieSameSite();
        String normalized = raw == null ? "" : raw.trim().toUpperCase(Locale.ROOT);
        if (!SUPPORTED_SAME_SITE.contains(normalized)) {
            throw new IllegalStateException(
                    "LUMO_AUTH_COOKIE_SAME_SITE must be one of LAX, NONE, or STRICT (was: '" + raw + "')."
            );
        }
        if ("NONE".equals(normalized) && !authConfig.cookieSecure()) {
            throw new IllegalStateException(
                    "LUMO_AUTH_COOKIE_SAME_SITE=NONE requires lumo.auth.cookie-secure=true."
            );
        }
    }

    private void validateFrontendUrl() {
        String frontendUrl = authConfig.frontendUrl().map(String::trim).orElse("");
        if (frontendUrl.isEmpty()) {
            return;
        }
        URI uri;
        try {
            uri = URI.create(frontendUrl);
        } catch (IllegalArgumentException ex) {
            throw new IllegalStateException(
                    "LUMO_FRONTEND_URL must be a valid http:// or https:// URL (was: '" + frontendUrl + "').",
                    ex
            );
        }
        String scheme = uri.getScheme();
        boolean validScheme = "http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme);
        if (!validScheme || uri.getHost() == null || uri.getHost().isBlank()) {
            throw new IllegalStateException(
                    "LUMO_FRONTEND_URL must start with http:// or https:// and include a valid host (was: '"
                            + frontendUrl
                            + "')."
            );
        }
    }
}
