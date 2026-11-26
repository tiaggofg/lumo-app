package io.github.tiaggofg.lumo.domain.shared;

import io.github.tiaggofg.lumo.domain.stereotype.ValueObject;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.Objects;
import java.util.regex.Pattern;

public record CompetenceMonth(YearMonth value) implements ValueObject, Comparable<CompetenceMonth> {

    private static final String FIELD_COMPETENCE_MONTH = "competenceMonth";
    private static final Pattern ISO_YEAR_MONTH = Pattern.compile("^\\d{4}-(0[1-9]|1[0-2])$");

    public CompetenceMonth {
        if (value == null) {
            throw new DomainValidationException(FIELD_COMPETENCE_MONTH, "Competence month is required.");
        }
    }

    public static CompetenceMonth of(int year, int month) {
        try {
            return new CompetenceMonth(YearMonth.of(year, month));
        } catch (RuntimeException ex) {
            throw new DomainValidationException(FIELD_COMPETENCE_MONTH, "Invalid competence month: " + year + "-" + month);
        }
    }

    public static CompetenceMonth of(YearMonth yearMonth) {
        return new CompetenceMonth(yearMonth);
    }

    public static CompetenceMonth parse(String raw) {
        if (raw == null || !ISO_YEAR_MONTH.matcher(raw.trim()).matches()) {
            throw new DomainValidationException(FIELD_COMPETENCE_MONTH, "Competence month must follow YYYY-MM format.");
        }
        try {
            return new CompetenceMonth(YearMonth.parse(raw.trim()));
        } catch (DateTimeParseException ex) {
            throw new DomainValidationException(FIELD_COMPETENCE_MONTH, "Invalid competence month: " + raw);
        }
    }

    public LocalDate clampDay(int dueDay) {
        if (dueDay < 1 || dueDay > 31) {
            throw new DomainValidationException("dueDay", "Due day must be between 1 and 31.");
        }
        int clamped = Math.min(dueDay, value.lengthOfMonth());
        return value.atDay(clamped);
    }

    public long monthsUntil(CompetenceMonth other) {
        Objects.requireNonNull(other, "other must not be null");
        return ChronoUnit.MONTHS.between(this.value, other.value);
    }

    public CompetenceMonth plusMonths(long months) {
        return new CompetenceMonth(this.value.plusMonths(months));
    }

    public boolean isBefore(CompetenceMonth other) {
        return this.value.isBefore(other.value);
    }

    public boolean isAfter(CompetenceMonth other) {
        return this.value.isAfter(other.value);
    }

    public String toIsoString() {
        return value.toString();
    }

    @Override
    public int compareTo(CompetenceMonth other) {
        return this.value.compareTo(other.value);
    }

    @Override
    public String toString() {
        return toIsoString();
    }
}
