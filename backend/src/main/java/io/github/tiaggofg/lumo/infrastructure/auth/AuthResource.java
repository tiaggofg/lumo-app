package io.github.tiaggofg.lumo.infrastructure.auth;

import io.github.tiaggofg.lumo.application.auth.AuthConfigPort;
import io.github.tiaggofg.lumo.application.auth.AuthSessionResult;
import io.github.tiaggofg.lumo.application.auth.AuthenticateDevUserUseCase;
import io.github.tiaggofg.lumo.application.auth.AuthenticateWithGoogleUseCase;
import io.github.tiaggofg.lumo.application.auth.GetCurrentUserUseCase;
import io.github.tiaggofg.lumo.application.auth.LogoutUseCase;
import io.github.tiaggofg.lumo.application.auth.RefreshSessionUseCase;
import io.github.tiaggofg.lumo.application.auth.UserSummary;
import io.github.tiaggofg.lumo.domain.auth.AccountDisabledException;
import io.github.tiaggofg.lumo.domain.auth.EmailNotAllowedException;
import io.github.tiaggofg.lumo.domain.auth.OAuthAuthenticationException;
import io.github.tiaggofg.lumo.domain.auth.UnauthorizedException;
import io.github.tiaggofg.lumo.infrastructure.web.error.ProblemDetail;
import io.github.tiaggofg.lumo.infrastructure.web.error.ProblemDetailExceptionMapper;
import jakarta.inject.Inject;
import jakarta.ws.rs.CookieParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.logging.Logger;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Optional;

@Path("/api/v1/auth")
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Authentication", description = "Google OAuth 2.0 + PKCE and Lumo session endpoints")
public class AuthResource {

    private static final Logger LOG = Logger.getLogger(AuthResource.class);

    private final AuthConfig authConfig;
    private final AuthConfigPort authConfigPort;
    private final OAuthStateCookieCodec stateCookieCodec;
    private final AuthCookieHelper cookieHelper;
    private final AuthenticateWithGoogleUseCase authenticateWithGoogleUseCase;
    private final AuthenticateDevUserUseCase authenticateDevUserUseCase;
    private final RefreshSessionUseCase refreshSessionUseCase;
    private final LogoutUseCase logoutUseCase;
    private final GetCurrentUserUseCase getCurrentUserUseCase;
    private final AuthenticatedUserContext authenticatedUserContext;

    @Inject
    public AuthResource(
            AuthConfig authConfig,
            AuthConfigPort authConfigPort,
            OAuthStateCookieCodec stateCookieCodec,
            AuthCookieHelper cookieHelper,
            AuthenticateWithGoogleUseCase authenticateWithGoogleUseCase,
            AuthenticateDevUserUseCase authenticateDevUserUseCase,
            RefreshSessionUseCase refreshSessionUseCase,
            LogoutUseCase logoutUseCase,
            GetCurrentUserUseCase getCurrentUserUseCase,
            AuthenticatedUserContext authenticatedUserContext
    ) {
        this.authConfig = authConfig;
        this.authConfigPort = authConfigPort;
        this.stateCookieCodec = stateCookieCodec;
        this.cookieHelper = cookieHelper;
        this.authenticateWithGoogleUseCase = authenticateWithGoogleUseCase;
        this.authenticateDevUserUseCase = authenticateDevUserUseCase;
        this.refreshSessionUseCase = refreshSessionUseCase;
        this.logoutUseCase = logoutUseCase;
        this.getCurrentUserUseCase = getCurrentUserUseCase;
        this.authenticatedUserContext = authenticatedUserContext;
    }

    @GET
    @Path("/providers")
    public AuthProvidersResponse providers() {
        return new AuthProvidersResponse(
                authConfigPort.isGoogleEnabled(),
                authConfigPort.isDevLoginEnabled()
        );
    }

    @GET
    @Path("/google/login")
    public Response googleLogin(@QueryParam("returnUrl") String returnUrl) {
        if (!authConfigPort.isGoogleEnabled()) {
            LOG.warn("Google OAuth login requested while Google OAuth credentials are not configured.");
            return redirectToLoginError("provider_unavailable", false);
        }

        OAuthStateCookieCodec.OAuthStatePayload payload = stateCookieCodec.createStatePayload(returnUrl);
        String encodedState = stateCookieCodec.encode(payload);
        String codeChallenge = stateCookieCodec.computePkceS256Challenge(payload.codeVerifier());

        String authorizeUrl = authConfig.google().authUri()
                + "?client_id=" + urlEncode(authConfig.google().clientId().orElse(""))
                + "&redirect_uri=" + urlEncode(authConfig.google().redirectUri())
                + "&response_type=code"
                + "&scope=" + urlEncode("openid email profile")
                + "&code_challenge=" + urlEncode(codeChallenge)
                + "&code_challenge_method=S256"
                + "&state=" + urlEncode(payload.state())
                + "&prompt=select_account";

        return Response.status(Response.Status.FOUND)
                .location(URI.create(authorizeUrl))
                .cookie(cookieHelper.oauthStateCookie(encodedState))
                .build();
    }

