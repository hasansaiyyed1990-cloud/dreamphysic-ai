package com.fitforge.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {
    private static final String DEFAULT_SECRET = "dreamphysic-ai-default-jwt-secret-key-change-in-prod";
    private final SecretKey key;
    private final long expirationMs;

    public JwtService(
            @Value("${app.jwt.secret:}") String secret,
            @Value("${app.jwt.expiration-ms:604800000}") long expirationMs) {
        this.expirationMs = expirationMs > 0 ? expirationMs : 604800000L;
        String effective = (secret == null || secret.isBlank()) ? DEFAULT_SECRET : secret.trim();
        this.key = Keys.hmacShaKeyFor(sha256(effective));
    }

    private static byte[] sha256(String input) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(input.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    private SecretKey key() { return key; }

    public String issue(UserDetails u) {
        Instant now = Instant.now();
        int tv = (u instanceof AppUser appUser) ? appUser.getTokenVersion() : 0;
        return Jwts.builder()
                .subject(u.getUsername())
                .claim("tv", tv)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationMs)))
                .signWith(key())
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser().verifyWith(key()).build().parseSignedClaims(token).getPayload();
    }

    public boolean valid(String token, UserDetails u) {
        try {
            Claims claims = parse(token);
            if (!claims.getSubject().equals(u.getUsername()) || !claims.getExpiration().after(new Date())) return false;
            if (u instanceof AppUser appUser) {
                Integer tv = claims.get("tv", Integer.class);
                return tv != null && tv == appUser.getTokenVersion();
            }
            return true;
        } catch (Exception e) { return false; }
    }
}
