package io.github.tiaggofg.lumo.infrastructure.auth;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.tiaggofg.lumo.application.auth.GoogleOAuthClientPort;
import io.github.tiaggofg.lumo.application.auth.GoogleUserInfo;
import io.github.tiaggofg.lumo.domain.auth.OAuthAuthenticationException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.math.BigInteger;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.RSAPublicKeySpec;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@ApplicationScoped
public class GoogleOAuthHttpClient implements GoogleOAuthClientPort {

    private static final Logger LOG = Logger.getLogger(GoogleOAuthHttpClient.class);
    private static final String ERROR_PROVIDER_UNAVAILABLE = "provider_unavailable";
    private static final String ERROR_OAUTH_FAILED = "oauth_failed";
    private static final Set<String> VALID_ISSUERS = Set.of("https://accounts.google.com", "accounts.google.com");
    private static final Pattern MAX_AGE_PATTERN = Pattern.compile("max-age=(\\d+)");
    private static final Duration DEFAULT_JWKS_CACHE_TTL = Duration.ofHours(1);
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    private final AuthConfig authConfig;
    private final ObjectMapper objectMapper;
    private final Clock clock;
    private final HttpClient httpClient;

    private final AtomicReference<JwksCacheEntry> jwksCache =
            new AtomicReference<>(new JwksCacheEntry(Map.of(), Instant.EPOCH));

