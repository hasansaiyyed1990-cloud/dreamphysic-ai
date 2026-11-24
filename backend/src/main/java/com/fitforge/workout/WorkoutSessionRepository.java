package com.fitforge.workout;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;
public interface WorkoutSessionRepository extends JpaRepository<WorkoutSession,Long>{List<WorkoutSession> findByUserEmailOrderBySessionDateDesc(String email);List<WorkoutSession> findByUserEmailAndSessionDateBetweenOrderBySessionDateDesc(String email,LocalDateTime from,LocalDateTime to);Optional<WorkoutSession> findByIdAndUserEmail(Long id,String email);}
