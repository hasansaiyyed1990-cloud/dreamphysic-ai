package com.fitforge.ai;

import jakarta.validation.constraints.NotBlank;
import com.fitforge.nutrition.NutritionModuleDtos;
import java.util.List;
import java.time.LocalDate;

public final class AiDtos {
    private AiDtos(){}
    public record MealScanRequest(@NotBlank String imageBase64,String mimeType,String prompt){}
    public record PromptRequest(@NotBlank String prompt){}
    public record MealItemAnalysis(String foodName,String estimatedServingSize,double quantityG,double calories,double proteinG,double carbsG,double fatG,double fiberG,int confidencePercent,String uncertaintyNote){}
    public record MealAnalysis(String name,int calories,double proteinG,double carbsG,double fatG,Double fiberG,String description,List<MealItemAnalysis> items,int confidencePercent,String uncertaintyNote){}
    public record ProteinCoach(double proteinTargetG,double consumedProteinG,double remainingProteinG,List<ProteinOption> options,String coachingNote){}
    public record ProteinOption(String id,String mealCategory,String name,List<ProteinLogItem> items,double calories,double proteinG,double carbsG,double fatG,double fiberG){}
    public record ProteinLogItem(String foodName,double quantity,String unit,String preparationType,double calories,double proteinG,double carbsG,double fatG,double fiberG){}
    public record DietAdjustment(String id,String acceptId,String rejectId,String title,String rationale,String action,boolean accepted){}
    public record DietAdjuster(double currentWeightKg,double averageCalories,double averageProteinG,double averageFiberG,List<DietAdjustment> suggestions,String coachingNote){}
    public record GroceryPlan(NutritionModuleDtos.Grocery list,String coachingNote){}
    public record DailyVerdict(LocalDate date,double consumedCalories,double calorieBudget,double proteinG,double proteinTargetG,double fiberG,double fiberTargetG,double waterMl,double waterGoalMl,String verdict,String tomorrowTip){}
    public record ActivityRequest(@NotBlank String recoveryStatus,@NotBlank String dailyActivityLevel,LocalDate date){}
    public record ActivitySuggestion(int extraActivityKcal,String suggestedActivity,boolean optional,boolean normalWorkoutUnchanged,String reason,String aiNote){}
}
