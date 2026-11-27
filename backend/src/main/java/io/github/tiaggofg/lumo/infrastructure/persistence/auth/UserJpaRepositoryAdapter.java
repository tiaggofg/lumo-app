package io.github.tiaggofg.lumo.infrastructure.persistence.auth;

import io.github.tiaggofg.lumo.domain.auth.User;
import io.github.tiaggofg.lumo.domain.auth.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class UserJpaRepositoryAdapter implements UserRepository {

    private final EntityManager entityManager;

    @Inject
    public UserJpaRepositoryAdapter(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Override
    public Optional<User> findById(UUID id) {
        UserJpaEntity entity = entityManager.find(UserJpaEntity.class, id);
        return Optional.ofNullable(entity).map(UserJpaEntity::toDomain);
    }

    @Override
    public Optional<User> findByGoogleSub(String googleSub) {
        List<UserJpaEntity> results = entityManager.createQuery(
                        "SELECT u FROM UserJpaEntity u WHERE u.googleSub = :googleSub",
                        UserJpaEntity.class
                )
                .setParameter("googleSub", googleSub)
                .setMaxResults(1)
                .getResultList();
        return results.stream().findFirst().map(UserJpaEntity::toDomain);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        String normalized = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        List<UserJpaEntity> results = entityManager.createQuery(
                        "SELECT u FROM UserJpaEntity u WHERE LOWER(u.email) = :email",
                        UserJpaEntity.class
                )
                .setParameter("email", normalized)
                .setMaxResults(1)
                .getResultList();
        return results.stream().findFirst().map(UserJpaEntity::toDomain);
    }

    @Override
    public User save(User user) {
        UserJpaEntity merged = entityManager.merge(UserJpaEntity.fromDomain(user));
        entityManager.flush();
        return merged.toDomain();
    }
}
