package com.fitforge.progress;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import java.time.LocalDate;
import java.util.List;

public final class ProgressDtos {
    private ProgressDtos(){}
    public record WeightEntry(Long id,LocalDate date,double weightKg){}
    public record WeightInput(@NotNull LocalDate date,@DecimalMin("20.0") double weightKg){}
    public record WeeklyWeight(LocalDate weekStart,List<WeightEntry> entries,Double startWeightKg,Double endWeightKg,Double changeKg){}
    public record PhysiqueCheckIn(Long id,LocalDate date,Double weightKg,Double waistCm,String photoUrl,String notes){}
    public record PhysiqueInput(@NotNull LocalDate date,@DecimalMin("20.0") Double weightKg,@Positive Double waistCm,String photoUrl,String notes){}
    public record Alert(String type,String title,String message,boolean actionable){}
    public record MetabolicInput(@DecimalMin("80.0") @DecimalMax("250.0") Double heightCm,@Min(10) @Max(100) Integer ageYears,
                                 @Pattern(regexp="MALE|FEMALE|OTHER") String gender,
                                 @Pattern(regexp="SEDENTARY|LIGHT|MODERATE|ACTIVE|VERY_ACTIVE") String activityLevel,
                                 String primaryGoal,String secondaryGoal){}
    public record Metabolic(Double heightCm,Integer ageYears,String gender,String activityLevel,String primaryGoal,String secondaryGoal,
                            Double latestWeightKg,Double bmi,Double bmr,Double tdee,Double activityFactor,String formula,String warning,
                            List<Alert> conflicts){}
    public record Streak(int currentDays,int longestDays,LocalDate lastTrainedOn){}
}
