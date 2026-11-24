package com.fitforge.autopilot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface LiveWorkoutStateRepository extends JpaRepository<LiveWorkoutState,Long>{Optional<LiveWorkoutState> findByWorkoutSessionIdAndUserEmail(Long id,String email);}
