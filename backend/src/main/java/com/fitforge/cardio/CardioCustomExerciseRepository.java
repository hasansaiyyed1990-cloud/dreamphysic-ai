package com.fitforge.cardio;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CardioCustomExerciseRepository extends JpaRepository<CardioCustomExercise,Long> {
    List<CardioCustomExercise> findByUserEmailAndDeletedFalseOrderByNameAsc(String email);
    Optional<CardioCustomExercise> findByIdAndUserEmailAndDeletedFalse(Long id,String email);
}
