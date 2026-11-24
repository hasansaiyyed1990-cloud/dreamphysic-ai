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
    public JwtService(@Value("${app.jwt.secret}") String secret, @Value("${app.jwt.expiration-ms:86400000}") long expirationMs) {
        this.expirationMs=expirationMs;
        byte[] bytes;
        try { bytes = Decoders.BASE64.decode(secret); } catch (RuntimeException notBase64) { bytes = secret.getBytes(java.nio.charset.StandardCharsets.UTF_8); }
        if (bytes.length < 32) throw new IllegalStateException("JWT_SECRET must be at least 256 bits (32 bytes)");
        this.key = Keys.hmacShaKeyFor(bytes);
    }
    private SecretKey key(){return key;}
    public String issue(UserDetails u){Instant now=Instant.now(); return Jwts.builder().subject(u.getUsername()).issuedAt(Date.from(now)).expiration(Date.from(now.plusMillis(expirationMs))).signWith(key()).compact();}
    public Claims parse(String token){return Jwts.parser().verifyWith(key()).build().parseSignedClaims(token).getPayload();}
    public boolean valid(String token, UserDetails u){try{return parse(token).getSubject().equals(u.getUsername()) && parse(token).getExpiration().after(new Date());}catch(Exception e){return false;}}
}
