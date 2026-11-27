package com.fitforge.workout;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface WorkoutRoutineRepository extends JpaRepository<WorkoutRoutine,Long>{
    List<WorkoutRoutine> findByUserEmailAndDeletedFalseOrderByNameAsc(String email);
    Optional<WorkoutRoutine> findByIdAndUserEmail(Long id,String email);
}
