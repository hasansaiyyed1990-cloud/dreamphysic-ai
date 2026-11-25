package com.fitforge.cardio;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public final class CardioDtos {
    private CardioDtos() {}
    public record Session(Long id,String activity,Double distanceKm,Integer durationMinutes,Double paceMinPerKm,Integer caloriesBurned,Boolean caloriesEstimated,Integer staminaScore,LocalDateTime sessionDate,String notes,String source,String externalActivityId,Integer averageHeartRate,Integer maximumHeartRate,Double elevationGainM,Integer cadence,String routePolyline,String lapSplitsJson){}
    public record Create(@NotNull @DecimalMin("0.0") Double distanceKm,@NotNull @Min(1) Integer durationMinutes,@Min(0) Integer caloriesBurned,@Min(0) Integer staminaScore,LocalDateTime sessionDate,String activity,String notes,String source,String externalActivityId,@Min(20) Integer averageHeartRate,@Min(20) Integer maximumHeartRate,@DecimalMin("0.0") Double elevationGainM,@Min(0) Integer cadence,String routePolyline,String lapSplitsJson){}
    public record CustomExerciseInput(@NotBlank @jakarta.validation.constraints.Size(max=100) String name,@NotBlank String category,@NotBlank String trackingMode,@NotBlank String intensity,@DecimalMin("1.0") Double metValue,String targetMuscles,String notes,boolean lowImpact){}
    public record CustomExercise(Long id,String name,String category,String trackingMode,String intensity,double metValue,String targetMuscles,String notes,boolean lowImpact){}
    public record Overview(long todaySessions,double todayDistanceKm,int todayDurationMinutes,long todayCalories,int weeklySessions,double weeklyDistanceKm,Integer latestStaminaScore,List<Session> recentSessions,List<Goal> goals,String calorieDisclaimer){}
    public record ScreenshotImport(boolean isCardioScreenshot,String confidence,String sourceApp,String activityType,LocalDate sessionDate,Integer durationSeconds,Double distanceKm,Integer avgPaceSecPerKm,Integer caloriesBurned,Integer avgHeartRate,String notes,boolean caloriesEstimated,String warning){}
    public record GoalInput(@NotNull String goalName,@DecimalMin("0.1") Double targetDistanceKm,@DecimalMin("1.0") Double targetPaceMinPerKm,@Min(1) Integer targetTimeSeconds,@NotNull LocalDate deadlineDate){}
    public record Goal(Long id,String goalName,Double targetDistanceKm,Double targetPaceMinPerKm,Integer targetTimeSeconds,LocalDate originalDeadline,LocalDate revisedDeadline,double bestDistanceKm,double bestPaceMinPerKm,int bestTimeSeconds,boolean targetMet,boolean deadlineMissed,long daysLate,double nextDistanceKm,double nextPaceMinPerKm,String recommendation,List<Session> recentHistory){}
}
