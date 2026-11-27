package io.github.tiaggofg.lumo.application.auth;

public interface GoogleOAuthClientPort {

    GoogleUserInfo exchangeCodeAndVerifyIdToken(String code, String codeVerifier, String redirectUri);
}
