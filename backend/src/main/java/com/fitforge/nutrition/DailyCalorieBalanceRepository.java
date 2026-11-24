package com.fitforge.nutrition;
import org.springframework.data.jpa.repository.JpaRepository; import java.time.LocalDate; import java.util.*;
public interface DailyCalorieBalanceRepository extends JpaRepository<DailyCalorieBalance,Long>{List<DailyCalorieBalance> findByUserIdAndEntryDateBetweenOrderByEntryDateAsc(Long id,LocalDate from,LocalDate to);Optional<DailyCalorieBalance> findByUserIdAndEntryDate(Long id,LocalDate date);Optional<DailyCalorieBalance> findTopByUserIdOrderByEntryDateDesc(Long id);}
