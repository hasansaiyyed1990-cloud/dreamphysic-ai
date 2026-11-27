package com.fitforge.workout;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface CustomWorkoutExerciseRepository extends JpaRepository<CustomWorkoutExercise,Long>{
    List<CustomWorkoutExercise> findByUserEmailAndDeletedFalseOrderByMuscleGroupAscNameAsc(String email);
    Optional<CustomWorkoutExercise> findByIdAndUserEmail(Long id,String email);
    Optional<CustomWorkoutExercise> findByUserEmailAndNameIgnoreCaseAndDeletedFalse(String email,String name);
    boolean existsByUserEmailAndNameIgnoreCaseAndDeletedFalse(String email,String name);
}
