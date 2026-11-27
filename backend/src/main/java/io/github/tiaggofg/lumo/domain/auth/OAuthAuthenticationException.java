package io.github.tiaggofg.lumo.domain.auth;

import io.github.tiaggofg.lumo.domain.shared.DomainException;

public class OAuthAuthenticationException extends DomainException {

    private final String errorCode;

    public OAuthAuthenticationException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public OAuthAuthenticationException(String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
