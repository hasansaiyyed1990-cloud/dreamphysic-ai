package com.fitforge.nutrition;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface NutritionTargetsRepository extends JpaRepository<NutritionTargets, Long> {
    Optional<NutritionTargets> findByUserId(Long userId);
}
