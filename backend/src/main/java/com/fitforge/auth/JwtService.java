package com.fitforge.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {
    private final SecretKey key;
    private final long expirationMs;
    public JwtService(@Value("${app.jwt.secret}") String secret, @Value("${app.jwt.expiration-ms:604800000}") long expirationMs) {
        this.expirationMs = expirationMs;
        byte[] bytes;
        try { bytes = Decoders.BASE64.decode(secret); } catch (RuntimeException notBase64) { bytes = secret.getBytes(java.nio.charset.StandardCharsets.UTF_8); }
        if (bytes.length < 32) throw new IllegalStateException("JWT_SECRET must be at least 256 bits (32 bytes)");
        if (expirationMs <= 0) throw new IllegalArgumentException("JWT expiration must be positive");
        this.key = Keys.hmacShaKeyFor(bytes);
    }
    private SecretKey key(){return key;}
    public String issue(UserDetails u){
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
    public Claims parse(String token){return Jwts.parser().verifyWith(key()).build().parseSignedClaims(token).getPayload();}
    public boolean valid(String token, UserDetails u){
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
