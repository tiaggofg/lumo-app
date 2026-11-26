package io.github.tiaggofg.lumo.infrastructure.web.error;

import jakarta.annotation.Priority;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.validation.ConstraintViolationException;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
@ApplicationScoped
@Priority(Priorities.USER - 10)
public class ConstraintViolationProblemMapper implements ExceptionMapper<ConstraintViolationException> {

    private final ProblemDetailExceptionMapper delegate;

    @Inject
    public ConstraintViolationProblemMapper(ProblemDetailExceptionMapper delegate) {
        this.delegate = delegate;
    }

    @Override
    public Response toResponse(ConstraintViolationException exception) {
        return delegate.toResponse(exception);
    }
}
