package io.github.tiaggofg.lumo.infrastructure.auth;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.QuarkusTestProfile;
import io.quarkus.test.junit.TestProfile;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

@QuarkusTest
@TestProfile(DevLoginDisabledIT.DevLoginDisabledProfile.class)
class DevLoginDisabledIT {

    public static class DevLoginDisabledProfile implements QuarkusTestProfile {
        @Override
        public Map<String, String> getConfigOverrides() {
            return Map.of("lumo.auth.dev-login.enabled", "false");
        }
    }

    @Test
    void shouldReportDevLoginDisabledAndReturn404OnDevLoginPost() {
        given()
                .when()
                .get("/api/v1/auth/providers")
                .then()
                .statusCode(200)
                .body("devLoginEnabled", equalTo(false));

        given()
                .when()
                .post("/api/v1/auth/dev-login")
                .then()
                .statusCode(404)
                .contentType("application/problem+json")
                .body("status", equalTo(404));
    }
}
