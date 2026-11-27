package io.github.tiaggofg.lumo.domain.auth;

import io.github.tiaggofg.lumo.domain.shared.DomainException;

public class DevLoginDisabledException extends DomainException {

    public DevLoginDisabledException() {
        super("Development login is disabled in this environment.");
    }
}
