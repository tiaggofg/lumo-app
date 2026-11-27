package io.github.tiaggofg.lumo.infrastructure.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import io.github.tiaggofg.lumo.application.auth.GoogleUserInfo;
import io.github.tiaggofg.lumo.domain.auth.OAuthAuthenticationException;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Signature;
import java.security.interfaces.RSAPublicKey;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@QuarkusTest
class GoogleOAuthHttpClientIT {

    private static final Instant NOW = Instant.parse("2026-11-27T12:00:00Z");
    private static final String CLIENT_ID = "google-it-client-id";

    private HttpServer server;
    private ObjectMapper objectMapper;
    private KeyPair keyPair1;
    private KeyPair keyPair2;
    private AtomicReference<String> tokenResponseBody;
    private AtomicInteger tokenStatusCode;
    private AtomicReference<String> jwksResponseBody;
    private AtomicInteger jwksStatusCode;

    @BeforeEach
    void setUp() throws Exception {
        objectMapper = new ObjectMapper();
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048);
        keyPair1 = kpg.generateKeyPair();
        keyPair2 = kpg.generateKeyPair();

        tokenResponseBody = new AtomicReference<>("{}");
        tokenStatusCode = new AtomicInteger(200);
        jwksResponseBody = new AtomicReference<>(buildJwksJson("kid-1", (RSAPublicKey) keyPair1.getPublic()));
        jwksStatusCode = new AtomicInteger(200);

        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/token", exchange -> {
            byte[] body = tokenResponseBody.get().getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(tokenStatusCode.get(), body.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(body);
            }
        });
        server.createContext("/certs", exchange -> {
            byte[] body = jwksResponseBody.get().getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.getResponseHeaders().add("Cache-Control", "public, max-age=3600");
            exchange.sendResponseHeaders(jwksStatusCode.get(), body.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(body);
            }
        });
        server.start();
    }

    @AfterEach
    void tearDown() {
        if (server != null) {
            server.stop(0);
        }
    }

    private GoogleOAuthHttpClient createClient(Optional<String> clientId, Optional<String> clientSecret) {
        String baseUrl = "http://127.0.0.1:" + server.getAddress().getPort();
        AuthConfig config = mock(AuthConfig.class);
        AuthConfig.GoogleConfig google = mock(AuthConfig.GoogleConfig.class);
        when(config.google()).thenReturn(google);
        when(google.clientId()).thenReturn(clientId);
        when(google.clientSecret()).thenReturn(clientSecret);
        when(google.tokenUri()).thenReturn(baseUrl + "/token");
        when(google.jwksUri()).thenReturn(baseUrl + "/certs");
        when(google.httpTimeoutSeconds()).thenReturn(2);
        return new GoogleOAuthHttpClient(config, objectMapper, Clock.fixed(NOW, ZoneOffset.UTC));
    }

    @Test
    void shouldExerciseFullGoogleOAuthHttpClientSuccessRotationAndErrorPaths() throws Exception {
        // Missing credentials
        GoogleOAuthHttpClient unconfigured = createClient(Optional.empty(), Optional.empty());
        assertThatThrownBy(() -> unconfigured.exchangeCodeAndVerifyIdToken("c", "v", "cb"))
                .isInstanceOf(OAuthAuthenticationException.class);

        GoogleOAuthHttpClient client = createClient(Optional.of(CLIENT_ID), Optional.of("secret"));

        // Valid token + cache hit + key rotation
        String idToken1 = signIdToken(keyPair1, "kid-1", "https://accounts.google.com", CLIENT_ID, NOW.plusSeconds(300));
        tokenResponseBody.set("{\"id_token\":\"" + idToken1 + "\"}");
        GoogleUserInfo info = client.exchangeCodeAndVerifyIdToken("code", "verifier", "http://localhost/cb");
        assertThat(info.email()).isEqualTo("tiago@example.com");
        assertThat(client.exchangeCodeAndVerifyIdToken("code", "verifier", "http://localhost/cb").sub()).isEqualTo("google-sub-42");

        jwksResponseBody.set(buildJwksJson("kid-2", (RSAPublicKey) keyPair2.getPublic()));
        String idToken2 = signIdToken(keyPair2, "kid-2", "accounts.google.com", CLIENT_ID, NOW.plusSeconds(300));
        tokenResponseBody.set("{\"id_token\":\"" + idToken2 + "\"}");
        assertThat(client.exchangeCodeAndVerifyIdToken("code", "verifier", "http://localhost/cb").emailVerified()).isTrue();

        // Unknown kid after refresh
        String unknownKid = signIdToken(keyPair1, "kid-missing", "https://accounts.google.com", CLIENT_ID, NOW.plusSeconds(300));
        tokenResponseBody.set("{\"id_token\":\"" + unknownKid + "\"}");
        assertThatThrownBy(() -> client.exchangeCodeAndVerifyIdToken("c", "v", "cb"))
                .isInstanceOf(OAuthAuthenticationException.class);

        // Wrong issuer, wrong aud, expired, tampered, 400, 500, missing id_token, jwks 500
        String badIss = signIdToken(keyPair2, "kid-2", "https://evil.com", CLIENT_ID, NOW.plusSeconds(300));
        tokenResponseBody.set("{\"id_token\":\"" + badIss + "\"}");
        assertThatThrownBy(() -> client.exchangeCodeAndVerifyIdToken("c", "v", "cb"))
                .isInstanceOf(OAuthAuthenticationException.class);

        String badAud = signIdToken(keyPair2, "kid-2", "https://accounts.google.com", "other", NOW.plusSeconds(300));
        tokenResponseBody.set("{\"id_token\":\"" + badAud + "\"}");
        assertThatThrownBy(() -> client.exchangeCodeAndVerifyIdToken("c", "v", "cb"))
                .isInstanceOf(OAuthAuthenticationException.class);

        String expired = signIdToken(keyPair2, "kid-2", "https://accounts.google.com", CLIENT_ID, NOW.minusSeconds(10));
        tokenResponseBody.set("{\"id_token\":\"" + expired + "\"}");
        assertThatThrownBy(() -> client.exchangeCodeAndVerifyIdToken("c", "v", "cb"))
                .isInstanceOf(OAuthAuthenticationException.class);

        String tampered = idToken2.substring(0, idToken2.length() - 4) + "AAAA";
        tokenResponseBody.set("{\"id_token\":\"" + tampered + "\"}");
        assertThatThrownBy(() -> client.exchangeCodeAndVerifyIdToken("c", "v", "cb"))
                .isInstanceOf(OAuthAuthenticationException.class);

        tokenResponseBody.set("{}");
        assertThatThrownBy(() -> client.exchangeCodeAndVerifyIdToken("c", "v", "cb"))
                .isInstanceOf(OAuthAuthenticationException.class);

        tokenStatusCode.set(400);
        assertThatThrownBy(() -> client.exchangeCodeAndVerifyIdToken("c", "v", "cb"))
                .isInstanceOf(OAuthAuthenticationException.class);

        tokenStatusCode.set(500);
        assertThatThrownBy(() -> client.exchangeCodeAndVerifyIdToken("c", "v", "cb"))
                .isInstanceOf(OAuthAuthenticationException.class);

        tokenStatusCode.set(200);
        jwksStatusCode.set(500);
        tokenResponseBody.set("{\"id_token\":\"" + unknownKid + "\"}");
        assertThatThrownBy(() -> client.exchangeCodeAndVerifyIdToken("c", "v", "cb"))
                .isInstanceOf(OAuthAuthenticationException.class);
    }

    private String signIdToken(KeyPair kp, String kid, String iss, String aud, Instant exp) throws Exception {
        Map<String, Object> header = Map.of("alg", "RS256", "typ", "JWT", "kid", kid);
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("iss", iss);
        payload.put("aud", aud);
        payload.put("exp", exp.getEpochSecond());
        payload.put("sub", "google-sub-42");
        payload.put("email", "tiago@example.com");
        payload.put("email_verified", true);
        payload.put("name", "Tiago Godoy");
        payload.put("picture", "https://example.com/pic.png");

        String h = Base64.getUrlEncoder().withoutPadding().encodeToString(objectMapper.writeValueAsBytes(header));
        String p = Base64.getUrlEncoder().withoutPadding().encodeToString(objectMapper.writeValueAsBytes(payload));
        String signingInput = h + "." + p;

        Signature sig = Signature.getInstance("SHA256withRSA");
        sig.initSign(kp.getPrivate());
        sig.update(signingInput.getBytes(StandardCharsets.US_ASCII));
        String s = Base64.getUrlEncoder().withoutPadding().encodeToString(sig.sign());
        return signingInput + "." + s;
    }

    private String buildJwksJson(String kid, RSAPublicKey publicKey) throws IOException {
        byte[] nBytes = unsignedBytes(publicKey.getModulus().toByteArray());
        byte[] eBytes = unsignedBytes(publicKey.getPublicExponent().toByteArray());
        Map<String, Object> jwk = Map.of(
                "kty", "RSA",
                "kid", kid,
                "alg", "RS256",
                "use", "sig",
                "n", Base64.getUrlEncoder().withoutPadding().encodeToString(nBytes),
                "e", Base64.getUrlEncoder().withoutPadding().encodeToString(eBytes)
        );
        return objectMapper.writeValueAsString(Map.of("keys", List.of(jwk)));
    }

    private byte[] unsignedBytes(byte[] raw) {
        if (raw.length > 1 && raw[0] == 0) {
            byte[] trimmed = new byte[raw.length - 1];
            System.arraycopy(raw, 1, trimmed, 0, trimmed.length);
            return trimmed;
        }
        return raw;
    }
}
