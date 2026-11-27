package io.github.tiaggofg.lumo.domain.auth;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository {

    Optional<User> findById(UUID id);

    Optional<User> findByGoogleSub(String googleSub);

    Optional<User> findByEmail(String email);

    User save(User user);
}
