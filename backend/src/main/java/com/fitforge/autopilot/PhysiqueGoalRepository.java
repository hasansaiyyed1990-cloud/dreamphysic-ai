package com.fitforge.autopilot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface PhysiqueGoalRepository extends JpaRepository<PhysiqueGoal,Long>{List<PhysiqueGoal> findByUserEmailOrderByCreatedAtDesc(String email);Optional<PhysiqueGoal> findByIdAndUserEmail(Long id,String email);}
