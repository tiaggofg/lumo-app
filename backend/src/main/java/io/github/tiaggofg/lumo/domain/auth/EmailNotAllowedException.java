package io.github.tiaggofg.lumo.domain.auth;

import io.github.tiaggofg.lumo.domain.shared.DomainException;

public class EmailNotAllowedException extends DomainException {

    public EmailNotAllowedException(String message) {
        super(message);
    }
}
