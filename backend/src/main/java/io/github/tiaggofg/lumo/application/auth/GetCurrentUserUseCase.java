package io.github.tiaggofg.lumo.application.auth;

import io.github.tiaggofg.lumo.application.stereotype.Query;
import io.github.tiaggofg.lumo.domain.auth.UnauthorizedException;
import io.github.tiaggofg.lumo.domain.auth.User;
import io.github.tiaggofg.lumo.domain.auth.UserRepository;
import jakarta.inject.Inject;

import java.util.UUID;

@Query
public class GetCurrentUserUseCase {

    private final UserRepository userRepository;

    @Inject
    public GetCurrentUserUseCase(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserSummary execute(UUID userId) {
        if (userId == null) {
            throw new UnauthorizedException("Authentication is required.");
        }
        User user = userRepository.findById(userId)
                .filter(User::isActive)
                .orElseThrow(() -> new UnauthorizedException("Authenticated user not found or inactive."));
        return UserSummary.from(user);
    }
}
