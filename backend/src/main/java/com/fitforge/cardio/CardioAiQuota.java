package com.fitforge.cardio;

import org.springframework.stereotype.Component;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class CardioAiQuota {
    private static final int DAILY_LIMIT=10;
    private final ConcurrentHashMap<String,AtomicInteger> usage=new ConcurrentHashMap<>();
    public boolean allow(String userEmail){
        String today=LocalDate.now(ZoneId.of("Asia/Kolkata")).toString();
        usage.keySet().removeIf(key->!key.endsWith(":"+today));
        AtomicInteger count=usage.computeIfAbsent(userEmail+":"+today,key->new AtomicInteger());
        return count.incrementAndGet()<=DAILY_LIMIT;
    }
}
