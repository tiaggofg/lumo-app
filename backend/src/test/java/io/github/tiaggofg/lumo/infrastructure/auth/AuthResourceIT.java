package io.github.tiaggofg.lumo.infrastructure.auth;

import io.github.tiaggofg.lumo.application.auth.GoogleUserInfo;
import io.github.tiaggofg.lumo.domain.auth.OAuthAuthenticationException;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.QuarkusTestProfile;
import io.quarkus.test.junit.TestProfile;
import io.restassured.response.Response;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.equalTo;

@QuarkusTest
@TestProfile(AuthResourceIT.GoogleEnabledProfile.class)
class AuthResourceIT {

    public static class GoogleEnabledProfile implements QuarkusTestProfile {
        @Override
        public Map<String, String> getConfigOverrides() {
            return Map.of(
                    "lumo.auth.google.client-id", "test-google-client-id",
                    "lumo.auth.google.client-secret", "test-google-client-secret",
                    "lumo.auth.google.redirect-uri", "http://localhost:4200/api/v1/auth/google/callback"
            );
        }
    }

    @Inject
    StubGoogleOAuthClient stubGoogleOAuthClient;

    @Inject
    EntityManager entityManager;

    @BeforeEach
    @Transactional
    void setUp() {
        stubGoogleOAuthClient.reset();
        entityManager.createNativeQuery("DELETE FROM refresh_sessions").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM users").executeUpdate();
    }

    @Test
    void shouldExposeProvidersAndCompleteGoogleOAuthLoginAndCallbackFlow() {
        given()
                .when()
                .get("/api/v1/auth/providers")
                .then()
                .statusCode(200)
                .body("googleEnabled", equalTo(true))
                .body("devLoginEnabled", equalTo(true));

        Response loginResponse = given()
                .redirects().follow(false)
                .queryParam("returnUrl", "/budgets")
                .when()
                .get("/api/v1/auth/google/login")
                .then()
                .statusCode(302)
                .extract().response();

        String location = loginResponse.getHeader("Location");
        assertThat(location)
                .startsWith("https://accounts.google.com/o/oauth2/v2/auth")
                .contains("code_challenge_method=S256")
                .contains("client_id=test-google-client-id")
                .contains("scope=openid+email+profile");

        String stateCookie = loginResponse.getCookie(AuthCookieHelper.OAUTH_STATE_COOKIE_NAME);
        assertThat(stateCookie).isNotBlank();
        String stateParam = extractQueryParam(location, "state");
        assertThat(stateParam).isNotBlank();

        Response callbackResponse = given()
                .redirects().follow(false)
                .cookie(AuthCookieHelper.OAUTH_STATE_COOKIE_NAME, stateCookie)
                .queryParam("code", "valid-auth-code")
                .queryParam("state", stateParam)
                .when()
                .get("/api/v1/auth/google/callback")
                .then()
                .statusCode(302)
                .extract().response();

        assertThat(callbackResponse.getHeader("Location")).endsWith("/budgets");
        String accessCookie = callbackResponse.getCookie(AuthCookieHelper.ACCESS_COOKIE_NAME);
        String refreshCookie = callbackResponse.getCookie(AuthCookieHelper.REFRESH_COOKIE_NAME);
        assertThat(accessCookie).isNotBlank();
        assertThat(refreshCookie).isNotBlank();

        // /me with issued access cookie
        given()
                .cookie(AuthCookieHelper.ACCESS_COOKIE_NAME, accessCookie)
                .when()
                .get("/api/v1/auth/me")
                .then()
                .statusCode(200)
                .body("email", equalTo("google-user@example.com"))
                .body("name", equalTo("Google Test User"));
    }

