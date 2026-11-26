package io.github.tiaggofg.lumo.domain.shared;

public class DomainValidationException extends DomainException {

    private final String field;

    public DomainValidationException(String message) {
        super(message);
        this.field = null;
    }

    public DomainValidationException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
