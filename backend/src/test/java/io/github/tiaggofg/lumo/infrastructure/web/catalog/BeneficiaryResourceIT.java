package io.github.tiaggofg.lumo.infrastructure.web.catalog;

import io.github.tiaggofg.lumo.infrastructure.auth.AuthTestHelper;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.notNullValue;

@QuarkusTest
class BeneficiaryResourceIT {

    @Inject
    EntityManager entityManager;

    @BeforeEach
    void authenticate() {
        RestAssured.requestSpecification = AuthTestHelper.devRequestSpec();
    }

    @AfterEach
    void clearAuth() {
        RestAssured.requestSpecification = null;
    }

    @Test
    void shouldCreateUpdateToggleAndDeleteBeneficiary() {
        String id = given()
                .contentType(ContentType.JSON)
                .body("""
                        {"name": "Tiago IT"}
                        """)
                .when()
                .post("/api/v1/beneficiaries")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("name", equalTo("Tiago IT"))
                .body("active", equalTo(true))
                .extract().path("id");

        // Duplicate (case-insensitive) -> 409 RFC 9457
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {"name": "tiago it"}
                        """)
                .when()
                .post("/api/v1/beneficiaries")
                .then()
                .statusCode(409)
                .contentType("application/problem+json")
                .body("status", equalTo(409));

        // Rename
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {"name": "Tiago Godoy IT"}
                        """)
                .when()
                .put("/api/v1/beneficiaries/" + id)
                .then()
                .statusCode(200)
                .body("name", equalTo("Tiago Godoy IT"));

        // Deactivate -> excluded from active=true
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {"active": false}
                        """)
                .when()
                .patch("/api/v1/beneficiaries/" + id + "/status")
                .then()
                .statusCode(200)
                .body("active", equalTo(false));

        given()
                .queryParam("active", true)
                .when()
                .get("/api/v1/beneficiaries")
                .then()
                .statusCode(200)
                .body("id", not(hasItem(id)));

        // Delete unreferenced -> 204
        given()
                .when()
                .delete("/api/v1/beneficiaries/" + id)
                .then()
                .statusCode(204);
    }

    @Test
    void shouldRejectDeletingReferencedBeneficiaryWith409() {
        String beneficiaryId = given()
                .contentType(ContentType.JSON)
                .body("""
                        {"name": "RefBen IT"}
                        """)
                .when()
                .post("/api/v1/beneficiaries")
                .then()
                .statusCode(201)
                .extract().path("id");

        UUID budgetId = UUID.randomUUID();
        UUID txnId = UUID.randomUUID();
        insertBudgetAndTransactionReferencingBeneficiary(budgetId, txnId, UUID.fromString(beneficiaryId));

        try {
            given()
                    .when()
                    .delete("/api/v1/beneficiaries/" + beneficiaryId)
                    .then()
                    .statusCode(409)
                    .contentType("application/problem+json")
                    .body("status", equalTo(409));
        } finally {
            cleanupBudgetAndTransaction(budgetId, txnId);
            given().delete("/api/v1/beneficiaries/" + beneficiaryId).then().statusCode(204);
        }
    }

    @Transactional
    void insertBudgetAndTransactionReferencingBeneficiary(UUID budgetId, UUID txnId, UUID beneficiaryId) {
        entityManager.createNativeQuery("""
                INSERT INTO monthly_budgets (id, competence_month) VALUES (:budgetId, '2025-02')
                """).setParameter("budgetId", budgetId).executeUpdate();
        entityManager.createNativeQuery("""
                INSERT INTO transactions (id, monthly_budget_id, type, description, amount, status, beneficiary_id)
                VALUES (:txnId, :budgetId, 'EXPENSE', 'Test Ben Ref', 50.00, 'PENDING', :beneficiaryId)
                """)
                .setParameter("txnId", txnId)
                .setParameter("budgetId", budgetId)
                .setParameter("beneficiaryId", beneficiaryId)
                .executeUpdate();
    }

    @Transactional
    void cleanupBudgetAndTransaction(UUID budgetId, UUID txnId) {
        entityManager.createNativeQuery("DELETE FROM transactions WHERE id = :id")
                .setParameter("id", txnId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM monthly_budgets WHERE id = :id")
                .setParameter("id", budgetId).executeUpdate();
    }
}
