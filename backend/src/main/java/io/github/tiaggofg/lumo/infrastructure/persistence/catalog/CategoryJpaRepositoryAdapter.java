package io.github.tiaggofg.lumo.infrastructure.persistence.catalog;

import io.github.tiaggofg.lumo.domain.catalog.Category;
import io.github.tiaggofg.lumo.domain.catalog.CategoryRepository;
import io.github.tiaggofg.lumo.domain.transaction.TransactionType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class CategoryJpaRepositoryAdapter implements CategoryRepository {

    private final EntityManager entityManager;

    @Inject
    public CategoryJpaRepositoryAdapter(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Override
    public Category save(Category category) {
        CategoryJpaEntity merged = entityManager.merge(CategoryJpaEntity.fromDomain(category));
        entityManager.flush();
        return merged.toDomain();
    }

    @Override
    public Optional<Category> findById(UUID id) {
        CategoryJpaEntity entity = entityManager.find(CategoryJpaEntity.class, id);
        return Optional.ofNullable(entity).map(CategoryJpaEntity::toDomain);
    }

    @Override
    public List<Category> findAll(TransactionType type, Boolean active) {
        StringBuilder jpql = new StringBuilder("SELECT c FROM CategoryJpaEntity c WHERE 1=1");
        if (type != null) {
            jpql.append(" AND c.type = :type");
        }
        if (active != null) {
            jpql.append(" AND c.active = :active");
        }
        jpql.append(" ORDER BY LOWER(c.name) ASC, c.name ASC");

        TypedQuery<CategoryJpaEntity> query = entityManager.createQuery(jpql.toString(), CategoryJpaEntity.class);
        if (type != null) {
            query.setParameter("type", type);
        }
        if (active != null) {
            query.setParameter("active", active);
        }
        return query.getResultList().stream().map(CategoryJpaEntity::toDomain).toList();
    }

    @Override
    public boolean existsByNameIgnoreCaseAndType(String name, TransactionType type, UUID excludeId) {
        String jpql = excludeId == null
                ? "SELECT COUNT(c) FROM CategoryJpaEntity c WHERE LOWER(c.name) = LOWER(:name) AND c.type = :type"
                : "SELECT COUNT(c) FROM CategoryJpaEntity c WHERE LOWER(c.name) = LOWER(:name) AND c.type = :type AND c.id <> :excludeId";
        TypedQuery<Long> query = entityManager.createQuery(jpql, Long.class)
                .setParameter("name", name.trim())
                .setParameter("type", type);
        if (excludeId != null) {
            query.setParameter("excludeId", excludeId);
        }
        return query.getSingleResult() > 0;
    }

    @Override
    public boolean isReferencedInAnyRecord(UUID categoryId) {
        Number count = (Number) entityManager.createNativeQuery("""
                SELECT (
                    SELECT COUNT(*) FROM transactions WHERE category_id = :categoryId
                ) + (
                    SELECT COUNT(*) FROM recurring_transactions WHERE category_id = :categoryId
                )
                """)
                .setParameter("categoryId", categoryId)
                .getSingleResult();
        return count.longValue() > 0;
    }

    @Override
    public void deleteById(UUID id) {
        CategoryJpaEntity entity = entityManager.find(CategoryJpaEntity.class, id);
        if (entity != null) {
            entityManager.remove(entity);
            entityManager.flush();
        }
    }
}
