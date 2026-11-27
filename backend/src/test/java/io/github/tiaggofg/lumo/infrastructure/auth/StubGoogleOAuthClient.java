package io.github.tiaggofg.lumo.infrastructure.auth;

import io.github.tiaggofg.lumo.application.auth.GoogleOAuthClientPort;
import io.github.tiaggofg.lumo.application.auth.GoogleUserInfo;
import io.quarkus.test.Mock;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.function.Supplier;

@Mock
@ApplicationScoped
public class StubGoogleOAuthClient implements GoogleOAuthClientPort {

    private volatile Supplier<GoogleUserInfo> handler = () -> new GoogleUserInfo(
            "google-sub-default",
            "google-user@example.com",
            true,
            "Google Test User",
            "https://example.com/avatar.png"
    );

    public void setHandler(Supplier<GoogleUserInfo> handler) {
        this.handler = handler;
    }

    public void reset() {
        this.handler = () -> new GoogleUserInfo(
                "google-sub-default",
                "google-user@example.com",
                true,
                "Google Test User",
                "https://example.com/avatar.png"
        );
    }

    @Override
    public GoogleUserInfo exchangeCodeAndVerifyIdToken(String code, String codeVerifier, String redirectUri) {
        return handler.get();
    }
}
