package com.fitforge.workout;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

public final class WorkoutDtos {
    private WorkoutDtos(){}
    public record ExerciseGuide(Long id,String name,String muscleGroup,String equipment,String setup,String brace,String execution,String commonMistakes,List<String> primaryMuscles,List<String> secondaryMuscles,String level,List<String> instructions,List<String> imageUrls,String source){}
    public record ExerciseGuideInput(@NotBlank String name,@NotBlank String muscleGroup,String equipment,@NotBlank String setup,@NotBlank String brace,@NotBlank String execution,@NotBlank String commonMistakes){}
    public record Session(Long id,String name,LocalDateTime sessionDate,List<SetEntry> sets){}
    public record SessionInput(@NotBlank String name,LocalDateTime sessionDate){}
    public record SetEntry(Long id,String exerciseName,int setNumber,int reps,double weightKg,Double previousWeightKg,double deltaKg,int restSeconds,LocalDateTime workoutDate,String trackingType,String weightMode){}
    public record SetInput(@NotBlank String exerciseName,@Min(1) int setNumber,@Min(0) int reps,@DecimalMin("0.0") double weightKg,Double previousWeightKg,@Min(0) int restSeconds){}
    public record RepeatResult(String exerciseName,int copiedSets,List<SetEntry> sets){}
    public record PushUp(Long id,int repetitions,String variation,int durationSeconds,LocalDateTime performedAt,String notes){}
    public record PushUpInput(@Min(1) int repetitions,String variation,@Min(0) int durationSeconds,LocalDateTime performedAt,String notes){}
    public record PersonalRecord(String exerciseName,double weightKg,int reps,LocalDateTime achievedAt){}
    public record ExerciseGoalInput(@NotBlank String exerciseName,@DecimalMin("0.0") double targetWeightKg,@Min(1) int targetReps,@NotNull LocalDate deadlineDate){}
    public record ExerciseProgress(Long goalId,String exerciseName,double targetWeightKg,int targetReps,LocalDate deadlineDate,double previousWeightKg,int previousReps,double previousVolume,double currentWeightKg,int currentReps,double currentVolume,int stagnantSessions,boolean plateau,boolean targetMet,boolean deadlineMissed,long daysLate,String recommendation){}
}
