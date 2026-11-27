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
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.notNullValue;

@QuarkusTest
class CategoryResourceIT {

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
    void shouldCreateListUpdateDeactivateAndDeleteCategory() {
        String id = given()
                .contentType(ContentType.JSON)
                .body("""
                        {"name": "Pets IT", "type": "EXPENSE", "color": "#22aa88", "icon": "pi pi-heart"}
                        """)
                .when()
                .post("/api/v1/categories")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("name", equalTo("Pets IT"))
                .body("type", equalTo("EXPENSE"))
                .body("color", equalTo("#22AA88"))
                .body("active", equalTo(true))
                .extract().path("id");

        // Duplicate name + type (case-insensitive) -> 409 RFC 9457
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {"name": "pets it", "type": "EXPENSE"}
                        """)
                .when()
                .post("/api/v1/categories")
                .then()
                .statusCode(409)
                .contentType("application/problem+json")
                .body("status", equalTo(409));

        // Update category
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {"name": "Animais IT", "color": "#112233", "icon": "pi pi-star"}
                        """)
                .when()
                .put("/api/v1/categories/" + id)
                .then()
                .statusCode(200)
                .body("name", equalTo("Animais IT"))
                .body("color", equalTo("#112233"));

        // Deactivate -> excluded from active=true listing
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {"active": false}
                        """)
                .when()
                .patch("/api/v1/categories/" + id + "/status")
                .then()
                .statusCode(200)
                .body("active", equalTo(false));

        given()
                .queryParam("type", "EXPENSE")
                .queryParam("active", true)
                .when()
                .get("/api/v1/categories")
                .then()
                .statusCode(200)
                .body("size()", greaterThanOrEqualTo(9))
                .body("id", not(hasItem(id)));

        // Delete unreferenced -> 204
        given()
                .when()
                .delete("/api/v1/categories/" + id)
                .then()
                .statusCode(204);
    }

    @Test
    void shouldRejectDeletingReferencedCategoryWith409() {
        String categoryId = given()
                .contentType(ContentType.JSON)
                .body("""
                        {"name": "RefCat IT", "type": "EXPENSE"}
                        """)
                .when()
                .post("/api/v1/categories")
                .then()
                .statusCode(201)
                .extract().path("id");

        UUID budgetId = UUID.randomUUID();
        UUID txnId = UUID.randomUUID();
        insertBudgetAndTransactionReferencingCategory(budgetId, txnId, UUID.fromString(categoryId));

        try {
            given()
                    .when()
                    .delete("/api/v1/categories/" + categoryId)
                    .then()
                    .statusCode(409)
                    .contentType("application/problem+json")
                    .body("status", equalTo(409));
        } finally {
            cleanupBudgetAndTransaction(budgetId, txnId);
            given().delete("/api/v1/categories/" + categoryId).then().statusCode(204);
        }
    }

    @Test
    void shouldRejectInvalidHexColorWith400() {
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {"name": "BadColor IT", "type": "EXPENSE", "color": "not-a-hex"}
                        """)
                .when()
                .post("/api/v1/categories")
                .then()
                .statusCode(400)
                .contentType("application/problem+json")
                .body("status", equalTo(400));
    }

    @Transactional
    void insertBudgetAndTransactionReferencingCategory(UUID budgetId, UUID txnId, UUID categoryId) {
        entityManager.createNativeQuery("""
                INSERT INTO monthly_budgets (id, competence_month) VALUES (:budgetId, '2025-01')
                """).setParameter("budgetId", budgetId).executeUpdate();
        entityManager.createNativeQuery("""
                INSERT INTO transactions (id, monthly_budget_id, type, description, amount, status, category_id)
                VALUES (:txnId, :budgetId, 'EXPENSE', 'Test Ref', 100.00, 'PENDING', :categoryId)
                """)
                .setParameter("txnId", txnId)
                .setParameter("budgetId", budgetId)
                .setParameter("categoryId", categoryId)
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
