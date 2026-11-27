package com.fitforge.workout;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Max;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

public final class WorkoutDtos {
    private WorkoutDtos(){}
    public record ExerciseGuide(Long id,String name,String muscleGroup,String equipment,String setup,String brace,String execution,String commonMistakes,List<String> primaryMuscles,List<String> secondaryMuscles,String level,List<String> instructions,List<String> imageUrls,String source){}
    public record ExerciseGuideInput(@NotBlank String name,@NotBlank String muscleGroup,String equipment,@NotBlank String setup,@NotBlank String brace,@NotBlank String execution,@NotBlank String commonMistakes){}
    public record Session(Long id,String name,LocalDateTime sessionDate,List<SetEntry> sets){}
    public record SessionInput(@NotBlank String name,LocalDateTime sessionDate){}
    public record SetEntry(Long id,String exerciseName,int setNumber,int reps,double weightKg,Double previousWeightKg,double deltaKg,int restSeconds,LocalDateTime workoutDate,String trackingType,String weightMode,String muscleGroup,String subMuscle,String equipment,String setType,Integer durationSeconds,Double rpe,Integer rir,String notes,boolean completed){}
    public record SetInput(@NotBlank String exerciseName,@Min(1) @Max(100) int setNumber,@Min(0) @Max(1000) int reps,@DecimalMin("0.0") @DecimalMax("1500.0") double weightKg,Double previousWeightKg,@Min(0) @Max(3600) int restSeconds,String muscleGroup,String subMuscle,String equipment,String setType,String trackingType,String weightMode,@Min(0) @Max(3600) Integer durationSeconds,@DecimalMin("0.0") @DecimalMax("10.0") Double rpe,@Min(0) @Max(10) Integer rir,String notes,Boolean completed){
        public SetInput(String exerciseName,int setNumber,int reps,double weightKg,Double previousWeightKg,int restSeconds){this(exerciseName,setNumber,reps,weightKg,previousWeightKg,restSeconds,null,null,null,null,null,null,null,null,null,null,null);}
    }
    public record SessionUpdate(@NotBlank String name,LocalDateTime sessionDate){}
    public record CustomExercise(Long id,String name,String muscleGroup,String subMuscle,String equipment,List<String> primaryMuscles,List<String> secondaryMuscles,String trackingType,String notes){}
    public record CustomExerciseInput(@NotBlank String name,@NotBlank String muscleGroup,String subMuscle,String equipment,List<String> primaryMuscles,List<String> secondaryMuscles,String trackingType,String notes){}
    public record Routine(Long id,String name,String split,boolean homeWorkout,List<RoutineExercise> exercises){}
    public record RoutineExercise(String exerciseName,String muscleGroup,String subMuscle,String equipment,int sets,int reps,double weightKg,int restSeconds,String trackingType){}
    public record RoutineInput(@NotBlank String name,String split,boolean homeWorkout,List<RoutineExercise> exercises){}
    public record HistoryAnalytics(int sessions,int sets,int reps,double totalVolumeKg,double maxWeightKg,int exerciseCount,LocalDate from,LocalDate to){}
    public record RepeatResult(String exerciseName,int copiedSets,List<SetEntry> sets){}
    public record PushUp(Long id,int repetitions,String variation,int durationSeconds,LocalDateTime performedAt,String notes){}
    public record PushUpInput(@Min(1) int repetitions,String variation,@Min(0) int durationSeconds,LocalDateTime performedAt,String notes){}
    public record PersonalRecord(String exerciseName,double weightKg,int reps,LocalDateTime achievedAt){}
    public record ExerciseGoalInput(@NotBlank String exerciseName,@DecimalMin("0.0") double targetWeightKg,@Min(1) int targetReps,@NotNull LocalDate deadlineDate){}
    public record ExerciseProgress(Long goalId,String exerciseName,double targetWeightKg,int targetReps,LocalDate deadlineDate,double previousWeightKg,int previousReps,double previousVolume,double currentWeightKg,int currentReps,double currentVolume,int stagnantSessions,boolean plateau,boolean targetMet,boolean deadlineMissed,long daysLate,String recommendation){}
    public record SectionInput(@NotBlank String name){}
    public record SectionExerciseInput(@NotBlank String exerciseName,String equipment,String muscleGroup){}
    public record SectionExerciseView(Long id,String exerciseName,String equipment,String muscleGroup){}
    public record SectionView(Long id,String name,List<SectionExerciseView> exercises){}
}
