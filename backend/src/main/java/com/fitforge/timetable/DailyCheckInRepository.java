package com.fitforge.timetable;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DailyCheckInRepository extends JpaRepository<DailyCheckIn,Long>{
    Optional<DailyCheckIn> findByUserEmailAndDate(String email,LocalDate date);
    List<DailyCheckIn> findByUserEmailAndDateBetweenOrderByDateAsc(String email,LocalDate from,LocalDate to);
    List<DailyCheckIn> findByUserEmailAndWorkoutCompletedTrueOrderByDateDesc(String email);
}
