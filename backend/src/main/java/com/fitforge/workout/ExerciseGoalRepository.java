package com.fitforge.workout;
import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface ExerciseGoalRepository extends JpaRepository<ExerciseGoal,Long>{List<ExerciseGoal> findByUserEmailOrderByExerciseNameAsc(String email);Optional<ExerciseGoal> findByUserEmailAndExerciseNameIgnoreCase(String email,String exerciseName);}
