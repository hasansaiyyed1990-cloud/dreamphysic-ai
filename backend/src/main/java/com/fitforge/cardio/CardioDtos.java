package com.fitforge.cardio;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

public final class CardioDtos {
    private CardioDtos() {}
    public record Session(Long id,String activity,Double distanceKm,Integer durationMinutes,Double paceMinPerKm,Integer caloriesBurned,Integer staminaScore,LocalDateTime sessionDate,String notes){}
    public record Create(@NotNull @DecimalMin("0.01") Double distanceKm,@NotNull @Min(1) Integer durationMinutes,@Min(0) Integer caloriesBurned,@Min(0) Integer staminaScore,LocalDateTime sessionDate,String activity,String notes){}
    public record GoalInput(@NotNull String goalName,@DecimalMin("0.1") Double targetDistanceKm,@DecimalMin("1.0") Double targetPaceMinPerKm,@Min(1) Integer targetTimeSeconds,@NotNull LocalDate deadlineDate){}
    public record Goal(Long id,String goalName,Double targetDistanceKm,Double targetPaceMinPerKm,Integer targetTimeSeconds,LocalDate originalDeadline,LocalDate revisedDeadline,double bestDistanceKm,double bestPaceMinPerKm,int bestTimeSeconds,boolean targetMet,boolean deadlineMissed,long daysLate,double nextDistanceKm,double nextPaceMinPerKm,String recommendation,List<Session> recentHistory){}
}
