package io.github.tiaggofg.lumo.infrastructure.web.error;

import io.github.tiaggofg.lumo.domain.shared.BusinessRuleViolationException;
import io.github.tiaggofg.lumo.domain.shared.DomainValidationException;
import io.github.tiaggofg.lumo.domain.shared.ResourceConflictException;
import io.github.tiaggofg.lumo.domain.shared.ResourceNotFoundException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Path;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.sql.SQLException;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ProblemDetailExceptionMapperTest {

    private ProblemDetailExceptionMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new ProblemDetailExceptionMapper();
        UriInfo uriInfo = mock(UriInfo.class);
        when(uriInfo.getPath()).thenReturn("/api/v1/budgets");
        mapper.uriInfo = uriInfo;
    }

    @Test
    void shouldMapDomainValidationExceptionTo400WithFieldError() {
        Response response = mapper.toResponse(new DomainValidationException("amount", "must be greater than 0"));

        assertThat(response.getStatus()).isEqualTo(400);
        assertThat(response.getMediaType().toString()).isEqualTo(ProblemDetailExceptionMapper.PROBLEM_JSON);
        ProblemDetail body = (ProblemDetail) response.getEntity();
        assertThat(body.type()).isEqualTo("https://lumo.local/problems/validation-error");
        assertThat(body.status()).isEqualTo(400);
        assertThat(body.instance()).isEqualTo("/api/v1/budgets");
        assertThat(body.errors()).containsExactly(new ProblemDetail.FieldError("amount", "must be greater than 0"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void shouldMapConstraintViolationExceptionTo400() {
        ConstraintViolation<Object> violation = mock(ConstraintViolation.class);
        Path path = mock(Path.class);
        when(path.toString()).thenReturn("create.request.name");
        when(violation.getPropertyPath()).thenReturn(path);
        when(violation.getMessage()).thenReturn("must not be blank");

        Response response = mapper.toResponse(new ConstraintViolationException(Set.of(violation)));

        assertThat(response.getStatus()).isEqualTo(400);
        ProblemDetail body = (ProblemDetail) response.getEntity();
        assertThat(body.errors()).containsExactly(new ProblemDetail.FieldError("name", "must not be blank"));
    }

    @Test
    void shouldMapResourceNotFoundExceptionTo404() {
        Response response = mapper.toResponse(new ResourceNotFoundException("Budget not found"));

        assertThat(response.getStatus()).isEqualTo(404);
        ProblemDetail body = (ProblemDetail) response.getEntity();
        assertThat(body.type()).isEqualTo("https://lumo.local/problems/not-found");
        assertThat(body.detail()).isEqualTo("Budget not found");
        assertThat(body.errors()).isNull();
    }

    @Test
    void shouldMapResourceConflictExceptionTo409() {
        Response response = mapper.toResponse(new ResourceConflictException("Budget already exists for 2026-11"));

        assertThat(response.getStatus()).isEqualTo(409);
        ProblemDetail body = (ProblemDetail) response.getEntity();
        assertThat(body.type()).isEqualTo("https://lumo.local/problems/resource-conflict");
        assertThat(body.detail()).isEqualTo("Budget already exists for 2026-11");
    }

    @Test
    void shouldMapPostgresUniqueViolationSqlState23505To409() {
        SQLException sqlEx = new SQLException("duplicate key value violates unique constraint", "23505");
        RuntimeException wrapped = new RuntimeException("DB error", sqlEx);

        Response response = mapper.toResponse(wrapped);

        assertThat(response.getStatus()).isEqualTo(409);
        ProblemDetail body = (ProblemDetail) response.getEntity();
        assertThat(body.type()).isEqualTo("https://lumo.local/problems/resource-conflict");
    }

    @Test
    void shouldMapBusinessRuleViolationExceptionTo422() {
        Response response = mapper.toResponse(new BusinessRuleViolationException("Category is inactive"));

        assertThat(response.getStatus()).isEqualTo(422);
        ProblemDetail body = (ProblemDetail) response.getEntity();
        assertThat(body.type()).isEqualTo("https://lumo.local/problems/business-rule-violation");
        assertThat(body.detail()).isEqualTo("Category is inactive");
    }

    @Test
    void shouldMapUnexpectedExceptionTo500WithoutLeakingInternalDetails() {
        Response response = mapper.toResponse(new IllegalStateException("sensitive internal stack info"));

        assertThat(response.getStatus()).isEqualTo(500);
        ProblemDetail body = (ProblemDetail) response.getEntity();
        assertThat(body.type()).isEqualTo("https://lumo.local/problems/internal-error");
        assertThat(body.detail()).isEqualTo("An unexpected error occurred.");
    }
}
