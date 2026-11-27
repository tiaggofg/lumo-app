package io.github.tiaggofg.lumo.application.auth;

import io.github.tiaggofg.lumo.application.stereotype.Command;
import io.github.tiaggofg.lumo.domain.auth.AccountDisabledException;
import io.github.tiaggofg.lumo.domain.auth.EmailNotAllowedException;
import io.github.tiaggofg.lumo.domain.auth.OAuthAuthenticationException;
import io.github.tiaggofg.lumo.domain.auth.RefreshSession;
import io.github.tiaggofg.lumo.domain.auth.RefreshSessionRepository;
import io.github.tiaggofg.lumo.domain.auth.User;
import io.github.tiaggofg.lumo.domain.auth.UserRepository;
import jakarta.inject.Inject;

import java.time.Clock;
import java.time.Instant;
import java.util.Optional;

@Command
public class AuthenticateWithGoogleUseCase {

    private final GoogleOAuthClientPort googleOAuthClient;
    private final UserRepository userRepository;
    private final RefreshSessionRepository refreshSessionRepository;
    private final TokenServicePort tokenService;
    private final AuthConfigPort authConfig;
    private final Clock clock;

    @Inject
    public AuthenticateWithGoogleUseCase(
            GoogleOAuthClientPort googleOAuthClient,
            UserRepository userRepository,
            RefreshSessionRepository refreshSessionRepository,
            TokenServicePort tokenService,
            AuthConfigPort authConfig,
            Clock clock
    ) {
        this.googleOAuthClient = googleOAuthClient;
        this.userRepository = userRepository;
        this.refreshSessionRepository = refreshSessionRepository;
        this.tokenService = tokenService;
        this.authConfig = authConfig;
        this.clock = clock;
    }

    public AuthSessionResult execute(String code, String codeVerifier, String redirectUri, String userAgent) {
        GoogleUserInfo userInfo = googleOAuthClient.exchangeCodeAndVerifyIdToken(code, codeVerifier, redirectUri);
        if (!userInfo.emailVerified()) {
            throw new OAuthAuthenticationException("oauth_failed", "Google account email is not verified.");
        }
        if (!authConfig.isEmailAllowed(userInfo.email())) {
            throw new EmailNotAllowedException("Email is not authorized for this Lumo environment.");
        }

        Instant now = clock.instant();
        String displayName = resolveDisplayName(userInfo);
        Optional<User> existing = userRepository.findByGoogleSub(userInfo.sub());
        User user;
        if (existing.isPresent()) {
            user = existing.get();
            if (!user.isActive()) {
                throw new AccountDisabledException("User account is disabled.");
            }
            user.syncGoogleProfile(userInfo.email(), displayName, userInfo.avatarUrl(), now);
            user = userRepository.save(user);
        } else {
            user = User.createFromGoogle(userInfo.sub(), userInfo.email(), displayName, userInfo.avatarUrl(), now);
            user = userRepository.save(user);
        }

        return issueSession(user, userAgent, now);
    }

    private AuthSessionResult issueSession(User user, String userAgent, Instant now) {
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

    private String resolveDisplayName(GoogleUserInfo userInfo) {
        if (userInfo.name() != null && !userInfo.name().isBlank()) {
            return userInfo.name();
        }
        return userInfo.email();
    }
}
