package io.github.tiaggofg.lumo.infrastructure.persistence.recurrence;

import io.github.tiaggofg.lumo.domain.recurrence.RecurrenceType;
import io.github.tiaggofg.lumo.domain.recurrence.RecurringTransaction;
import io.github.tiaggofg.lumo.domain.recurrence.RecurringTransactionRepository;
import io.github.tiaggofg.lumo.domain.transaction.TransactionType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class RecurringTransactionJpaRepositoryAdapter implements RecurringTransactionRepository {

    private final EntityManager entityManager;

    @Inject
    public RecurringTransactionJpaRepositoryAdapter(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Override
    public RecurringTransaction save(RecurringTransaction recurringTransaction) {
        RecurringTransactionJpaEntity merged = entityManager.merge(
                RecurringTransactionJpaEntity.fromDomain(recurringTransaction));
        entityManager.flush();
        return merged.toDomain();
    }

    @Override
    public Optional<RecurringTransaction> findById(UUID id) {
        RecurringTransactionJpaEntity entity = entityManager.find(RecurringTransactionJpaEntity.class, id);
        return Optional.ofNullable(entity).map(RecurringTransactionJpaEntity::toDomain);
    }

    @Override
    public List<RecurringTransaction> findAll(Boolean active, TransactionType type, RecurrenceType recurrenceType) {
        StringBuilder jpql = new StringBuilder("SELECT r FROM RecurringTransactionJpaEntity r WHERE 1=1");
        if (active != null) {
            jpql.append(" AND r.active = :active");
        }
        if (type != null) {
            jpql.append(" AND r.type = :type");
        }
        if (recurrenceType != null) {
            jpql.append(" AND r.recurrenceType = :recurrenceType");
        }
        jpql.append(" ORDER BY r.active DESC, LOWER(r.description) ASC, r.description ASC");

        TypedQuery<RecurringTransactionJpaEntity> query =
                entityManager.createQuery(jpql.toString(), RecurringTransactionJpaEntity.class);
        if (active != null) {
            query.setParameter("active", active);
        }
        if (type != null) {
            query.setParameter("type", type);
        }
        if (recurrenceType != null) {
            query.setParameter("recurrenceType", recurrenceType);
        }
        return query.getResultList().stream().map(RecurringTransactionJpaEntity::toDomain).toList();
    }

    @Override
    public List<RecurringTransaction> findAllActive() {
        return findAll(true, null, null);
    }

    @Override
    public void deleteById(UUID id) {
        RecurringTransactionJpaEntity entity = entityManager.find(RecurringTransactionJpaEntity.class, id);
        if (entity != null) {
            entityManager.remove(entity);
            entityManager.flush();
        }
    }
}
