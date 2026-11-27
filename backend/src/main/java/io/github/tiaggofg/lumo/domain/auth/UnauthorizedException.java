package io.github.tiaggofg.lumo.domain.auth;

import io.github.tiaggofg.lumo.domain.shared.DomainException;

public class UnauthorizedException extends DomainException {

    public UnauthorizedException(String message) {
        super(message);
    }
}
