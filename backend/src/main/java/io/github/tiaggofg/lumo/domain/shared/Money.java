package io.github.tiaggofg.lumo.domain.shared;

import io.github.tiaggofg.lumo.domain.stereotype.ValueObject;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;

public record Money(BigDecimal amount, String currency) implements ValueObject {

    public static final String BRL = "BRL";
    public static final int SCALE = 2;

    public Money {
        Objects.requireNonNull(amount, "amount must not be null");
        amount = amount.setScale(SCALE, RoundingMode.HALF_UP);
        currency = currency == null || currency.isBlank() ? BRL : currency.trim().toUpperCase();
        if (!BRL.equals(currency)) {
            throw new DomainValidationException("currency", "Only BRL currency is supported.");
        }
    }

    public static Money positive(BigDecimal value) {
        if (value == null || value.compareTo(BigDecimal.ZERO) <= 0) {
            throw new DomainValidationException("amount", "Amount must be greater than zero.");
        }
        return new Money(value, BRL);
    }

    public static Money of(BigDecimal value) {
        if (value == null) {
            throw new DomainValidationException("amount", "Amount must not be null.");
        }
        return new Money(value, BRL);
    }

    public static Money zero() {
        return new Money(BigDecimal.ZERO, BRL);
    }

    public Money add(Money other) {
        Objects.requireNonNull(other, "other must not be null");
        return new Money(this.amount.add(other.amount), BRL);
    }

    public Money subtract(Money other) {
        Objects.requireNonNull(other, "other must not be null");
        return new Money(this.amount.subtract(other.amount), BRL);
    }
}
