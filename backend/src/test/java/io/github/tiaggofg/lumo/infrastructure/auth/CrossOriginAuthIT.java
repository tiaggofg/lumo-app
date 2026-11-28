package io.github.tiaggofg.lumo.infrastructure.auth;

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
import java.util.List;
import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.assertj.core.api.Assertions.assertThat;

@QuarkusTest
@TestProfile(CrossOriginAuthIT.CrossOriginProfile.class)
class CrossOriginAuthIT {

    public static class CrossOriginProfile implements QuarkusTestProfile {
        @Override
        public Map<String, String> getConfigOverrides() {
            return Map.of(
                    "quarkus.http.cors.origins", "https://lumo.example.com",
                    "lumo.auth.frontend-url", "https://lumo.example.com/",
                    "lumo.auth.cookie-secure", "true",
                    "lumo.auth.cookie-same-site", "NONE",
                    "lumo.auth.google.client-id", "test-google-client-id",
                    "lumo.auth.google.client-secret", "test-google-client-secret",
                    "lumo.auth.google.redirect-uri", "https://api.lumo.example.com/api/v1/auth/google/callback"
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
    void shouldRedirectToNormalizedFrontendUrlAndSetSameSiteNoneCookiesOnOAuthSuccess() {
        Response loginResponse = given()
                .redirects().follow(false)
                .queryParam("returnUrl", "/dashboard")
                .when()
                .get("/api/v1/auth/google/login")
                .then()
                .statusCode(302)
                .extract().response();

        List<String> loginSetCookies = loginResponse.getHeaders().getValues("Set-Cookie");
        assertThat(loginSetCookies)
                .anySatisfy(header -> assertThat(header)
                        .contains(AuthCookieHelper.OAUTH_STATE_COOKIE_NAME + "=")
                        .containsIgnoringCase("SameSite=None")
                        .containsIgnoringCase("Secure"));

        String stateCookie = loginResponse.getCookie(AuthCookieHelper.OAUTH_STATE_COOKIE_NAME);
        String stateParam = extractQueryParam(loginResponse.getHeader("Location"), "state");

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

        assertThat(callbackResponse.getHeader("Location"))
                .isEqualTo("https://lumo.example.com/dashboard");

        List<String> callbackSetCookies = callbackResponse.getHeaders().getValues("Set-Cookie");
        assertThat(callbackSetCookies)
                .anySatisfy(header -> assertThat(header)
                        .contains(AuthCookieHelper.ACCESS_COOKIE_NAME + "=")
                        .containsIgnoringCase("SameSite=None")
                        .containsIgnoringCase("Secure"))
                .anySatisfy(header -> assertThat(header)
                        .contains(AuthCookieHelper.REFRESH_COOKIE_NAME + "=")
                        .containsIgnoringCase("SameSite=None")
                        .containsIgnoringCase("Secure"));
    }

    @Test
    void shouldRedirectToNormalizedFrontendUrlOnOAuthError() {
        Response denied = given()
                .redirects().follow(false)
                .queryParam("error", "access_denied")
                .when()
                .get("/api/v1/auth/google/callback")
                .then()
                .statusCode(302)
                .extract().response();

        assertThat(denied.getHeader("Location"))
                .isEqualTo("https://lumo.example.com/login?error=access_denied");

        Response invalidState = given()
                .redirects().follow(false)
                .queryParam("code", "abc")
                .queryParam("state", "wrong-state")
                .when()
                .get("/api/v1/auth/google/callback")
                .then()
                .statusCode(302)
                .extract().response();

        assertThat(invalidState.getHeader("Location"))
                .isEqualTo("https://lumo.example.com/login?error=invalid_state");
    }

    @Test
    void shouldAllowCorsPreflightWithCredentialsForConfiguredOrigin() {
        Response allowedPreflight = given()
                .header("Origin", "https://lumo.example.com")
                .header("Access-Control-Request-Method", "GET")
                .when()
                .options("/api/v1/auth/me")
                .then()
                .statusCode(200)
                .extract().response();

        assertThat(allowedPreflight.getHeader("Access-Control-Allow-Origin"))
                .isEqualTo("https://lumo.example.com");
        assertThat(allowedPreflight.getHeader("Access-Control-Allow-Credentials"))
                .isEqualTo("true");

        Response disallowedPreflight = given()
                .header("Origin", "https://evil.example.com")
                .header("Access-Control-Request-Method", "GET")
                .when()
                .options("/api/v1/auth/me")
                .then()
                .extract().response();

        assertThat(disallowedPreflight.getHeader("Access-Control-Allow-Origin"))
                .isNotEqualTo("https://evil.example.com");
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
