package io.github.tiaggofg.lumo.infrastructure.persistence.budget;

import io.github.tiaggofg.lumo.domain.budget.MonthlyBudget;
import io.github.tiaggofg.lumo.domain.budget.MonthlyBudgetRepository;
import io.github.tiaggofg.lumo.domain.shared.CompetenceMonth;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class MonthlyBudgetJpaRepositoryAdapter implements MonthlyBudgetRepository {

    private final EntityManager entityManager;

    @Inject
    public MonthlyBudgetJpaRepositoryAdapter(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Override
    public MonthlyBudget save(MonthlyBudget budget) {
        MonthlyBudgetJpaEntity merged = entityManager.merge(MonthlyBudgetJpaEntity.fromDomain(budget));
        entityManager.flush();
        return merged.toDomain();
    }

    @Override
    public Optional<MonthlyBudget> findById(UUID id) {
        MonthlyBudgetJpaEntity entity = entityManager.find(MonthlyBudgetJpaEntity.class, id);
        return Optional.ofNullable(entity).map(MonthlyBudgetJpaEntity::toDomain);
    }

    @Override
    public boolean existsByCompetenceMonth(CompetenceMonth competenceMonth) {
        Long count = entityManager.createQuery(
                        "SELECT COUNT(b) FROM MonthlyBudgetJpaEntity b WHERE b.competenceMonth = :cm", Long.class)
                .setParameter("cm", competenceMonth.toIsoString())
                .getSingleResult();
        return count > 0;
    }

    @Override
    public List<MonthlyBudget> findByCompetenceMonthGreaterThanEqual(CompetenceMonth competenceMonth) {
        return entityManager.createQuery(
                        "SELECT b FROM MonthlyBudgetJpaEntity b WHERE b.competenceMonth >= :cm ORDER BY b.competenceMonth ASC",
                        MonthlyBudgetJpaEntity.class)
                .setParameter("cm", competenceMonth.toIsoString())
                .getResultList()
                .stream()
                .map(MonthlyBudgetJpaEntity::toDomain)
                .toList();
    }

    @Override
    public void deleteById(UUID id) {
        MonthlyBudgetJpaEntity entity = entityManager.find(MonthlyBudgetJpaEntity.class, id);
        if (entity != null) {
            entityManager.remove(entity);
            entityManager.flush();
        }
    }
}
