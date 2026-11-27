package io.github.tiaggofg.lumo.infrastructure.auth;

import io.quarkus.runtime.Startup;
import io.quarkus.runtime.configuration.ConfigUtils;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.nio.charset.StandardCharsets;

@Startup
@ApplicationScoped
public class AuthStartupValidator {

    public static final int MIN_JWT_SECRET_BYTES = 32;

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
    }
}
