package io.github.tiaggofg.lumo.infrastructure.auth;

import io.github.tiaggofg.lumo.application.auth.AuthConfigPort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.Duration;
import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@ApplicationScoped
public class AuthConfigAdapter implements AuthConfigPort {

    private final AuthConfig authConfig;

    @Inject
    public AuthConfigAdapter(AuthConfig authConfig) {
        this.authConfig = authConfig;
    }

    @Override
    public boolean isGoogleEnabled() {
        String clientId = authConfig.google().clientId().orElse("").trim();
        String clientSecret = authConfig.google().clientSecret().orElse("").trim();
        return !clientId.isEmpty() && !clientSecret.isEmpty();
    }

    @Override
    public boolean isDevLoginEnabled() {
        return authConfig.devLogin().enabled();
    }

    @Override
    public boolean isEmailAllowed(String email) {
        String rawAllowlist = authConfig.allowedEmails().orElse("").trim();
        if (rawAllowlist.isEmpty()) {
            return true;
        }
        if (email == null || email.isBlank()) {
            return false;
        }
        Set<String> allowed = Arrays.stream(rawAllowlist.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(s -> s.toLowerCase(Locale.ROOT))
                .collect(Collectors.toSet());
        if (allowed.isEmpty()) {
            return true;
        }
        return allowed.contains(email.trim().toLowerCase(Locale.ROOT));
    }

    @Override
    public Duration accessTokenTtl() {
        return authConfig.accessTokenTtl();
    }

    @Override
    public Duration refreshTokenTtl() {
        return authConfig.refreshTokenTtl();
    }
}
