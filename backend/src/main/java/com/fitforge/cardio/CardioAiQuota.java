package com.fitforge.cardio;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class CardioAiQuota {
    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    private final int dailyLimitPerUser;
    private final int globalDailyKillswitch;
    private final ConcurrentHashMap<String, AtomicInteger> userUsage = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, AtomicInteger> globalUsage = new ConcurrentHashMap<>();

    public CardioAiQuota(
            @Value("${app.ai.daily-limit-per-user:30}") int dailyLimitPerUser,
            @Value("${app.ai.global-daily-killswitch:1000}") int globalDailyKillswitch) {
        this.dailyLimitPerUser = dailyLimitPerUser;
        this.globalDailyKillswitch = globalDailyKillswitch;
    }

    public boolean allow(String userEmail) {
        String today = LocalDate.now(IST).toString();
        globalUsage.keySet().removeIf(k -> !k.equals(today));
        userUsage.keySet().removeIf(k -> !k.endsWith(":" + today));
        AtomicInteger global = globalUsage.computeIfAbsent(today, k -> new AtomicInteger());
        if (global.get() >= globalDailyKillswitch) {
            return false;
        }
        AtomicInteger count = userUsage.computeIfAbsent(userEmail.toLowerCase() + ":" + today, k -> new AtomicInteger());
        if (count.get() >= dailyLimitPerUser) {
            return false;
        }
        global.incrementAndGet();
        count.incrementAndGet();
        return true;
    }

    public void enforce(String userEmail) {
        String today = LocalDate.now(IST).toString();
        globalUsage.keySet().removeIf(k -> !k.equals(today));
        userUsage.keySet().removeIf(k -> !k.endsWith(":" + today));
        AtomicInteger global = globalUsage.computeIfAbsent(today, k -> new AtomicInteger());
        if (global.get() >= globalDailyKillswitch) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Global daily AI capacity reached; please try again tomorrow");
        }
        AtomicInteger count = userUsage.computeIfAbsent(userEmail.toLowerCase() + ":" + today, k -> new AtomicInteger());
        if (count.get() >= dailyLimitPerUser) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Daily AI limit reached; try again tomorrow");
        }
        global.incrementAndGet();
        count.incrementAndGet();
    }

    public void clearUser(String userEmail) {
        String prefix = userEmail.toLowerCase() + ":";
        userUsage.keySet().removeIf(k -> k.startsWith(prefix));
    }
}
