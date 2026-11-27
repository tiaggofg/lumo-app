package io.github.tiaggofg.lumo.infrastructure.auth;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.tiaggofg.lumo.application.auth.AccessTokenClaims;
import io.github.tiaggofg.lumo.application.auth.TokenServicePort;
import io.github.tiaggofg.lumo.domain.auth.User;
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
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class JwtTokenService implements TokenServicePort {

    private static final String HMAC_SHA256 = "HmacSHA256";
    private static final String JWT_HEADER_B64 = Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    private final AuthConfig authConfig;
    private final ObjectMapper objectMapper;
    private final Clock clock;
    private final SecureRandom secureRandom = new SecureRandom();

    @Inject
    public JwtTokenService(AuthConfig authConfig, ObjectMapper objectMapper, Clock clock) {
        this.authConfig = authConfig;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    @Override
    public String issueAccessToken(User user) {
        Instant now = clock.instant();
        Instant expiresAt = now.plus(authConfig.accessTokenTtl());

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sub", user.getId().toString());
        payload.put("email", user.getEmail());
        payload.put("iat", now.getEpochSecond());
        payload.put("exp", expiresAt.getEpochSecond());

        try {
            byte[] payloadBytes = objectMapper.writeValueAsBytes(payload);
            String payloadB64 = Base64.getUrlEncoder().withoutPadding().encodeToString(payloadBytes);
            String signingInput = JWT_HEADER_B64 + "." + payloadB64;
            String signatureB64 = Base64.getUrlEncoder().withoutPadding().encodeToString(hmacSha256(signingInput));
            return signingInput + "." + signatureB64;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to sign access token.", e);
        }
    }

    @Override
    public Optional<AccessTokenClaims> verifyAccessToken(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            return Optional.empty();
        }
        try {
            Map<String, Object> header = objectMapper.readValue(
                    Base64.getUrlDecoder().decode(parts[0]),
                    MAP_TYPE
            );
            if (!"HS256".equals(header.get("alg"))) {
                return Optional.empty();
            }

            String signingInput = parts[0] + "." + parts[1];
            byte[] expectedSignature = hmacSha256(signingInput);
            byte[] actualSignature = Base64.getUrlDecoder().decode(parts[2]);
            if (!MessageDigest.isEqual(expectedSignature, actualSignature)) {
                return Optional.empty();
            }

            Map<String, Object> payload = objectMapper.readValue(
                    Base64.getUrlDecoder().decode(parts[1]),
                    MAP_TYPE
            );
            Object subObj = payload.get("sub");
            Object emailObj = payload.get("email");
            Object expObj = payload.get("exp");
            if (!(subObj instanceof String sub) || !(emailObj instanceof String email) || !(expObj instanceof Number expNum)) {
                return Optional.empty();
            }

            Instant expiresAt = Instant.ofEpochSecond(expNum.longValue());
            if (!expiresAt.isAfter(clock.instant())) {
                return Optional.empty();
            }

            return Optional.of(new AccessTokenClaims(UUID.fromString(sub), email, expiresAt));
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    @Override
    public String generateOpaqueToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    @Override
    public String sha256Hex(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("SHA-256 algorithm unavailable.", e);
        }
    }

    byte[] hmacSha256(String data) {
        String secret = authConfig.jwtSecret().orElse("");
        if (secret.isBlank()) {
            throw new IllegalStateException("JWT secret is not configured.");
        }
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256));
            return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Failed to compute HMAC-SHA256.", e);
        }
    }
}