    @Test
    void shouldRedirectToLoginWithErrorOnDeniedInvalidStateOrProviderError() {
        // User denied access
        Response denied = given()
                .redirects().follow(false)
                .queryParam("error", "access_denied")
                .when()
                .get("/api/v1/auth/google/callback")
                .then()
                .statusCode(302)
                .extract().response();
        assertThat(denied.getHeader("Location")).endsWith("/login?error=access_denied");

        // Missing/mismatched state
        Response invalidState = given()
                .redirects().follow(false)
                .queryParam("code", "abc")
                .queryParam("state", "wrong-state")
                .when()
                .get("/api/v1/auth/google/callback")
                .then()
                .statusCode(302)
                .extract().response();
        assertThat(invalidState.getHeader("Location")).endsWith("/login?error=invalid_state");

        // Unverified email -> oauth_failed
        Response loginResponse = given()
                .redirects().follow(false)
                .get("/api/v1/auth/google/login")
                .then().statusCode(302).extract().response();
        String stateCookie = loginResponse.getCookie(AuthCookieHelper.OAUTH_STATE_COOKIE_NAME);
        String stateParam = extractQueryParam(loginResponse.getHeader("Location"), "state");

        stubGoogleOAuthClient.setHandler(() -> new GoogleUserInfo("sub-u", "unverified@example.com", false, "U", null));
        Response unverified = given()
                .redirects().follow(false)
                .cookie(AuthCookieHelper.OAUTH_STATE_COOKIE_NAME, stateCookie)
                .queryParam("code", "abc")
                .queryParam("state", stateParam)
                .get("/api/v1/auth/google/callback")
                .then().statusCode(302).extract().response();
        assertThat(unverified.getHeader("Location")).endsWith("/login?error=oauth_failed");

        // Provider unavailable
        stubGoogleOAuthClient.setHandler(() -> {
            throw new OAuthAuthenticationException("provider_unavailable", "timeout");
        });
        Response unavailable = given()
                .redirects().follow(false)
                .cookie(AuthCookieHelper.OAUTH_STATE_COOKIE_NAME, stateCookie)
                .queryParam("code", "abc")
                .queryParam("state", stateParam)
                .get("/api/v1/auth/google/callback")
                .then().statusCode(302).extract().response();
        assertThat(unavailable.getHeader("Location")).endsWith("/login?error=provider_unavailable");

        // Email not allowed & Account disabled redirects
        stubGoogleOAuthClient.setHandler(() -> {
            throw new io.github.tiaggofg.lumo.domain.auth.EmailNotAllowedException("blocked");
        });
        Response notAllowed = given()
                .redirects().follow(false)
                .cookie(AuthCookieHelper.OAUTH_STATE_COOKIE_NAME, stateCookie)
                .queryParam("code", "abc")
                .queryParam("state", stateParam)
                .get("/api/v1/auth/google/callback")
                .then().statusCode(302).extract().response();
        assertThat(notAllowed.getHeader("Location")).endsWith("/login?error=email_not_allowed");

        stubGoogleOAuthClient.setHandler(() -> {
            throw new io.github.tiaggofg.lumo.domain.auth.AccountDisabledException("disabled");
        });
        Response disabled = given()
                .redirects().follow(false)
                .cookie(AuthCookieHelper.OAUTH_STATE_COOKIE_NAME, stateCookie)
                .queryParam("code", "abc")
                .queryParam("state", stateParam)
                .get("/api/v1/auth/google/callback")
                .then().statusCode(302).extract().response();
        assertThat(disabled.getHeader("Location")).endsWith("/login?error=account_disabled");
    }

    @Test
    void shouldRotateRefreshTokenRejectReuseAndRevokeOnLogout() {
        Response login = given()
                .when()
                .post("/api/v1/auth/dev-login")
                .then()
                .statusCode(200)
                .body("email", equalTo("dev@lumo.local"))
                .extract().response();

        String refresh1 = login.getCookie(AuthCookieHelper.REFRESH_COOKIE_NAME);
        assertThat(refresh1).isNotBlank();

        // Rotate refresh token
        Response refreshResp = given()
                .cookie(AuthCookieHelper.REFRESH_COOKIE_NAME, refresh1)
                .when()
                .post("/api/v1/auth/refresh")
                .then()
                .statusCode(200)
                .body("email", equalTo("dev@lumo.local"))
                .extract().response();

        String refresh2 = refreshResp.getCookie(AuthCookieHelper.REFRESH_COOKIE_NAME);
        assertThat(refresh2).isNotBlank().isNotEqualTo(refresh1);

        // Reusing old refresh1 -> 401 RFC 9457
        given()
                .cookie(AuthCookieHelper.REFRESH_COOKIE_NAME, refresh1)
                .when()
                .post("/api/v1/auth/refresh")
                .then()
                .statusCode(401)
                .contentType("application/problem+json")
                .body("status", equalTo(401));

        // Logout revokes refresh2 -> 204
        given()
                .cookie(AuthCookieHelper.REFRESH_COOKIE_NAME, refresh2)
                .when()
                .post("/api/v1/auth/logout")
                .then()
                .statusCode(204);

        // Refresh after logout -> 401 RFC 9457
        given()
                .cookie(AuthCookieHelper.REFRESH_COOKIE_NAME, refresh2)
                .when()
                .post("/api/v1/auth/refresh")
                .then()
                .statusCode(401)
                .contentType("application/problem+json");
    }

    private String extractQueryParam(String url, String key) {
        String query = URI.create(url).getRawQuery();
        for (String pair : query.split("&")) {
            String[] kv = pair.split("=", 2);
            if (kv.length == 2 && kv[0].equals(key)) {
                return URLDecoder.decode(kv[1], StandardCharsets.UTF_8);
            }
        }
        return null;
    }
}
