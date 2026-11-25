package com.fitforge;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

import java.util.TimeZone;

@SpringBootApplication
@EnableCaching
public class FitForgeApplication {

    /**
     * All fitness "today" logic is Indian Standard Time. Pinning the JVM default
     * zone stops host/container timezones from shifting day boundaries.
     */
    @PostConstruct
    void defaultToIst() {
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
    }

    public static void main(String[] args) {
        SpringApplication.run(FitForgeApplication.class, args);
    }
}
