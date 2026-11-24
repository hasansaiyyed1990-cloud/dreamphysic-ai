package com.fitforge.nutrition;
import org.springframework.data.jpa.repository.JpaRepository; import java.time.LocalDate; import java.util.*;
public interface FoodDiaryRepository extends JpaRepository<FoodDiaryEntry,Long>{List<FoodDiaryEntry> findByUserIdAndEntryDateOrderByLoggedAtAsc(Long userId,LocalDate date);List<FoodDiaryEntry> findByUserIdAndEntryDateBetweenOrderByEntryDateAscLoggedAtAsc(Long userId,LocalDate from,LocalDate to);Optional<FoodDiaryEntry> findByIdAndUserId(Long id,Long userId);}
