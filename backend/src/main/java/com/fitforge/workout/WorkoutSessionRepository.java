package com.fitforge.workout;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface WorkoutSessionRepository extends JpaRepository<WorkoutSession,Long>{List<WorkoutSession> findByUserEmailOrderBySessionDateDesc(String email);Optional<WorkoutSession> findByIdAndUserEmail(Long id,String email);}
