package io.github.tiaggofg.lumo.infrastructure.web.transaction;

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
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;

@QuarkusTest
class TransactionResourceIT {

    private static final String CAT_MORADIA = "10000000-0000-0000-0000-000000000001";
    private static final String CAT_SALARIO = "10000000-0000-0000-0000-000000000010";
    private static final String BEN_FAMILIA = "20000000-0000-0000-0000-000000000001";

    @Inject
    EntityManager entityManager;

    @BeforeEach
    @Transactional
    void cleanDb() {
        entityManager.createNativeQuery("DELETE FROM recurring_occurrence_exclusions").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM transactions").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM recurring_transactions").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM monthly_budgets").executeUpdate();
        entityManager.createNativeQuery("UPDATE categories SET active = TRUE").executeUpdate();
        entityManager.createNativeQuery("UPDATE beneficiaries SET active = TRUE").executeUpdate();
        RestAssured.requestSpecification = AuthTestHelper.devRequestSpec();
    }

    @AfterEach
    void clearAuth() {
        RestAssured.requestSpecification = null;
    }

    @Test
    void shouldCreateFilterOrderToggleStatusAndConfirmEstimate() {
        String budgetId = given()
                .contentType(ContentType.JSON)
                .body("""
                        {"competenceMonth": "2026-11"}
                        """)
                .post("/api/v1/budgets")
                .then().statusCode(201).extract().path("id");

        // No dueDate -> should sort LAST
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {"type": "EXPENSE", "description": "Sem Data", "amount": 50.00, "status": "PENDING", "notes": "cartao extra"}
                        """)
                .post("/api/v1/budgets/" + budgetId + "/transactions")
                .then().statusCode(201);

        // dueDate 2026-11-20
        String aguaId = given()
                .contentType(ContentType.JSON)
                .body("""
                        {"type": "EXPENSE", "description": "Água", "amount": 180.00, "status": "ESTIMATED", "dueDate": "2026-11-20", "categoryId": "%s", "beneficiaryId": "%s"}
                        """.formatted(CAT_MORADIA, BEN_FAMILIA))
                .post("/api/v1/budgets/" + budgetId + "/transactions")
                .then().statusCode(201).extract().path("id");

        // dueDate 2026-11-05 -> should sort FIRST
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {"type": "EXPENSE", "description": "Aluguel", "amount": 800.00, "status": "PENDING", "dueDate": "2026-11-05"}
                        """)
                .post("/api/v1/budgets/" + budgetId + "/transactions")
                .then().statusCode(201);

        // Verify ordering: dueDate ASC NULLS LAST
        given()
                .get("/api/v1/budgets/" + budgetId + "/transactions")
                .then()
                .statusCode(200)
                .body("description", contains("Aluguel", "Água", "Sem Data"));

        // Verify search over notes (case-insensitive)
        given()
                .queryParam("search", "CARTAO")
                .get("/api/v1/budgets/" + budgetId + "/transactions")
                .then()
                .statusCode(200)
                .body("description", contains("Sem Data"));

        // Confirm estimate -> PENDING with new amount
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {"amount": 195.64, "targetStatus": "PENDING"}
                        """)
                .patch("/api/v1/transactions/" + aguaId + "/confirm-estimate")
                .then()
                .statusCode(200)
                .body("amount", equalTo(195.64f))
                .body("status", equalTo("PENDING"))
                .body("paymentDate", nullValue());

        // Confirm estimate again when already PENDING -> 422
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {"amount": 200.00, "targetStatus": "SETTLED"}
                        """)
                .patch("/api/v1/transactions/" + aguaId + "/confirm-estimate")
                .then()
                .statusCode(422)
                .contentType("application/problem+json");

        // Toggle to SETTLED -> populates paymentDate
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {"status": "SETTLED"}
                        """)
                .patch("/api/v1/transactions/" + aguaId + "/status")
                .then()
                .statusCode(200)
                .body("status", equalTo("SETTLED"))
                .body("paymentDate", notNullValue());

        // Revert to PENDING -> clears paymentDate
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {"status": "PENDING"}
                        """)
                .patch("/api/v1/transactions/" + aguaId + "/status")
                .then()
                .statusCode(200)
                .body("status", equalTo("PENDING"))
                .body("paymentDate", nullValue());
    }

    @Test
    void shouldValidateCategoryTypeMismatchInactiveCategoryAndBudgetImmutability() {
        String budgetId = given()
                .contentType(ContentType.JSON)
                .body("""
                        {"competenceMonth": "2026-11"}
                        """)
                .post("/api/v1/budgets")
                .then().statusCode(201).extract().path("id");

        // amount <= 0 -> 400
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {"type": "EXPENSE", "description": "Zero", "amount": 0, "status": "PENDING"}
                        """)
                .post("/api/v1/budgets/" + budgetId + "/transactions")
                .then().statusCode(400).contentType("application/problem+json");

        // Category type mismatch (INCOME category on EXPENSE transaction) -> 400
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {"type": "EXPENSE", "description": "Mismatch", "amount": 50.00, "status": "PENDING", "categoryId": "%s"}
                        """.formatted(CAT_SALARIO))
                .post("/api/v1/budgets/" + budgetId + "/transactions")
                .then().statusCode(400).contentType("application/problem+json");

        // Unknown category -> 404
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {"type": "EXPENSE", "description": "Unknown", "amount": 50.00, "status": "PENDING", "categoryId": "%s"}
                        """.formatted(UUID.randomUUID()))
                .post("/api/v1/budgets/" + budgetId + "/transactions")
                .then().statusCode(404).contentType("application/problem+json");

        // Create transaction with active category, then deactivate category
        String txnId = given()
                .contentType(ContentType.JSON)
                .body("""
                        {"type": "EXPENSE", "description": "Aluguel", "amount": 800.00, "status": "PENDING", "categoryId": "%s"}
                        """.formatted(CAT_MORADIA))
                .post("/api/v1/budgets/" + budgetId + "/transactions")
                .then().statusCode(201).extract().path("id");

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {"active": false}
                        """)
                .patch("/api/v1/categories/" + CAT_MORADIA + "/status")
                .then().statusCode(200);

        // Creating NEW transaction with inactive category -> 422
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {"type": "EXPENSE", "description": "New with inactive", "amount": 50.00, "status": "PENDING", "categoryId": "%s"}
                        """.formatted(CAT_MORADIA))
                .post("/api/v1/budgets/" + budgetId + "/transactions")
                .then().statusCode(422).contentType("application/problem+json");

        // Editing EXISTING transaction keeping its unchanged inactive category -> 200
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {"type": "EXPENSE", "description": "Aluguel Editado", "amount": 820.00, "status": "PENDING", "categoryId": "%s"}
                        """.formatted(CAT_MORADIA))
                .put("/api/v1/transactions/" + txnId)
                .then().statusCode(200)
                .body("description", equalTo("Aluguel Editado"));

        // Attempting to change monthlyBudgetId -> 400
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {"monthlyBudgetId": "%s", "type": "EXPENSE", "description": "Move", "amount": 820.00, "status": "PENDING"}
                        """.formatted(UUID.randomUUID()))
                .put("/api/v1/transactions/" + txnId)
                .then().statusCode(400).contentType("application/problem+json");
    }
}
