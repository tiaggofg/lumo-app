package io.github.tiaggofg.lumo.application.auth;

import io.github.tiaggofg.lumo.domain.auth.AccountDisabledException;
import io.github.tiaggofg.lumo.domain.auth.DevLoginDisabledException;
import io.github.tiaggofg.lumo.domain.auth.EmailNotAllowedException;
import io.github.tiaggofg.lumo.domain.auth.OAuthAuthenticationException;
import io.github.tiaggofg.lumo.domain.auth.RefreshSession;
import io.github.tiaggofg.lumo.domain.auth.RefreshSessionRepository;
import io.github.tiaggofg.lumo.domain.auth.UnauthorizedException;
import io.github.tiaggofg.lumo.domain.auth.User;
import io.github.tiaggofg.lumo.domain.auth.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthUseCasesTest {

    private static final Instant NOW = Instant.parse("2026-11-27T12:00:00Z");
    private static final String HASH_1 = "1".repeat(64);
    private static final String HASH_2 = "2".repeat(64);

    private GoogleOAuthClientPort googleOAuthClient;
    private UserRepository userRepository;
    private RefreshSessionRepository refreshSessionRepository;
    private TokenServicePort tokenService;
    private AuthConfigPort authConfig;
    private Clock clock;

    @BeforeEach
    void setUp() {
        googleOAuthClient = mock(GoogleOAuthClientPort.class);
        userRepository = mock(UserRepository.class);
        refreshSessionRepository = mock(RefreshSessionRepository.class);
        tokenService = mock(TokenServicePort.class);
        authConfig = mock(AuthConfigPort.class);
        clock = Clock.fixed(NOW, ZoneOffset.UTC);

        when(authConfig.isEmailAllowed(any())).thenReturn(true);
        when(authConfig.refreshTokenTtl()).thenReturn(Duration.ofDays(30));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(refreshSessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(tokenService.issueAccessToken(any())).thenReturn("jwt-access-token");
        when(tokenService.generateOpaqueToken()).thenReturn("opaque-refresh-token");
        when(tokenService.sha256Hex("opaque-refresh-token")).thenReturn(HASH_1);
    }

    @Test
    void shouldCreateNewUserAndSessionOnFirstGoogleLogin() {
        when(googleOAuthClient.exchangeCodeAndVerifyIdToken("code", "verifier", "http://localhost/cb"))
                .thenReturn(new GoogleUserInfo("sub-1", "Alice@Example.com", true, "Alice", "https://pic"));
        when(userRepository.findByGoogleSub("sub-1")).thenReturn(Optional.empty());

        AuthenticateWithGoogleUseCase useCase = new AuthenticateWithGoogleUseCase(
                googleOAuthClient, userRepository, refreshSessionRepository, tokenService, authConfig, clock);

        AuthSessionResult result = useCase.execute("code", "verifier", "http://localhost/cb", "Chrome");

        assertThat(result.user().email()).isEqualTo("alice@example.com");
        assertThat(result.user().name()).isEqualTo("Alice");
        assertThat(result.accessToken()).isEqualTo("jwt-access-token");
        assertThat(result.refreshToken()).isEqualTo("opaque-refresh-token");

        ArgumentCaptor<RefreshSession> sessionCaptor = ArgumentCaptor.forClass(RefreshSession.class);
        verify(refreshSessionRepository).save(sessionCaptor.capture());
        assertThat(sessionCaptor.getValue().getTokenHash()).isEqualTo(HASH_1);
        assertThat(sessionCaptor.getValue().getExpiresAt()).isEqualTo(NOW.plus(Duration.ofDays(30)));
    }

    @Test
    void shouldUpdateExistingUserProfileWithoutDuplicatingOnRepeatedGoogleLogin() {
        User existing = User.createFromGoogle("sub-1", "old@example.com", "Old Name", null, NOW.minusSeconds(3600));
        when(googleOAuthClient.exchangeCodeAndVerifyIdToken("code", "verifier", "http://localhost/cb"))
                .thenReturn(new GoogleUserInfo("sub-1", "new@example.com", true, "New Name", "https://new"));
        when(userRepository.findByGoogleSub("sub-1")).thenReturn(Optional.of(existing));

        AuthenticateWithGoogleUseCase useCase = new AuthenticateWithGoogleUseCase(
                googleOAuthClient, userRepository, refreshSessionRepository, tokenService, authConfig, clock);

        AuthSessionResult result = useCase.execute("code", "verifier", "http://localhost/cb", "Chrome");

        assertThat(result.user().id()).isEqualTo(existing.getId());
        assertThat(result.user().name()).isEqualTo("New Name");
        assertThat(result.user().avatarUrl()).isEqualTo("https://new");
    }

    @Test
    void shouldRejectUnverifiedEmailBlockedEmailAndInactiveUserOnGoogleLogin() {
        AuthenticateWithGoogleUseCase useCase = new AuthenticateWithGoogleUseCase(
                googleOAuthClient, userRepository, refreshSessionRepository, tokenService, authConfig, clock);

        when(googleOAuthClient.exchangeCodeAndVerifyIdToken("c1", "v1", "cb"))
                .thenReturn(new GoogleUserInfo("sub", "a@b.com", false, "A", null));
        assertThatThrownBy(() -> useCase.execute("c1", "v1", "cb", null))
                .isInstanceOf(OAuthAuthenticationException.class);

        when(googleOAuthClient.exchangeCodeAndVerifyIdToken("c2", "v2", "cb"))
                .thenReturn(new GoogleUserInfo("sub", "blocked@b.com", true, "B", null));
        when(authConfig.isEmailAllowed("blocked@b.com")).thenReturn(false);
        assertThatThrownBy(() -> useCase.execute("c2", "v2", "cb", null))
                .isInstanceOf(EmailNotAllowedException.class);

        when(authConfig.isEmailAllowed("inactive@b.com")).thenReturn(true);
        User inactive = User.createFromGoogle("sub-inactive", "inactive@b.com", "Inactive", null, NOW);
        inactive.deactivate(NOW);
        when(googleOAuthClient.exchangeCodeAndVerifyIdToken("c3", "v3", "cb"))
                .thenReturn(new GoogleUserInfo("sub-inactive", "inactive@b.com", true, "Inactive", null));
        when(userRepository.findByGoogleSub("sub-inactive")).thenReturn(Optional.of(inactive));
        assertThatThrownBy(() -> useCase.execute("c3", "v3", "cb", null))
                .isInstanceOf(AccountDisabledException.class);
    }

    @Test
    void shouldAuthenticateDevUserWhenEnabledAndRejectWhenDisabled() {
        AuthenticateDevUserUseCase useCase = new AuthenticateDevUserUseCase(
                userRepository, refreshSessionRepository, tokenService, authConfig, clock);

        when(authConfig.isDevLoginEnabled()).thenReturn(false);
        assertThatThrownBy(() -> useCase.execute("Playwright"))
                .isInstanceOf(DevLoginDisabledException.class);

        when(authConfig.isDevLoginEnabled()).thenReturn(true);
        when(userRepository.findByGoogleSub(AuthenticateDevUserUseCase.DEV_GOOGLE_SUB)).thenReturn(Optional.empty());
        AuthSessionResult result = useCase.execute("Playwright");
        assertThat(result.user().email()).isEqualTo(AuthenticateDevUserUseCase.DEV_EMAIL);
        assertThat(result.user().name()).isEqualTo(AuthenticateDevUserUseCase.DEV_NAME);
    }

    @Test
    void shouldRotateRefreshSessionAndRejectReusedOrExpiredTokens() {
        User user = User.createFromGoogle("sub-1", "alice@example.com", "Alice", null, NOW);
        RefreshSession activeSession = RefreshSession.issue(user.getId(), HASH_1, "UA", NOW.minusSeconds(60), NOW.plusSeconds(3600));
        when(tokenService.sha256Hex("old-refresh")).thenReturn(HASH_1);
        when(tokenService.generateOpaqueToken()).thenReturn("new-refresh");
        when(tokenService.sha256Hex("new-refresh")).thenReturn(HASH_2);
        when(refreshSessionRepository.findByTokenHash(HASH_1)).thenReturn(Optional.of(activeSession));
        when(refreshSessionRepository.revokeIfActive(activeSession.getId(), NOW)).thenReturn(true);
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));

        RefreshSessionUseCase useCase = new RefreshSessionUseCase(
                refreshSessionRepository, userRepository, tokenService, authConfig, clock);

        AuthSessionResult result = useCase.execute("old-refresh", "UA");
        assertThat(result.refreshToken()).isEqualTo("new-refresh");
        verify(refreshSessionRepository).revokeIfActive(activeSession.getId(), NOW);

        // Reused token (atomic revoke returns false)
        when(refreshSessionRepository.revokeIfActive(activeSession.getId(), NOW)).thenReturn(false);
        assertThatThrownBy(() -> useCase.execute("old-refresh", "UA"))
                .isInstanceOf(UnauthorizedException.class);

        // Missing token
        assertThatThrownBy(() -> useCase.execute(" ", "UA"))
                .isInstanceOf(UnauthorizedException.class);

        // Expired session
        RefreshSession expired = RefreshSession.issue(user.getId(), HASH_2, "UA", NOW.minusSeconds(120), NOW.minusSeconds(10));
        when(tokenService.sha256Hex("expired")).thenReturn(HASH_2);
        when(refreshSessionRepository.findByTokenHash(HASH_2)).thenReturn(Optional.of(expired));
        assertThatThrownBy(() -> useCase.execute("expired", "UA"))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void shouldRevokeSessionOnLogoutAndReturnCurrentUser() {
        UUID userId = UUID.randomUUID();
        RefreshSession session = RefreshSession.issue(userId, HASH_1, "UA", NOW, NOW.plusSeconds(3600));
        when(tokenService.sha256Hex("raw-token")).thenReturn(HASH_1);
        when(refreshSessionRepository.findByTokenHash(HASH_1)).thenReturn(Optional.of(session));

        LogoutUseCase logoutUseCase = new LogoutUseCase(refreshSessionRepository, tokenService, clock);
        logoutUseCase.execute("raw-token");
        verify(refreshSessionRepository).revokeIfActive(session.getId(), NOW);

        logoutUseCase.execute(null);
        verify(refreshSessionRepository, never()).revokeIfActive(null, NOW);

        User activeUser = User.reconstitute(userId, "sub", "alice@example.com", "Alice", null, true, NOW, NOW);
        when(userRepository.findById(userId)).thenReturn(Optional.of(activeUser));
        GetCurrentUserUseCase getCurrentUserUseCase = new GetCurrentUserUseCase(userRepository);
        assertThat(getCurrentUserUseCase.execute(userId).email()).isEqualTo("alice@example.com");

        assertThatThrownBy(() -> getCurrentUserUseCase.execute(null))
                .isInstanceOf(UnauthorizedException.class);
    }
}
