package io.github.tiaggofg.lumo.infrastructure.web.error;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ProblemDetail(
        String type,
        String title,
        int status,
        String detail,
        String instance,
        List<FieldError> errors
) {
    public ProblemDetail(String type, String title, int status, String detail, String instance) {
        this(type, title, status, detail, instance, null);
    }

    public record FieldError(String field, String message) {
    }
}
