package io.github.tiaggofg.lumo.infrastructure.auth;

import io.restassured.builder.RequestSpecBuilder;
import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;

import static io.restassured.RestAssured.given;

public final class AuthTestHelper {

    private AuthTestHelper() {
    }

    public static RequestSpecification devRequestSpec() {
        Response response = given()
                .when()
                .post("/api/v1/auth/dev-login")
                .then()
                .statusCode(200)
                .extract()
                .response();

        String accessToken = response.getCookie(AuthCookieHelper.ACCESS_COOKIE_NAME);
        return new RequestSpecBuilder()
                .addCookie(AuthCookieHelper.ACCESS_COOKIE_NAME, accessToken)
                .build();
    }
}
