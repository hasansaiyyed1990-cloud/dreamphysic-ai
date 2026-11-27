package com.fitforge.workout;
import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface WorkoutSectionExerciseRepository extends JpaRepository<WorkoutSectionExercise,Long>{
    List<WorkoutSectionExercise> findBySectionIdOrderBySortOrderAscIdAsc(Long sectionId);
    Optional<WorkoutSectionExercise> findByIdAndSectionId(Long id,Long sectionId);
    void deleteBySectionId(Long sectionId);
    boolean existsBySectionIdAndExerciseNameIgnoreCase(Long sectionId,String exerciseName);
}
