package com.fitforge.workout;
import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface WorkoutSectionRepository extends JpaRepository<WorkoutSection,Long>{
    List<WorkoutSection> findByUserEmailOrderBySortOrderAscIdAsc(String email);
    Optional<WorkoutSection> findByIdAndUserEmail(Long id,String email);
}
