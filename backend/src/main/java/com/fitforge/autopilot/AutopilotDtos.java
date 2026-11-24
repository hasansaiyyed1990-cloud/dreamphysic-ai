package com.fitforge.autopilot;
import jakarta.validation.constraints.*;
import java.time.*;
import java.util.*;
public final class AutopilotDtos {
 private AutopilotDtos(){}
 public record Exercise(String name,int sets,int reps,double weightKg,int restSeconds,String tempo,String cues){}
 public record Workout(String split,List<String> muscleGroups,List<Exercise> exercises,int durationMinutes){}
 public record Cardio(String activity,int durationMinutes,double distanceKm,double paceMinPerKm,String intensity){}
 public record Meal(String name,String foods,int calories,double proteinG,double carbsG,double fatG,double fiberG){}
 public record Nutrition(int calorieTarget,int caloriesConsumed,int caloriesRemaining,double proteinTargetG,double proteinConsumedG,double proteinRemainingG,double carbsG,double fatG,double fiberG,List<Meal> practicalMeals){}
 public record DailyPlan(LocalDate date,Workout workout,Cardio cardio,Nutrition nutrition,String recoveryStatus,String recoveryReason,List<String> dailyGoals,String tomorrowPreview,boolean expressMode){}
 public record PlanUpdate(@NotNull Workout workout,@NotNull Cardio cardio,@NotNull Nutrition nutrition,@NotBlank String recoveryStatus,List<String> dailyGoals,String tomorrowPreview,boolean expressMode){}
 public record CoachPrompt(@NotBlank String prompt,String exerciseName,Double rpe,String pain,Boolean missedWorkout){}
 public record Proposal(Long id,String type,String status,String what,String why,String dataInfluenced,String impactIfAccepted,Map<String,Object> details,LocalDateTime createdAt){}
 public record Decision(@NotBlank String action,Map<String,Object> edits){}
 public record Review(LocalDate from,LocalDate to,String summary,List<Proposal> recommendations){}
 public record PhysiqueGoal(@NotBlank String focus,@NotBlank String goal,String measurement,Double baseline,Double target,String nextSteps){}
 public record PhysiqueGoalInput(@NotBlank String focus,@NotBlank String goal,String measurement,Double baseline,Double target,String linkedExercises,String nextSteps,Boolean active){}
 public record PhysiqueGoalView(Long id,String focus,String goal,String measurement,Double baseline,Double target,String linkedExercises,String nextSteps,boolean active,LocalDateTime createdAt){}
 public record LiveStart(@NotBlank String workoutName,@NotBlank String firstExercise){}
 public record LiveSession(Long workoutSessionId,String exerciseName,int exerciseIndex,LocalDateTime restUntil,String status){}
 public record RestInput(@Min(0) @Max(3600) int restSeconds){}
 public record SwapInput(@NotBlank String exerciseName,String reason){}
 public record VoiceCommand(@NotBlank String transcript){}
 public record VoiceIntent(String intent,String exerciseName,Integer restSeconds,String feedback,String transcript){}
 public record OverloadRequest(@NotBlank String exerciseName,@Min(1) int repFloor,@Min(1) int repCeiling,Double availableIncrementKg,Double rpe,@NotBlank String recoveryStatus,Boolean formClean,String pain,Double targetWeightKg,Integer targetReps,LocalDate deadlineDate){ }
 public record OverloadPrediction(String exerciseName,double currentWeightKg,List<Integer> recentSessionReps,int recommendedReps,Double recommendedWeightKg,String reason,boolean plateau,boolean painReported,boolean deadlineMissed,long daysLate,LocalDate deadlineDate,String safeAlternative){ }
 public record RecoveryInput(Double sleepHours,Integer energyScore,Integer sorenessScore,Boolean pain,Boolean lowIntake){ }
 public record RecoveryAssessment(String readiness,String reason,double consumedCalories,Double estimatedTdee,Double actualDeficit,double pendingGapKcal,int optionalActivityKcal,LocalDate originalDeadline,LocalDate revisedDeadline,LocalDate proposedDeadline,String what,String why,String dataInfluenced,String impactIfAccepted,Long proposalId){ }
 public record BacklogState(double pendingGapKcal,Double plannedDailyDeficit,Double actualDeficit,LocalDate originalDeadline,LocalDate revisedDeadline,long remainingDays,boolean exerciseDebt){ }
 public record MissedWorkout(@NotNull LocalDate missedDate,String workoutName){ }
 public record Reschedule(LocalDate missedDate,LocalDate suggestedDate,String workoutName,String reason,boolean doubleBooked,Long proposalId){ }
 public record LiveFeedback(LiveSession session,String feedback){ }
}
