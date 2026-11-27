package io.github.tiaggofg.lumo.infrastructure.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;

@ApplicationScoped
public class OAuthStateCookieCodec {

    public static final String DEFAULT_RETURN_URL = "/dashboard";
    private static final String HMAC_SHA256 = "HmacSHA256";

    private final AuthConfig authConfig;
    private final ObjectMapper objectMapper;
    private final Clock clock;
    private final SecureRandom secureRandom = new SecureRandom();

    @Inject
    public OAuthStateCookieCodec(AuthConfig authConfig, ObjectMapper objectMapper, Clock clock) {
        this.authConfig = authConfig;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    public OAuthStatePayload createStatePayload(String rawReturnUrl) {
        String state = randomBase64Url(24);
        String codeVerifier = randomBase64Url(32);
        String returnUrl = sanitizeReturnUrl(rawReturnUrl);
        long exp = clock.instant().plus(authConfig.oauthStateTtl()).getEpochSecond();
        return new OAuthStatePayload(state, codeVerifier, returnUrl, exp);
    }

    public String computePkceS256Challenge(String codeVerifier) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(codeVerifier.getBytes(StandardCharsets.US_ASCII));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hashed);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("SHA-256 algorithm unavailable.", e);
        }
    }

    public String encode(OAuthStatePayload payload) {
        try {
            byte[] json = objectMapper.writeValueAsBytes(payload);
            String bodyB64 = Base64.getUrlEncoder().withoutPadding().encodeToString(json);
            String sigB64 = Base64.getUrlEncoder().withoutPadding().encodeToString(hmacSha256(bodyB64));
            return bodyB64 + "." + sigB64;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to encode OAuth state cookie.", e);
        }
    }

    public Optional<OAuthStatePayload> decodeAndVerify(String cookieValue) {
        if (cookieValue == null || cookieValue.isBlank()) {
            return Optional.empty();
        }
        String[] parts = cookieValue.split("\\.");
        if (parts.length != 2) {
            return Optional.empty();
        }
        try {
            byte[] expectedSig = hmacSha256(parts[0]);
            byte[] actualSig = Base64.getUrlDecoder().decode(parts[1]);
            if (!MessageDigest.isEqual(expectedSig, actualSig)) {
                return Optional.empty();
            }
            byte[] json = Base64.getUrlDecoder().decode(parts[0]);
            OAuthStatePayload payload = objectMapper.readValue(json, OAuthStatePayload.class);
            if (payload.state() == null || payload.codeVerifier() == null) {
                return Optional.empty();
            }
            if (!Instant.ofEpochSecond(payload.exp()).isAfter(clock.instant())) {
                return Optional.empty();
            }
            return Optional.of(new OAuthStatePayload(
                    payload.state(),
                    payload.codeVerifier(),
                    sanitizeReturnUrl(payload.returnUrl()),
                    payload.exp()
            ));
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    public static String sanitizeReturnUrl(String rawReturnUrl) {
        if (rawReturnUrl == null || rawReturnUrl.isBlank()) {
            return DEFAULT_RETURN_URL;
        }
        String trimmed = rawReturnUrl.trim();
        if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.contains("\\")) {
            return DEFAULT_RETURN_URL;
        }
        if (trimmed.contains("\r") || trimmed.contains("\n") || trimmed.contains("://")) {
            return DEFAULT_RETURN_URL;
        }
        if (trimmed.equals("/login") || trimmed.startsWith("/login?")) {
            return DEFAULT_RETURN_URL;
        }
        return trimmed;
    }

    private String randomBase64Url(int byteLength) {
        byte[] bytes = new byte[byteLength];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private byte[] hmacSha256(String data) throws GeneralSecurityException {
        String secret = authConfig.jwtSecret().orElse("");
        if (secret.isBlank()) {
            throw new IllegalStateException("JWT secret is not configured.");
        }
        Mac mac = Mac.getInstance(HMAC_SHA256);
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256));
        return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
    }

    public record OAuthStatePayload(
            String state,
            String codeVerifier,
            String returnUrl,
            long exp
    ) {
    }
}
