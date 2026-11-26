package io.github.tiaggofg.lumo.domain.shared;

public class ResourceNotFoundException extends DomainException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
