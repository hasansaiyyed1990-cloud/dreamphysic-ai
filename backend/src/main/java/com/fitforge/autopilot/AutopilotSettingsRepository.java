package com.fitforge.autopilot;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AutopilotSettingsRepository extends JpaRepository<AutopilotSettings,Long> {
    Optional<AutopilotSettings> findByUserEmail(String email);
}
