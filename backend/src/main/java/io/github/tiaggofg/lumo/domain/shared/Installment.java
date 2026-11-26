package io.github.tiaggofg.lumo.domain.shared;

import io.github.tiaggofg.lumo.domain.stereotype.ValueObject;

public record Installment(int current, int total) implements ValueObject {

    public Installment {
        if (total < 2) {
            throw new DomainValidationException("totalInstallments", "Total installments must be at least 2.");
        }
        if (current < 1 || current > total) {
            throw new DomainValidationException("installment", "Current installment must be between 1 and " + total + ".");
        }
    }

    public static Installment of(int current, int total) {
        return new Installment(current, total);
    }

    public String formatted() {
        return current + "/" + total;
    }
}
