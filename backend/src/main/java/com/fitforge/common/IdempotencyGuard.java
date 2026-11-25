package com.fitforge.common;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class IdempotencyGuard {
    private static final long WINDOW_MS = 5_000L;
    private final ConcurrentHashMap<String, Long> recent = new ConcurrentHashMap<>();
    private final ObjectMapper mapper;

    public IdempotencyGuard(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public void check(String userEmail, String scope, Object payload) {
        long now = System.currentTimeMillis();
        recent.entrySet().removeIf(e -> now - e.getValue() > WINDOW_MS);
        String key = userEmail + ":" + scope + ":" + hash(payload);
        Long prev = recent.putIfAbsent(key, now);
        if (prev != null && (now - prev) <= WINDOW_MS) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Duplicate submission detected; please wait 5 seconds");
        }
        if (prev != null) {
            recent.put(key, now);
        }
    }

    private String hash(Object payload) {
        try {
            byte[] json = mapper.writeValueAsBytes(payload);
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(json);
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            byte[] fallback = String.valueOf(payload).getBytes(StandardCharsets.UTF_8);
            return Integer.toHexString(java.util.Arrays.hashCode(fallback));
        }
    }
}
