package com.fitforge.autopilot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.*;
public interface AutopilotDayRepository extends JpaRepository<AutopilotDay,Long>{Optional<AutopilotDay> findByUserEmailAndPlanDate(String email,LocalDate date);List<AutopilotDay> findTop7ByUserEmailOrderByPlanDateDesc(String email);}
