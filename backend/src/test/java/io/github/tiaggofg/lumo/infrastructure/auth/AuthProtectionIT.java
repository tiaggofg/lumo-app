package io.github.tiaggofg.lumo.infrastructure.auth;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

@QuarkusTest
class AuthProtectionIT {

    @Test
    void shouldRejectUnauthenticatedRequestsToProtectedApiEndpointsWith401ProblemJson() {
        String[] protectedPaths = {
                "/api/v1/auth/me",
                "/api/v1/budgets",
                "/api/v1/categories",
                "/api/v1/beneficiaries",
                "/api/v1/recurring-transactions"
        };

        for (String path : protectedPaths) {
            given()
                    .when()
                    .get(path)
                    .then()
                    .statusCode(401)
                    .contentType("application/problem+json")
                    .body("status", equalTo(401))
                    .body("title", equalTo("Unauthorized"));
        }

        // Invalid JWT cookie also gets 401
        given()
                .cookie(AuthCookieHelper.ACCESS_COOKIE_NAME, "invalid.jwt.token")
                .when()
                .get("/api/v1/budgets")
                .then()
                .statusCode(401)
                .contentType("application/problem+json");
    }

    @Test
    void shouldKeepHealthEndpointsPublicWithoutAuthentication() {
        given()
                .when()
                .get("/q/health/ready")
                .then()
                .statusCode(200);

        given()
                .when()
                .get("/q/health/live")
                .then()
                .statusCode(200);
    }
}