    @Inject
    public GoogleOAuthHttpClient(AuthConfig authConfig, ObjectMapper objectMapper, Clock clock) {
        this.authConfig = authConfig;
        this.objectMapper = objectMapper;
        this.clock = clock;
        int timeoutSeconds = Math.max(1, authConfig.google().httpTimeoutSeconds());
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(timeoutSeconds))
                .build();
    }

    @Override
    public GoogleUserInfo exchangeCodeAndVerifyIdToken(String code, String codeVerifier, String redirectUri) {
        String clientId = authConfig.google().clientId().orElse("").trim();
        String clientSecret = authConfig.google().clientSecret().orElse("").trim();
        if (clientId.isEmpty() || clientSecret.isEmpty()) {
            throw new OAuthAuthenticationException(ERROR_PROVIDER_UNAVAILABLE, "Google OAuth credentials are not configured.");
        }

        String idToken = exchangeCodeForIdToken(code, codeVerifier, clientId, clientSecret, redirectUri);
        return verifyIdToken(idToken, clientId);
    }

    private String exchangeCodeForIdToken(
            String code,
            String codeVerifier,
            String clientId,
            String clientSecret,
            String redirectUri
    ) {
        String formBody = "grant_type=authorization_code"
                + "&code=" + urlEncode(code)
                + "&code_verifier=" + urlEncode(codeVerifier)
                + "&client_id=" + urlEncode(clientId)
                + "&client_secret=" + urlEncode(clientSecret)
                + "&redirect_uri=" + urlEncode(redirectUri);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(authConfig.google().tokenUri()))
                .timeout(Duration.ofSeconds(Math.max(1, authConfig.google().httpTimeoutSeconds())))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(formBody))
                .build();

        HttpResponse<String> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            LOG.warn("Google OAuth token exchange interrupted.");
            throw new OAuthAuthenticationException(ERROR_PROVIDER_UNAVAILABLE, "Google OAuth token exchange interrupted.", e);
        } catch (Exception e) {
            LOG.warnf("Google OAuth token exchange failed due to transport error: %s", e.getClass().getSimpleName());
            throw new OAuthAuthenticationException(ERROR_PROVIDER_UNAVAILABLE, "Google OAuth token endpoint unavailable.", e);
        }

        if (response.statusCode() >= 500) {
            LOG.warnf("Google OAuth token endpoint returned HTTP %d", response.statusCode());
            throw new OAuthAuthenticationException(ERROR_PROVIDER_UNAVAILABLE, "Google OAuth token endpoint returned server error.");
        }
        if (response.statusCode() != 200) {
            LOG.warnf("Google OAuth token exchange rejected with HTTP %d", response.statusCode());
            throw new OAuthAuthenticationException(ERROR_OAUTH_FAILED, "Google OAuth token exchange was rejected.");
        }

        try {
            JsonNode json = objectMapper.readTree(response.body());
            String idToken = json.path("id_token").asText("");
            if (idToken.isBlank()) {
                throw new OAuthAuthenticationException(ERROR_OAUTH_FAILED, "Google token response did not include an id_token.");
            }
            return idToken;
        } catch (OAuthAuthenticationException e) {
            throw e;
        } catch (Exception e) {
            throw new OAuthAuthenticationException(ERROR_OAUTH_FAILED, "Failed to parse Google token response.", e);
        }
    }

    private GoogleUserInfo verifyIdToken(String idToken, String expectedClientId) {
        String[] parts = idToken.split("\\.");
        if (parts.length != 3) {
            throw new OAuthAuthenticationException(ERROR_OAUTH_FAILED, "Malformed Google id_token.");
        }

        Map<String, Object> header = decodeJsonPart(parts[0]);
        Map<String, Object> payload = decodeJsonPart(parts[1]);

        if (!"RS256".equals(header.get("alg"))) {
            throw new OAuthAuthenticationException(ERROR_OAUTH_FAILED, "Unsupported id_token algorithm.");
        }
        Object kidObj = header.get("kid");
        if (!(kidObj instanceof String kid) || kid.isBlank()) {
            throw new OAuthAuthenticationException(ERROR_OAUTH_FAILED, "Missing kid in Google id_token header.");
        }

        PublicKey publicKey = resolvePublicKey(kid);
        verifyRsaSignature(parts[0] + "." + parts[1], parts[2], publicKey);

        Object issObj = payload.get("iss");
        if (!(issObj instanceof String iss) || !VALID_ISSUERS.contains(iss)) {
            throw new OAuthAuthenticationException(ERROR_OAUTH_FAILED, "Invalid Google id_token issuer.");
        }

        Object audObj = payload.get("aud");
        if (!(audObj instanceof String aud) || !expectedClientId.equals(aud)) {
            throw new OAuthAuthenticationException(ERROR_OAUTH_FAILED, "Invalid Google id_token audience.");
        }

        Object expObj = payload.get("exp");
        if (!(expObj instanceof Number expNum)) {
            throw new OAuthAuthenticationException(ERROR_OAUTH_FAILED, "Missing exp claim in Google id_token.");
        }
        if (!Instant.ofEpochSecond(expNum.longValue()).isAfter(clock.instant())) {
            throw new OAuthAuthenticationException(ERROR_OAUTH_FAILED, "Google id_token is expired.");
        }

        String sub = asNonBlankString(payload.get("sub"), "sub");
        String email = asNonBlankString(payload.get("email"), "email");
        boolean emailVerified = Boolean.TRUE.equals(payload.get("email_verified"))
                || "true".equalsIgnoreCase(String.valueOf(payload.get("email_verified")));
        String name = payload.get("name") instanceof String s ? s : email;
        String picture = payload.get("picture") instanceof String s ? s : null;

        return new GoogleUserInfo(sub, email, emailVerified, name, picture);
    }

    private PublicKey resolvePublicKey(String kid) {
        Instant now = clock.instant();
        JwksCacheEntry current = jwksCache.get();
        if (current.expiresAt().isAfter(now)) {
            PublicKey cached = current.keys().get(kid);
            if (cached != null) {
                return cached;
            }
        }
        refreshJwks();
        PublicKey key = jwksCache.get().keys().get(kid);
        if (key == null) {
            throw new OAuthAuthenticationException(ERROR_OAUTH_FAILED, "Unknown signing key id in Google id_token.");
        }
        return key;
    }

    private synchronized void refreshJwks() {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(authConfig.google().jwksUri()))
                .timeout(Duration.ofSeconds(Math.max(1, authConfig.google().httpTimeoutSeconds())))
                .header("Accept", "application/json")
                .GET()
                .build();

        HttpResponse<String> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new OAuthAuthenticationException(ERROR_PROVIDER_UNAVAILABLE, "Google JWKS fetch interrupted.", e);
        } catch (Exception e) {
            LOG.warnf("Google JWKS fetch failed: %s", e.getClass().getSimpleName());
            throw new OAuthAuthenticationException(ERROR_PROVIDER_UNAVAILABLE, "Google JWKS endpoint unavailable.", e);
        }

        if (response.statusCode() != 200) {
            LOG.warnf("Google JWKS endpoint returned HTTP %d", response.statusCode());
            throw new OAuthAuthenticationException(ERROR_PROVIDER_UNAVAILABLE, "Google JWKS endpoint returned error.");
        }

        try {
            JsonNode root = objectMapper.readTree(response.body());
            JsonNode keysNode = root.path("keys");
            Map<String, PublicKey> parsed = new HashMap<>();
            if (keysNode.isArray()) {
                KeyFactory rsaFactory = KeyFactory.getInstance("RSA");
                for (JsonNode keyNode : keysNode) {
                    if (!"RSA".equals(keyNode.path("kty").asText())) {
                        continue;
                    }
                    String kid = keyNode.path("kid").asText("");
                    String n = keyNode.path("n").asText("");
                    String e = keyNode.path("e").asText("");
                    if (!kid.isBlank() && !n.isBlank() && !e.isBlank()) {
                        BigInteger modulus = new BigInteger(1, Base64.getUrlDecoder().decode(n));
                        BigInteger exponent = new BigInteger(1, Base64.getUrlDecoder().decode(e));
                        parsed.put(kid, rsaFactory.generatePublic(new RSAPublicKeySpec(modulus, exponent)));
                    }
                }
            }
            Duration ttl = parseCacheMaxAge(response.headers().firstValue("Cache-Control").orElse(""));
            jwksCache.set(new JwksCacheEntry(Map.copyOf(parsed), clock.instant().plus(ttl)));
        } catch (OAuthAuthenticationException e) {
            throw e;
        } catch (Exception e) {
            throw new OAuthAuthenticationException(ERROR_PROVIDER_UNAVAILABLE, "Failed to parse Google JWKS response.", e);
        }
    }

    private void verifyRsaSignature(String signingInput, String signatureB64, PublicKey publicKey) {
        try {
            Signature signature = Signature.getInstance("SHA256withRSA");
            signature.initVerify(publicKey);
            signature.update(signingInput.getBytes(StandardCharsets.US_ASCII));
            byte[] sigBytes = Base64.getUrlDecoder().decode(signatureB64);
            if (!signature.verify(sigBytes)) {
                throw new OAuthAuthenticationException(ERROR_OAUTH_FAILED, "Google id_token signature verification failed.");
            }
        } catch (OAuthAuthenticationException e) {
            throw e;
        } catch (Exception e) {
            throw new OAuthAuthenticationException(ERROR_OAUTH_FAILED, "Failed to verify Google id_token signature.", e);
        }
    }

    private Map<String, Object> decodeJsonPart(String b64Url) {
        try {
            byte[] decoded = Base64.getUrlDecoder().decode(b64Url);
            return objectMapper.readValue(decoded, MAP_TYPE);
        } catch (Exception e) {
            throw new OAuthAuthenticationException(ERROR_OAUTH_FAILED, "Failed to decode Google id_token payload.", e);
        }
    }

    private String asNonBlankString(Object value, String claimName) {
        if (!(value instanceof String str) || str.isBlank()) {
            throw new OAuthAuthenticationException(ERROR_OAUTH_FAILED, "Missing required claim in Google id_token: " + claimName);
        }
        return str;
    }

    private Duration parseCacheMaxAge(String cacheControl) {
        Matcher matcher = MAX_AGE_PATTERN.matcher(cacheControl);
        if (matcher.find()) {
            long seconds = Long.parseLong(matcher.group(1));
            if (seconds > 0) {
                return Duration.ofSeconds(seconds);
            }
        }
        return DEFAULT_JWKS_CACHE_TTL;
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }

    private record JwksCacheEntry(Map<String, PublicKey> keys, Instant expiresAt) {
    }
}
