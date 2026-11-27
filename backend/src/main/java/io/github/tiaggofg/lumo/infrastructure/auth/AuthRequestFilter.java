package io.github.tiaggofg.lumo.infrastructure.auth;

import io.github.tiaggofg.lumo.application.auth.AccessTokenClaims;
import io.github.tiaggofg.lumo.application.auth.GetCurrentUserUseCase;
import io.github.tiaggofg.lumo.application.auth.TokenServicePort;
import io.github.tiaggofg.lumo.application.auth.UserSummary;
import io.github.tiaggofg.lumo.domain.auth.UnauthorizedException;
import io.github.tiaggofg.lumo.infrastructure.web.error.ProblemDetail;
import io.github.tiaggofg.lumo.infrastructure.web.error.ProblemDetailExceptionMapper;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Cookie;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;

import java.util.Optional;
import java.util.Set;

@Provider
@Priority(Priorities.AUTHENTICATION)
public class AuthRequestFilter implements ContainerRequestFilter {

    private static final Set<String> PUBLIC_API_PATHS = Set.of(
            "/api/v1/auth/providers",
            "/api/v1/auth/google/login",
            "/api/v1/auth/google/callback",
            "/api/v1/auth/refresh",
            "/api/v1/auth/logout",
            "/api/v1/auth/dev-login"
    );

    private final TokenServicePort tokenService;
    private final GetCurrentUserUseCase getCurrentUserUseCase;
    private final AuthenticatedUserContext authenticatedUserContext;

    @Inject
    public AuthRequestFilter(
            TokenServicePort tokenService,
            GetCurrentUserUseCase getCurrentUserUseCase,
            AuthenticatedUserContext authenticatedUserContext
    ) {
        this.tokenService = tokenService;
        this.getCurrentUserUseCase = getCurrentUserUseCase;
        this.authenticatedUserContext = authenticatedUserContext;
    }

    @Override
    public void filter(ContainerRequestContext requestContext) {
        if ("OPTIONS".equalsIgnoreCase(requestContext.getMethod())) {
            return;
        }

        String path = normalizePath(requestContext.getUriInfo().getPath());
        if (!path.startsWith("/api/v1/") || PUBLIC_API_PATHS.contains(path)) {
            return;
        }

        Cookie accessCookie = requestContext.getCookies().get(AuthCookieHelper.ACCESS_COOKIE_NAME);
        if (accessCookie == null || accessCookie.getValue() == null || accessCookie.getValue().isBlank()) {
            abortUnauthorized(requestContext, path, "Authentication cookie is missing.");
            return;
        }

        Optional<AccessTokenClaims> claimsOpt = tokenService.verifyAccessToken(accessCookie.getValue());
        if (claimsOpt.isEmpty()) {
            abortUnauthorized(requestContext, path, "Authentication token is invalid or expired.");
            return;
        }

        try {
            UserSummary user = getCurrentUserUseCase.execute(claimsOpt.get().userId());
            authenticatedUserContext.setUser(user.id(), user.email());
        } catch (UnauthorizedException ignored) {
            abortUnauthorized(requestContext, path, "Authenticated user is inactive or unavailable.");
        }
    }

    private void abortUnauthorized(ContainerRequestContext requestContext, String path, String detail) {
        ProblemDetail problem = new ProblemDetail(
                "https://lumo.local/problems/unauthorized",
                "Unauthorized",
                Response.Status.UNAUTHORIZED.getStatusCode(),
                detail,
                path,
                null
        );
        requestContext.abortWith(
                Response.status(Response.Status.UNAUTHORIZED)
                        .type(ProblemDetailExceptionMapper.PROBLEM_JSON)
                        .entity(problem)
                        .build()
        );
    }

    private String normalizePath(String rawPath) {
        if (rawPath == null || rawPath.isBlank()) {
            return "/";
        }
        String normalized = rawPath.startsWith("/") ? rawPath : "/" + rawPath;
        if (normalized.length() > 1 && normalized.endsWith("/")) {
            return normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }
}
