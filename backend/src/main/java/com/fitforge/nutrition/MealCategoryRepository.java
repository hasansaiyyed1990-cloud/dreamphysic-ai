package com.fitforge.nutrition;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MealCategoryRepository extends JpaRepository<MealCategory, Long> {
    List<MealCategory> findByUserIdOrderBySortOrderAscNameAsc(Long userId);
    Optional<MealCategory> findByIdAndUserId(Long id, Long userId);
    boolean existsByUserIdAndNameIgnoreCase(Long userId, String name);
}
