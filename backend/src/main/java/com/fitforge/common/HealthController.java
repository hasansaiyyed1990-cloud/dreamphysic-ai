package com.fitforge.common;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class HealthController {
    private final String latestVersion;
    private final String downloadUrl;

    public HealthController(
            @Value("${app.latest-version:1.0.0}") String latestVersion,
            @Value("${app.apk-download-url:}") String downloadUrl) {
        this.latestVersion = latestVersion;
        this.downloadUrl = downloadUrl;
    }

    @GetMapping("/api/health")
    public Map<String, String> health() {
        return Map.of("status", "UP");
    }

    @GetMapping("/api/app-version")
    public Map<String, String> appVersion() {
        return Map.of("latestVersion", latestVersion, "downloadUrl", downloadUrl);
    }
}
