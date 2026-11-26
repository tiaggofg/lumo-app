package io.github.tiaggofg.lumo.infrastructure.web.recurrence;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.YearMonth;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;

@QuarkusTest
class RecurringTransactionResourceIT {

    @Inject
    EntityManager entityManager;

    @Inject
    Clock clock;

    @BeforeEach
    @Transactional
    void cleanDb() {
        entityManager.createNativeQuery("DELETE FROM recurring_occurrence_exclusions").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM transactions").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM recurring_transactions").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM monthly_budgets").executeUpdate();
    }

    @Test
    void shouldMaterializeAllThreeModesOnBudgetCreateAndClampDueDay31InFeb() {
        // 1. INDEFINITE FIXED dueDay=31
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "type": "EXPENSE",
                          "description": "Aluguel",
                          "amount": 800.00,
                          "amountType": "FIXED",
                          "recurrenceType": "INDEFINITE",
                          "startMonth": "2027-01",
                          "dueDay": 31
                        }
                        """)
                .post("/api/v1/recurring-transactions")
                .then().statusCode(201);

        // 2. FIXED_TERM ESTIMATED 2027-01..2027-02
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "type": "EXPENSE",
                          "description": "Dentista - Tiago",
                          "amount": 150.00,
                          "amountType": "ESTIMATED",
                          "recurrenceType": "FIXED_TERM",
                          "startMonth": "2027-01",
                          "endMonth": "2027-02",
                          "dueDay": 15
                        }
                        """)
                .post("/api/v1/recurring-transactions")
                .then().statusCode(201);

        // 3. INSTALLMENT 4/6 starting 2027-01 -> 4/6 Jan, 5/6 Feb, 6/6 Mar, stops Apr
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "type": "EXPENSE",
                          "description": "Cartão Sogra",
                          "amount": 58.66,
                          "amountType": "FIXED",
                          "recurrenceType": "INSTALLMENT",
                          "startMonth": "2027-01",
                          "totalInstallments": 6,
                          "startingInstallment": 4,
                          "dueDay": 10
                        }
                        """)
                .post("/api/v1/recurring-transactions")
                .then().statusCode(201);

        // Create 2027-02 budget -> all 3 materialize, Aluguel clamped to 2027-02-28, Cartão Sogra is 5/6
        String febId = given()
                .contentType(ContentType.JSON)
                .body("""
                        {"competenceMonth": "2027-02"}
                        """)
                .post("/api/v1/budgets")
                .then()
                .statusCode(201)
                .body("materializedCount", equalTo(3))
                .extract().path("id");

        given()
                .get("/api/v1/budgets/" + febId + "/transactions")
                .then()
                .statusCode(200)
                .body("size()", equalTo(3))
                .body("find { it.description == 'Aluguel' }.dueDate", equalTo("2027-02-28"))
                .body("find { it.description == 'Dentista - Tiago' }.status", equalTo("ESTIMATED"))
                .body("find { it.description == 'Cartão Sogra' }.installmentCurrent", equalTo(5))
                .body("find { it.description == 'Cartão Sogra' }.installmentTotal", equalTo(6));

        // Create 2027-04 budget -> only Aluguel is still eligible
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {"competenceMonth": "2027-04"}
                        """)
                .post("/api/v1/budgets")
                .then()
                .statusCode(201)
                .body("materializedCount", equalTo(1));
    }

    @Test
    void shouldMaterializeCurrentFutureOnlyPropagatePreservingSettledDeactivateAndSuppressDeleted() {
        YearMonth current = YearMonth.now(clock);
        YearMonth past = current.minusMonths(1);
        YearMonth next = current.plusMonths(1);

        String pastBudgetId = given()
                .contentType(ContentType.JSON)
                .body("""
                        {"competenceMonth": "%s"}
                        """.formatted(past))
                .post("/api/v1/budgets").then().statusCode(201).extract().path("id");

        String currentBudgetId = given()
                .contentType(ContentType.JSON)
                .body("""
                        {"competenceMonth": "%s"}
                        """.formatted(current))
                .post("/api/v1/budgets").then().statusCode(201).extract().path("id");

        String nextBudgetId = given()
                .contentType(ContentType.JSON)
                .body("""
                        {"competenceMonth": "%s"}
                        """.formatted(next))
                .post("/api/v1/budgets").then().statusCode(201).extract().path("id");

        // Create recurrence starting in past month -> should materialize in current & next ONLY (not past)
        String ruleId = given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "type": "EXPENSE",
                          "description": "Internet",
                          "amount": 100.00,
                          "amountType": "FIXED",
                          "recurrenceType": "INDEFINITE",
                          "startMonth": "%s",
                          "dueDay": 10
                        }
                        """.formatted(past))
                .post("/api/v1/recurring-transactions")
                .then()
                .statusCode(201)
                .body("materializedBudgetIds", hasSize(2))
                .body("materializedBudgetIds", hasItem(currentBudgetId))
                .body("materializedBudgetIds", hasItem(nextBudgetId))
                .body("materializedBudgetIds", not(hasItem(pastBudgetId)))
                .extract().path("recurrence.id");

        // Mark current month's transaction as SETTLED
        String currentTxnId = given()
                .get("/api/v1/budgets/" + currentBudgetId + "/transactions")
                .then().statusCode(200).extract().path("[0].id");

        given()
                .contentType(ContentType.JSON)
                .body("""
                        {"status": "SETTLED"}
                        """)
                .patch("/api/v1/transactions/" + currentTxnId + "/status")
                .then().statusCode(200);

        // Update recurrence with propagateToOpenTransactions=true -> should update nextBudget only (1), NOT settled currentBudget
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "type": "EXPENSE",
                          "description": "Internet Fibra",
                          "amount": 120.00,
                          "amountType": "FIXED",
                          "recurrenceType": "INDEFINITE",
                          "startMonth": "%s",
                          "dueDay": 12,
                          "propagateToOpenTransactions": true
                        }
                        """.formatted(past))
                .put("/api/v1/recurring-transactions/" + ruleId)
                .then()
                .statusCode(200)
                .body("propagatedCount", equalTo(1));

        // Verify current (SETTLED) remained 100.00, next (PENDING) updated to 120.00
        given().get("/api/v1/budgets/" + currentBudgetId + "/transactions")
                .then().body("[0].amount", equalTo(100.0f));
        given().get("/api/v1/budgets/" + nextBudgetId + "/transactions")
                .then().body("[0].amount", equalTo(120.0f));

        // Delete next month's materialized transaction -> records exclusion in recurring_occurrence_exclusions
        String nextTxnId = given()
                .get("/api/v1/budgets/" + nextBudgetId + "/transactions")
                .then().statusCode(200).extract().path("[0].id");
        given().delete("/api/v1/transactions/" + nextTxnId).then().statusCode(204);

        long exclusionCount = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM recurring_occurrence_exclusions WHERE monthly_budget_id = CAST(:b AS uuid) AND recurring_transaction_id = CAST(:r AS uuid)")
                .setParameter("b", nextBudgetId)
                .setParameter("r", ruleId)
                .getSingleResult()).longValue();
        org.assertj.core.api.Assertions.assertThat(exclusionCount).isEqualTo(1L);

        // Physical delete of recurrence that generated transactions -> 409 RFC 9457
        given()
                .delete("/api/v1/recurring-transactions/" + ruleId)
                .then()
                .statusCode(409)
                .contentType("application/problem+json");

        // Deactivate -> 200
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {"removeFutureOpenTransactions": true}
                        """)
                .patch("/api/v1/recurring-transactions/" + ruleId + "/deactivate")
                .then()
                .statusCode(200)
                .body("recurrence.active", equalTo(false));

        // Activate -> 200
        given()
                .contentType(ContentType.JSON)
                .patch("/api/v1/recurring-transactions/" + ruleId + "/activate")
                .then()
                .statusCode(200)
                .body("active", equalTo(true));

        // List with filters -> 200
        given()
                .queryParam("active", true)
                .queryParam("type", "EXPENSE")
                .queryParam("recurrenceType", "INDEFINITE")
                .get("/api/v1/recurring-transactions")
                .then()
                .statusCode(200)
                .body("size()", equalTo(1));

        // Invalid request body -> 400 Bean Validation RFC 9457
        given()
                .contentType(ContentType.JSON)
                .body("{}")
                .post("/api/v1/recurring-transactions")
                .then()
                .statusCode(400)
                .contentType("application/problem+json");
    }

    @Test
    void shouldAllowPhysicalDeleteWhenRecurrenceNeverGeneratedTransactions() {
        String ruleId = given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "type": "EXPENSE",
                          "description": "Nunca Gerada",
                          "amount": 50.00,
                          "amountType": "FIXED",
                          "recurrenceType": "INDEFINITE",
                          "startMonth": "2030-01"
                        }
                        """)
                .post("/api/v1/recurring-transactions")
                .then()
                .statusCode(201)
                .body("materializedBudgetIds", hasSize(0))
                .extract().path("recurrence.id");

        given()
                .delete("/api/v1/recurring-transactions/" + ruleId)
                .then()
                .statusCode(204);
    }
}
