package com.fitforge.workout;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface WorkoutSetRepository extends JpaRepository<WorkoutSet,Long>{
    @Query("select s from WorkoutSet s where s.userEmail=:email and lower(s.exerciseName)=lower(:exercise) and s.workoutDate=(select max(x.workoutDate) from WorkoutSet x where x.userEmail=:email and lower(x.exerciseName)=lower(:exercise)) order by s.setNumber")
    List<WorkoutSet> lastSets(@Param("email") String email,@Param("exercise") String exercise);
    List<WorkoutSet> findByUserEmailOrderByExerciseNameAscWeightKgDescWorkoutDateDesc(String email);
    List<WorkoutSet> findByUserEmailOrderByWorkoutDateDesc(String email, Pageable pageable);
}
