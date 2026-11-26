package io.github.tiaggofg.lumo.infrastructure.web.budget;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;

@QuarkusTest
class BudgetResourceIT {

    @Inject
    EntityManager entityManager;

    @BeforeEach
    @Transactional
    void cleanDb() {
        entityManager.createNativeQuery("DELETE FROM recurring_occurrence_exclusions").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM transactions").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM recurring_transactions").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM monthly_budgets").executeUpdate();
    }

    @Test
    void shouldCreateListInDescOrderRejectDuplicateAndDeleteEmptyBudget() {
        String octId = given()
                .contentType(ContentType.JSON)
                .body("""
                        {"competenceMonth": "2026-10"}
                        """)
                .when()
                .post("/api/v1/budgets")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("competenceMonth", equalTo("2026-10"))
                .body("materializedCount", equalTo(0))
                .body("summary.plannedBalance", equalTo(0.0f))
                .extract().path("id");

        String novId = given()
                .contentType(ContentType.JSON)
                .body("""
                        {"competenceMonth": "2026-11"}
                        """)
                .when()
                .post("/api/v1/budgets")
                .then()
                .statusCode(201)
                .extract().path("id");

        // Duplicate 2026-11 -> 409 RFC 9457
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {"competenceMonth": "2026-11"}
                        """)
                .when()
                .post("/api/v1/budgets")
                .then()
                .statusCode(409)
                .contentType("application/problem+json")
                .body("status", equalTo(409));

        // List ordered by competenceMonth DESC
        given()
                .when()
                .get("/api/v1/budgets")
                .then()
                .statusCode(200)
                .body("competenceMonth", contains("2026-11", "2026-10"));

        // Detail for 2026-10
        given()
                .when()
                .get("/api/v1/budgets/" + octId)
                .then()
                .statusCode(200)
                .body("competenceMonth", equalTo("2026-10"))
                .body("statusCounts.pending", equalTo(0));

        // Delete empty -> 204
        given().delete("/api/v1/budgets/" + novId).then().statusCode(204);
        given().delete("/api/v1/budgets/" + octId).then().statusCode(204);
    }

    @Test
    void shouldKeepBudgetsIndependentAndBlockDeleteWhenTransactionsExist() {
        String octId = given()
                .contentType(ContentType.JSON)
                .body("""
                        {"competenceMonth": "2026-10"}
                        """)
                .post("/api/v1/budgets")
                .then().statusCode(201).extract().path("id");

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {"type": "INCOME", "description": "Salário Out", "amount": 5000.00, "status": "SETTLED"}
                        """)
                .post("/api/v1/budgets/" + octId + "/transactions")
                .then().statusCode(201);

        // Next month should start at 0.00 (no carryover)
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {"competenceMonth": "2026-11"}
                        """)
                .post("/api/v1/budgets")
                .then()
                .statusCode(201)
                .body("summary.plannedBalance", equalTo(0.0f));

        // Deleting Oct budget with transactions -> 409 RFC 9457
        given()
                .delete("/api/v1/budgets/" + octId)
                .then()
                .statusCode(409)
                .contentType("application/problem+json")
                .body("status", equalTo(409));
    }
}
