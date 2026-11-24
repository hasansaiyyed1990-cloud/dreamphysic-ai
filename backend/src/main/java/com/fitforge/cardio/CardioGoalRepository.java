package com.fitforge.cardio;
import org.springframework.data.jpa.repository.JpaRepository;import java.util.*;
public interface CardioGoalRepository extends JpaRepository<CardioGoal,Long>{List<CardioGoal> findByUserEmailOrderByGoalNameAsc(String email);Optional<CardioGoal> findByUserEmailAndGoalNameIgnoreCase(String email,String goalName);}
