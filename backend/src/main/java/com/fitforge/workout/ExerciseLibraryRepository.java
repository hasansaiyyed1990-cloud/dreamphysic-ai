package com.fitforge.workout;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ExerciseLibraryRepository extends JpaRepository<ExerciseLibraryItem,Long>{List<ExerciseLibraryItem> findAllByOrderByMuscleGroupAscNameAsc();boolean existsByNameIgnoreCase(String name);}
