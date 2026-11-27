package io.github.tiaggofg.lumo.application.auth;

import io.github.tiaggofg.lumo.application.stereotype.Command;
import io.github.tiaggofg.lumo.domain.auth.RefreshSession;
import io.github.tiaggofg.lumo.domain.auth.RefreshSessionRepository;
import io.github.tiaggofg.lumo.domain.auth.UnauthorizedException;
import io.github.tiaggofg.lumo.domain.auth.User;
import io.github.tiaggofg.lumo.domain.auth.UserRepository;
import jakarta.inject.Inject;

import java.time.Clock;
import java.time.Instant;

@Command
public class RefreshSessionUseCase {

    private final RefreshSessionRepository refreshSessionRepository;
    private final UserRepository userRepository;
    private final TokenServicePort tokenService;
    private final AuthConfigPort authConfig;
    private final Clock clock;

    @Inject
    public RefreshSessionUseCase(
            RefreshSessionRepository refreshSessionRepository,
            UserRepository userRepository,
            TokenServicePort tokenService,
            AuthConfigPort authConfig,
            Clock clock
    ) {
        this.refreshSessionRepository = refreshSessionRepository;
        this.userRepository = userRepository;
        this.tokenService = tokenService;
        this.authConfig = authConfig;
        this.clock = clock;
    }

    public AuthSessionResult execute(String rawRefreshToken, String userAgent) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new UnauthorizedException("Refresh token is missing.");
        }

        Instant now = clock.instant();
        String tokenHash = tokenService.sha256Hex(rawRefreshToken);
        RefreshSession existing = refreshSessionRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new UnauthorizedException("Refresh session is invalid."));

        if (!existing.isUsableAt(now)) {
            throw new UnauthorizedException("Refresh session has expired or been revoked.");
        }

        boolean revoked = refreshSessionRepository.revokeIfActive(existing.getId(), now);
        if (!revoked) {
            throw new UnauthorizedException("Refresh session has already been used.");
        }

        User user = userRepository.findById(existing.getUserId())
                .filter(User::isActive)
                .orElseThrow(() -> new UnauthorizedException("User account is inactive or unavailable."));

        String newAccessToken = tokenService.issueAccessToken(user);
        String newRawRefreshToken = tokenService.generateOpaqueToken();
        String newTokenHash = tokenService.sha256Hex(newRawRefreshToken);

        RefreshSession rotated = RefreshSession.issue(
                user.getId(),
                newTokenHash,
                userAgent,
                now,
                now.plus(authConfig.refreshTokenTtl())
        );
        refreshSessionRepository.save(rotated);
        return new AuthSessionResult(UserSummary.from(user), newAccessToken, newRawRefreshToken);
    }
}