    @GET
    @Path("/google/callback")
    public Response googleCallback(
            @QueryParam("code") String code,
            @QueryParam("state") String state,
            @QueryParam("error") String error,
            @CookieParam(AuthCookieHelper.OAUTH_STATE_COOKIE_NAME) String stateCookie,
            @HeaderParam("User-Agent") String userAgent
    ) {
        if (error != null && !error.isBlank()) {
            String mappedError = "access_denied".equals(error) ? "access_denied" : "oauth_failed";
            LOG.warnf("Google OAuth callback returned error=%s", mappedError);
            return redirectToLoginError(mappedError, true);
        }

        Optional<OAuthStateCookieCodec.OAuthStatePayload> payloadOpt = stateCookieCodec.decodeAndVerify(stateCookie);
        if (payloadOpt.isEmpty() || state == null || code == null || code.isBlank()) {
            LOG.warn("Google OAuth callback rejected due to missing or invalid state cookie.");
            return redirectToLoginError("invalid_state", true);
        }

        OAuthStateCookieCodec.OAuthStatePayload payload = payloadOpt.get();
        boolean stateMatches = MessageDigest.isEqual(
                payload.state().getBytes(StandardCharsets.UTF_8),
                state.getBytes(StandardCharsets.UTF_8)
        );
        if (!stateMatches) {
            LOG.warn("Google OAuth callback rejected due to state mismatch.");
            return redirectToLoginError("invalid_state", true);
        }

        try {
            AuthSessionResult session = authenticateWithGoogleUseCase.execute(
                    code,
                    payload.codeVerifier(),
                    authConfig.google().redirectUri(),
                    userAgent
            );
            LOG.infof("Google OAuth login succeeded for userId=%s", session.user().id());
            return Response.status(Response.Status.FOUND)
                    .header("Location", resolveFrontendRedirect(payload.returnUrl()))
                    .cookie(
                            cookieHelper.accessCookie(session.accessToken()),
                            cookieHelper.refreshCookie(session.refreshToken()),
                            cookieHelper.clearOAuthStateCookie()
                    )
                    .build();
        } catch (EmailNotAllowedException ignored) {
            LOG.warn("Google OAuth login rejected: email not in LUMO_ALLOWED_EMAILS.");
            return redirectToLoginError("email_not_allowed", true);
        } catch (AccountDisabledException ignored) {
            LOG.warn("Google OAuth login rejected: user account is disabled.");
            return redirectToLoginError("account_disabled", true);
        } catch (OAuthAuthenticationException ex) {
            LOG.warnf("Google OAuth login failed with reason=%s", ex.getErrorCode());
            return redirectToLoginError(ex.getErrorCode(), true);
        } catch (Exception ignored) {
            LOG.warn("Google OAuth login failed with unexpected error.");
            return redirectToLoginError("oauth_failed", true);
        }
    }

    @POST
    @Path("/dev-login")
    public Response devLogin(@HeaderParam("User-Agent") String userAgent) {
        AuthSessionResult session = authenticateDevUserUseCase.execute(userAgent);
        LOG.infof("Dev login succeeded for userId=%s", session.user().id());
        return Response.ok(session.user())
                .cookie(
                        cookieHelper.accessCookie(session.accessToken()),
                        cookieHelper.refreshCookie(session.refreshToken())
                )
                .build();
    }

    @POST
    @Path("/refresh")
    public Response refresh(
            @CookieParam(AuthCookieHelper.REFRESH_COOKIE_NAME) String refreshToken,
            @HeaderParam("User-Agent") String userAgent
    ) {
        try {
            AuthSessionResult session = refreshSessionUseCase.execute(refreshToken, userAgent);
            return Response.ok(session.user())
                    .cookie(
                            cookieHelper.accessCookie(session.accessToken()),
                            cookieHelper.refreshCookie(session.refreshToken())
                    )
                    .build();
        } catch (UnauthorizedException ex) {
            LOG.warn("Session refresh rejected due to invalid, expired or reused refresh token.");
            ProblemDetail problem = new ProblemDetail(
                    "https://lumo.local/problems/unauthorized",
                    "Unauthorized",
                    Response.Status.UNAUTHORIZED.getStatusCode(),
                    ex.getMessage(),
                    "/api/v1/auth/refresh",
                    null
            );
            return Response.status(Response.Status.UNAUTHORIZED)
                    .type(ProblemDetailExceptionMapper.PROBLEM_JSON)
                    .entity(problem)
                    .cookie(cookieHelper.clearAccessCookie(), cookieHelper.clearRefreshCookie())
                    .build();
        }
    }

    @POST
    @Path("/logout")
    public Response logout(@CookieParam(AuthCookieHelper.REFRESH_COOKIE_NAME) String refreshToken) {
        logoutUseCase.execute(refreshToken);
        LOG.info("User session logged out.");
        return Response.noContent()
                .cookie(cookieHelper.clearAccessCookie(), cookieHelper.clearRefreshCookie())
                .build();
    }

    @GET
    @Path("/me")
    public UserSummary me() {
        return getCurrentUserUseCase.execute(authenticatedUserContext.getUserId());
    }

    private Response redirectToLoginError(String errorCode, boolean clearStateCookie) {
        Response.ResponseBuilder builder = Response.status(Response.Status.FOUND)
                .header("Location", resolveFrontendRedirect("/login?error=" + urlEncode(errorCode)));
        if (clearStateCookie) {
            builder.cookie(cookieHelper.clearOAuthStateCookie());
        }
        return builder.build();
    }

    private String resolveFrontendRedirect(String relativePath) {
        String normalizedBase = stripTrailingSlashes(authConfig.frontendUrl().map(String::trim).orElse(""));
        if (normalizedBase.isEmpty()) {
            return relativePath;
        }
        boolean hasLeadingSlash = !relativePath.isEmpty() && relativePath.charAt(0) == '/';
        return hasLeadingSlash ? normalizedBase + relativePath : normalizedBase + '/' + relativePath;
    }

    private static String stripTrailingSlashes(String url) {
        int end = url.length();
        while (end > 0 && url.charAt(end - 1) == '/') {
            end--;
        }
        return url.substring(0, end);
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }

    public record AuthProvidersResponse(boolean googleEnabled, boolean devLoginEnabled) {
    }
}
