package com.fitforge.nutrition;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
public interface MealRepository extends JpaRepository<MealEntry,Long>{List<MealEntry> findByUserEmailAndMealDateOrderByIdAsc(String email,LocalDate date);List<MealEntry> findByUserEmailAndMealDateBetweenOrderByMealDateAsc(String email,LocalDate from,LocalDate to);Optional<MealEntry> findByIdAndUserEmail(Long id,String email);}
