package com.fitforge.workout;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;
public interface WorkoutSessionRepository extends JpaRepository<WorkoutSession,Long>{
    @EntityGraph(attributePaths="sets")
    List<WorkoutSession> findByUserEmailOrderBySessionDateDesc(String email);

    @EntityGraph(attributePaths="sets")
    List<WorkoutSession> findByUserEmailOrderBySessionDateDesc(String email,Pageable pageable);

    @EntityGraph(attributePaths="sets")
    List<WorkoutSession> findByUserEmailAndSessionDateBetweenOrderBySessionDateDesc(String email,LocalDateTime from,LocalDateTime to);

    @EntityGraph(attributePaths="sets")
    Optional<WorkoutSession> findByIdAndUserEmail(Long id,String email);
}
