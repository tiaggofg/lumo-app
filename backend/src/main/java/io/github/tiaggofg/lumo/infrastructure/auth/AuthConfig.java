package io.github.tiaggofg.lumo.infrastructure.auth;

import io.smallrye.config.ConfigMapping;
import io.smallrye.config.WithDefault;

import java.time.Duration;
import java.util.Optional;

@ConfigMapping(prefix = "lumo.auth")
public interface AuthConfig {

    Optional<String> jwtSecret();

    @WithDefault("PT15M")
    Duration accessTokenTtl();

    @WithDefault("P30D")
    Duration refreshTokenTtl();

    @WithDefault("PT5M")
    Duration oauthStateTtl();

    @WithDefault("true")
    boolean cookieSecure();

    @WithDefault("LAX")
    String cookieSameSite();

    Optional<String> frontendUrl();

    Optional<String> allowedEmails();

    DevLoginConfig devLogin();

    GoogleConfig google();

    interface DevLoginConfig {
        @WithDefault("false")
        boolean enabled();
    }

    interface GoogleConfig {
        Optional<String> clientId();

        Optional<String> clientSecret();

        @WithDefault("http://localhost:4200/api/v1/auth/google/callback")
        String redirectUri();

        @WithDefault("https://accounts.google.com/o/oauth2/v2/auth")
        String authUri();

        @WithDefault("https://oauth2.googleapis.com/token")
        String tokenUri();

        @WithDefault("https://www.googleapis.com/oauth2/v3/certs")
        String jwksUri();

        @WithDefault("10")
        int httpTimeoutSeconds();
    }
}
