package io.github.tiaggofg.lumo.infrastructure.web.error;

import io.github.tiaggofg.lumo.domain.shared.BusinessRuleViolationException;
import io.github.tiaggofg.lumo.domain.shared.DomainValidationException;
import io.github.tiaggofg.lumo.domain.shared.ResourceConflictException;
import io.github.tiaggofg.lumo.domain.shared.ResourceNotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import org.jboss.logging.Logger;

import java.sql.SQLException;
import java.util.List;

@Provider
@ApplicationScoped
public class ProblemDetailExceptionMapper implements ExceptionMapper<Throwable> {

    public static final String PROBLEM_JSON = "application/problem+json";
    private static final Logger LOG = Logger.getLogger(ProblemDetailExceptionMapper.class);

    @Context
    UriInfo uriInfo;

    @Override
    public Response toResponse(Throwable exception) {
        String instance = resolveInstance();

        if (exception instanceof DomainValidationException validationEx) {
            List<ProblemDetail.FieldError> fieldErrors = validationEx.getField() != null
                    ? List.of(new ProblemDetail.FieldError(validationEx.getField(), validationEx.getMessage()))
                    : null;
            return buildResponse(
                    Response.Status.BAD_REQUEST.getStatusCode(),
                    "https://lumo.local/problems/validation-error",
                    "Validation Error",
                    validationEx.getMessage(),
                    instance,
                    fieldErrors
            );
        }

        if (exception instanceof ConstraintViolationException cve) {
            List<ProblemDetail.FieldError> fieldErrors = cve.getConstraintViolations().stream()
                    .map(this::toFieldError)
                    .toList();
            return buildResponse(
                    Response.Status.BAD_REQUEST.getStatusCode(),
                    "https://lumo.local/problems/validation-error",
                    "Validation Error",
                    "One or more fields failed validation.",
                    instance,
                    fieldErrors
            );
        }

        if (exception instanceof ResourceNotFoundException notFoundEx) {
            return buildResponse(
                    Response.Status.NOT_FOUND.getStatusCode(),
                    "https://lumo.local/problems/not-found",
                    "Resource Not Found",
                    notFoundEx.getMessage(),
                    instance,
                    null
            );
        }

        if (exception instanceof ResourceConflictException conflictEx) {
            return buildResponse(
                    Response.Status.CONFLICT.getStatusCode(),
                    "https://lumo.local/problems/resource-conflict",
                    "Resource Conflict",
                    conflictEx.getMessage(),
                    instance,
                    null
            );
        }

        if (exception instanceof BusinessRuleViolationException ruleEx) {
            return buildResponse(
                    422,
                    "https://lumo.local/problems/business-rule-violation",
                    "Business Rule Violation",
                    ruleEx.getMessage(),
                    instance,
                    null
            );
        }

        SQLException sqlException = findSqlException(exception);
        if (sqlException != null && ("23505".equals(sqlException.getSQLState()) || "23503".equals(sqlException.getSQLState()))) {
            String detail = "23505".equals(sqlException.getSQLState())
                    ? "A resource with the same unique key already exists."
                    : "The operation conflicts with existing related records.";
            return buildResponse(
                    Response.Status.CONFLICT.getStatusCode(),
                    "https://lumo.local/problems/resource-conflict",
                    "Resource Conflict",
                    detail,
                    instance,
                    null
            );
        }

        if (exception instanceof WebApplicationException webEx) {
            int status = webEx.getResponse() != null ? webEx.getResponse().getStatus() : 500;
            String title = status >= 400 && status < 500 ? "Client Error" : "Internal Server Error";
            String type = status == 404
                    ? "https://lumo.local/problems/not-found"
                    : "https://lumo.local/problems/http-" + status;
            return buildResponse(
                    status,
                    type,
                    title,
                    webEx.getMessage() != null ? webEx.getMessage() : title,
                    instance,
                    null
            );
        }

        LOG.errorf(exception, "Unhandled exception at %s", instance);
        return buildResponse(
                Response.Status.INTERNAL_SERVER_ERROR.getStatusCode(),
                "https://lumo.local/problems/internal-error",
                "Internal Server Error",
                "An unexpected error occurred.",
                instance,
                null
        );
    }

    private ProblemDetail.FieldError toFieldError(ConstraintViolation<?> violation) {
        String path = violation.getPropertyPath() != null ? violation.getPropertyPath().toString() : "";
        int lastDot = path.lastIndexOf('.');
        String field = lastDot >= 0 ? path.substring(lastDot + 1) : path;
        return new ProblemDetail.FieldError(field, violation.getMessage());
    }

    private SQLException findSqlException(Throwable throwable) {
        Throwable current = throwable;
        while (current != null) {
            if (current instanceof SQLException sqlEx) {
                return sqlEx;
            }
            current = current.getCause();
        }
        return null;
    }

    private String resolveInstance() {
        if (uriInfo == null) {
            return "";
        }
        String path = uriInfo.getPath();
        if (path == null) {
            return "";
        }
        return path.startsWith("/") ? path : "/" + path;
    }

    private Response buildResponse(
            int status,
            String type,
            String title,
            String detail,
            String instance,
            List<ProblemDetail.FieldError> errors
    ) {
        ProblemDetail body = new ProblemDetail(type, title, status, detail, instance, errors);
        return Response.status(status)
                .type(PROBLEM_JSON)
                .entity(body)
                .build();
    }
}
