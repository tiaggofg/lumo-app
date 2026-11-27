package io.github.tiaggofg.lumo.application.auth;

import java.time.Duration;

public interface AuthConfigPort {

    boolean isGoogleEnabled();

    boolean isDevLoginEnabled();

    boolean isEmailAllowed(String email);

    Duration accessTokenTtl();

    Duration refreshTokenTtl();
}
