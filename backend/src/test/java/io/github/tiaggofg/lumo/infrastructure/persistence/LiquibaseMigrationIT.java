package io.github.tiaggofg.lumo.infrastructure.persistence;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@QuarkusTest
class LiquibaseMigrationIT {

    @Inject
    EntityManager entityManager;

    @Test
    void shouldCreateAllSixCoreTables() {
        @SuppressWarnings("unchecked")
        List<String> tables = entityManager.createNativeQuery("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                """).getResultList();

        assertThat(tables).contains(
                "categories",
                "beneficiaries",
                "monthly_budgets",
                "recurring_transactions",
                "transactions",
                "recurring_occurrence_exclusions",
                "users",
                "refresh_sessions"
        );
    }

    @Test
    void shouldCreateAuthUniqueConstraintsAndIndexes() {
        @SuppressWarnings("unchecked")
        List<String> constraints = entityManager.createNativeQuery("""
                SELECT constraint_name
                FROM information_schema.table_constraints
                WHERE table_schema = 'public'
                  AND table_name IN ('users', 'refresh_sessions')
                  AND constraint_type = 'UNIQUE'
                """).getResultList();

        assertThat(constraints).contains(
                "uq_users_google_sub",
                "uq_users_email",
                "uq_refresh_sessions_token_hash"
        );

        @SuppressWarnings("unchecked")
        List<String> indexes = entityManager.createNativeQuery("""
                SELECT indexname
                FROM pg_indexes
                WHERE schemaname = 'public'
                  AND tablename = 'refresh_sessions'
                """).getResultList();

        assertThat(indexes).contains(
                "idx_refresh_sessions_user_id",
                "idx_refresh_sessions_expires_at"
        );
    }

    @Test
    void shouldCreatePartialUniqueIndexOnTransactionsForRecurrenceMaterialization() {
        @SuppressWarnings("unchecked")
        List<String> indexDefs = entityManager.createNativeQuery("""
                SELECT indexdef
                FROM pg_indexes
                WHERE schemaname = 'public'
                  AND indexname = 'uq_transactions_budget_recurring'
                """).getResultList();

        assertThat(indexDefs).hasSize(1);
        assertThat(indexDefs.getFirst())
                .containsIgnoringCase("UNIQUE INDEX")
                .containsIgnoringCase("monthly_budget_id")
                .containsIgnoringCase("source_recurring_transaction_id")
                .containsIgnoringCase("WHERE (source_recurring_transaction_id IS NOT NULL)");
    }

    @Test
    void shouldSeedTwelveDefaultCategoriesAndDefaultFamiliaBeneficiary() {
        long expenseCount = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM categories WHERE type = 'EXPENSE'").getSingleResult()).longValue();
        long incomeCount = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM categories WHERE type = 'INCOME'").getSingleResult()).longValue();
        @SuppressWarnings("unchecked")
        List<String> beneficiaryNames = entityManager.createNativeQuery(
                "SELECT name FROM beneficiaries").getResultList();

        assertThat(expenseCount).isEqualTo(9L);
        assertThat(incomeCount).isEqualTo(3L);
        assertThat(beneficiaryNames).contains("Família");
    }
}
