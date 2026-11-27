package io.github.tiaggofg.lumo.application.auth;

import io.github.tiaggofg.lumo.application.stereotype.Command;
import io.github.tiaggofg.lumo.domain.auth.AccountDisabledException;
import io.github.tiaggofg.lumo.domain.auth.DevLoginDisabledException;
import io.github.tiaggofg.lumo.domain.auth.RefreshSession;
import io.github.tiaggofg.lumo.domain.auth.RefreshSessionRepository;
import io.github.tiaggofg.lumo.domain.auth.User;
import io.github.tiaggofg.lumo.domain.auth.UserRepository;
import jakarta.inject.Inject;

import java.time.Clock;
import java.time.Instant;
import java.util.Optional;

@Command
public class AuthenticateDevUserUseCase {

    public static final String DEV_GOOGLE_SUB = "dev-local-user";
    public static final String DEV_EMAIL = "dev@lumo.local";
    public static final String DEV_NAME = "Desenvolvedor Lumo";

    private final UserRepository userRepository;
    private final RefreshSessionRepository refreshSessionRepository;
    private final TokenServicePort tokenService;
    private final AuthConfigPort authConfig;
    private final Clock clock;

    @Inject
    public AuthenticateDevUserUseCase(
            UserRepository userRepository,
            RefreshSessionRepository refreshSessionRepository,
            TokenServicePort tokenService,
            AuthConfigPort authConfig,
            Clock clock
    ) {
        this.userRepository = userRepository;
        this.refreshSessionRepository = refreshSessionRepository;
        this.tokenService = tokenService;
        this.authConfig = authConfig;
        this.clock = clock;
    }

    public AuthSessionResult execute(String userAgent) {
        if (!authConfig.isDevLoginEnabled()) {
            throw new DevLoginDisabledException();
        }

        Instant now = clock.instant();
        Optional<User> existing = userRepository.findByGoogleSub(DEV_GOOGLE_SUB);
        User user;
        if (existing.isPresent()) {
            user = existing.get();
            if (!user.isActive()) {
                throw new AccountDisabledException("Development user account is disabled.");
            }
            user.syncGoogleProfile(DEV_EMAIL, DEV_NAME, null, now);
            user = userRepository.save(user);
        } else {
            user = User.createFromGoogle(DEV_GOOGLE_SUB, DEV_EMAIL, DEV_NAME, null, now);
            user = userRepository.save(user);
        }

        String accessToken = tokenService.issueAccessToken(user);
        String rawRefreshToken = tokenService.generateOpaqueToken();
        String tokenHash = tokenService.sha256Hex(rawRefreshToken);

        RefreshSession session = RefreshSession.issue(
                user.getId(),
                tokenHash,
                userAgent,
                now,
                now.plus(authConfig.refreshTokenTtl())
        );
        refreshSessionRepository.save(session);
        return new AuthSessionResult(UserSummary.from(user), accessToken, rawRefreshToken);
    }
}
