package io.github.tiaggofg.lumo.application.auth;

import io.github.tiaggofg.lumo.application.stereotype.Command;
import io.github.tiaggofg.lumo.domain.auth.RefreshSessionRepository;
import jakarta.inject.Inject;

import java.time.Clock;
import java.time.Instant;

@Command
public class LogoutUseCase {

    private final RefreshSessionRepository refreshSessionRepository;
    private final TokenServicePort tokenService;
    private final Clock clock;

    @Inject
    public LogoutUseCase(
            RefreshSessionRepository refreshSessionRepository,
            TokenServicePort tokenService,
            Clock clock
    ) {
        this.refreshSessionRepository = refreshSessionRepository;
        this.tokenService = tokenService;
        this.clock = clock;
    }

    public void execute(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return;
        }
        String tokenHash = tokenService.sha256Hex(rawRefreshToken);
        Instant now = clock.instant();
        refreshSessionRepository.findByTokenHash(tokenHash)
                .ifPresent(session -> refreshSessionRepository.revokeIfActive(session.getId(), now));
    }
}
