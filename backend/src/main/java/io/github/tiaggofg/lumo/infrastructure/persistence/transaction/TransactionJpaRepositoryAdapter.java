package io.github.tiaggofg.lumo.infrastructure.persistence.transaction;

import io.github.tiaggofg.lumo.domain.shared.CompetenceMonth;
import io.github.tiaggofg.lumo.domain.transaction.Transaction;
import io.github.tiaggofg.lumo.domain.transaction.TransactionRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class TransactionJpaRepositoryAdapter implements TransactionRepository {

    private final EntityManager entityManager;

    @Inject
    public TransactionJpaRepositoryAdapter(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Override
    public Transaction save(Transaction transaction) {
        TransactionJpaEntity merged = entityManager.merge(TransactionJpaEntity.fromDomain(transaction));
        entityManager.flush();
        return merged.toDomain();
    }

    @Override
    public Optional<Transaction> findById(UUID id) {
        TransactionJpaEntity entity = entityManager.find(TransactionJpaEntity.class, id);
        return Optional.ofNullable(entity).map(TransactionJpaEntity::toDomain);
    }

    @Override
    public boolean existsByMonthlyBudgetId(UUID monthlyBudgetId) {
        Long count = entityManager.createQuery(
                        "SELECT COUNT(t) FROM TransactionJpaEntity t WHERE t.monthlyBudgetId = :budgetId", Long.class)
                .setParameter("budgetId", monthlyBudgetId)
                .getSingleResult();
        return count > 0;
    }

    @Override
    public boolean existsByMonthlyBudgetIdAndSourceRecurringTransactionId(UUID monthlyBudgetId, UUID recurringTransactionId) {
        Long count = entityManager.createQuery("""
                        SELECT COUNT(t) FROM TransactionJpaEntity t
                        WHERE t.monthlyBudgetId = :budgetId
                          AND t.sourceRecurringTransactionId = :recurringId
                        """, Long.class)
                .setParameter("budgetId", monthlyBudgetId)
                .setParameter("recurringId", recurringTransactionId)
                .getSingleResult();
        return count > 0;
    }

    @Override
    public List<Transaction> findOpenBySourceRecurringIdAndCompetenceMonthGte(UUID recurringTransactionId, CompetenceMonth fromMonth) {
        return entityManager.createQuery("""
                        SELECT t FROM TransactionJpaEntity t, MonthlyBudgetJpaEntity b
                        WHERE t.monthlyBudgetId = b.id
                          AND t.sourceRecurringTransactionId = :recurringId
                          AND t.status IN ('ESTIMATED', 'PENDING')
                          AND b.competenceMonth >= :fromMonth
                        ORDER BY b.competenceMonth ASC
                        """, TransactionJpaEntity.class)
                .setParameter("recurringId", recurringTransactionId)
                .setParameter("fromMonth", fromMonth.toIsoString())
                .getResultList()
                .stream()
                .map(TransactionJpaEntity::toDomain)
                .toList();
    }

    @Override
    public void deleteById(UUID id) {
        TransactionJpaEntity entity = entityManager.find(TransactionJpaEntity.class, id);
        if (entity != null) {
            entityManager.remove(entity);
            entityManager.flush();
        }
    }

    @Override
    public int deleteOpenBySourceRecurringIdAndCompetenceMonthGte(UUID recurringTransactionId, CompetenceMonth fromMonth) {
        int deleted = entityManager.createNativeQuery("""
                        DELETE FROM transactions t
                        USING monthly_budgets b
                        WHERE t.monthly_budget_id = b.id
                          AND t.source_recurring_transaction_id = :recurringId
                          AND t.status IN ('ESTIMATED', 'PENDING')
                          AND b.competence_month >= :fromMonth
                        """)
                .setParameter("recurringId", recurringTransactionId)
                .setParameter("fromMonth", fromMonth.toIsoString())
                .executeUpdate();
        entityManager.flush();
        return deleted;
    }
}
