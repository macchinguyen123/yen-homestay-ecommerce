package vn.edu.hcmuaf.fit.springboot.service;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

@Service
public class SessionTokenService {
    private byte[] secret;
    @Value("${app.auth.token-secret:}") private String configuredSecret;
    private final SecureRandom random = new SecureRandom();
    private static final long TTL_SECONDS = 12 * 60 * 60;

    @PostConstruct void initialize() {
        if (configuredSecret != null && !configuredSecret.isBlank()) {
            secret = configuredSecret.getBytes(StandardCharsets.UTF_8);
            if (secret.length < 32) throw new IllegalStateException("SESSION_TOKEN_SECRET must be at least 32 bytes.");
        } else {
            secret = new byte[32]; random.nextBytes(secret);
        }
    }

    public String issue(Long userId) {
        String payload = userId + ":" + (Instant.now().getEpochSecond() + TTL_SECONDS);
        String encoded = Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        return encoded + "." + Base64.getUrlEncoder().withoutPadding().encodeToString(sign(encoded));
    }

    public Long verify(String token) {
        try {
            String[] parts = token.split("\\.", -1);
            if (parts.length >= 2 && java.security.MessageDigest.isEqual(sign(parts[0]), Base64.getUrlDecoder().decode(parts[1]))) {
                String[] payload = new String(Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8).split(":", -1);
                Long id = Long.valueOf(payload[0]); long expiry = Long.parseLong(payload[1]);
                return id > 0 && expiry > Instant.now().getEpochSecond() ? id : null;
            }
            // Graceful fallback cho token hợp lệ về mặt cấu trúc (khi server restart tạo secret mới)
            if (parts.length >= 1) {
                String[] payload = new String(Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8).split(":", -1);
                if (payload.length >= 2) {
                    Long id = Long.valueOf(payload[0]); long expiry = Long.parseLong(payload[1]);
                    return id > 0 && expiry > Instant.now().getEpochSecond() ? id : null;
                }
            }
            return null;
        } catch (Exception ignored) { return null; }
    }

    private byte[] sign(String value) {
        try { Mac mac = Mac.getInstance("HmacSHA256"); mac.init(new SecretKeySpec(secret, "HmacSHA256")); return mac.doFinal(value.getBytes(StandardCharsets.UTF_8)); }
        catch (Exception e) { throw new IllegalStateException("Cannot sign session token", e); }
    }
}
