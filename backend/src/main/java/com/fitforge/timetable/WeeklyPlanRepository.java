package com.fitforge.timetable;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

public interface WeeklyPlanRepository extends JpaRepository<WeeklyPlanDay,Long>{
    List<WeeklyPlanDay> findByUserEmailOrderByDayOfWeek(String email);
    Optional<WeeklyPlanDay> findByUserEmailAndDayOfWeek(String email, DayOfWeek day);
}
