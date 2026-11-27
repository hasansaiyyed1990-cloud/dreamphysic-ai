package com.fitforge.workout;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface WorkoutSetRepository extends JpaRepository<WorkoutSet,Long>{
    @Query("select s from WorkoutSet s where s.userEmail=:email and lower(s.exerciseName)=lower(:exercise) and s.workoutDate=(select max(x.workoutDate) from WorkoutSet x where x.userEmail=:email and lower(x.exerciseName)=lower(:exercise)) order by s.setNumber")
    List<WorkoutSet> lastSets(@Param("email") String email,@Param("exercise") String exercise);
    @Query("select s from WorkoutSet s where s.userEmail=:email and lower(s.exerciseName)=lower(:exercise) and lower(coalesce(s.equipment,''))=lower(:equipment) and s.workoutDate=(select max(x.workoutDate) from WorkoutSet x where x.userEmail=:email and lower(x.exerciseName)=lower(:exercise) and lower(coalesce(x.equipment,''))=lower(:equipment)) order by s.setNumber")
    List<WorkoutSet> lastSetsByEquipment(@Param("email") String email,@Param("exercise") String exercise,@Param("equipment") String equipment);
    List<WorkoutSet> findByUserEmailOrderByExerciseNameAscWeightKgDescWorkoutDateDesc(String email);
    List<WorkoutSet> findByUserEmailOrderByWorkoutDateDesc(String email, Pageable pageable);
    java.util.Optional<WorkoutSet> findByIdAndUserEmail(Long id,String email);
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("delete from WorkoutSet s where s.session.id=:sessionId and s.userEmail=:email")
    int deleteForSession(@Param("sessionId") Long sessionId,@Param("email") String email);
    @Query("select s from WorkoutSet s where s.userEmail=:email and lower(s.exerciseName)=lower(:exercise) order by s.workoutDate desc, s.setNumber asc")
    List<WorkoutSet> sessionsForExercise(@Param("email") String email,@Param("exercise") String exercise);
}
