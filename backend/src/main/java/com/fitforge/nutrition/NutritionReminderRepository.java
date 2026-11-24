package com.fitforge.nutrition;
import org.springframework.data.jpa.repository.JpaRepository; import java.util.Optional;
public interface NutritionReminderRepository extends JpaRepository<NutritionReminderPref,Long>{Optional<NutritionReminderPref> findByUserId(Long userId);}
