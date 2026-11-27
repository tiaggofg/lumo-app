package io.github.tiaggofg.lumo.domain.auth;

import io.github.tiaggofg.lumo.domain.shared.DomainException;

public class AccountDisabledException extends DomainException {

    public AccountDisabledException(String message) {
        super(message);
    }
}
