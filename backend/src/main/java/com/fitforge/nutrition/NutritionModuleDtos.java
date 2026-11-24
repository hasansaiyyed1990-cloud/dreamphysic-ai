package com.fitforge.nutrition;

import jakarta.validation.constraints.*;
import java.time.*;
import java.util.*;

public final class NutritionModuleDtos {
 private NutritionModuleDtos(){}
 public record Food(Long id,String name,double calories,double proteinG,double carbsG,double fatG,double fiberG,String defaultUnit,String preparationType,boolean isCustom,Long userId,double servingGrams){}
 public record CustomFoodInput(@NotBlank String name,@PositiveOrZero double calories,@PositiveOrZero double proteinG,@PositiveOrZero double carbsG,@PositiveOrZero double fatG,@PositiveOrZero double fiberG,@NotBlank String defaultUnit,@NotBlank String preparationType,@Positive double servingGrams){}
 public record DiaryInput(@NotNull LocalDate entryDate,@NotBlank String mealCategory,@NotBlank String foodName,@Positive double quantity,@NotBlank String unit,String preparationType,@PositiveOrZero double calories,@PositiveOrZero double proteinG,@PositiveOrZero double carbsG,@PositiveOrZero double fatG,Double fiberG,Double scanConfidence){}
 public record Diary(Long id,Long userId,LocalDate entryDate,LocalDateTime loggedAt,String mealCategory,String foodName,double quantity,String unit,String preparationType,double calories,double proteinG,double carbsG,double fatG,double fiberG,Double scanConfidence){}
 public record DiaryDay(LocalDate date,double calories,double proteinG,double carbsG,double fatG,double fiberG,List<Diary> entries){}
 public record FavoriteInput(@NotBlank String mealName,@NotEmpty List<FavoriteItemInput> items){}
 public record FavoriteItemInput(@NotBlank String foodName,@Positive double quantity,@NotBlank String unit,String preparationType,@PositiveOrZero double calories,@PositiveOrZero double proteinG,@PositiveOrZero double carbsG,@PositiveOrZero double fatG,@PositiveOrZero double fiberG){}
 public record Favorite(Long id,String mealName,String itemsJson,double totalCalories,double totalProteinG,double totalCarbsG,double totalFatG,double totalFiberG){}
 public record MissionInput(Double startWeightKg,Double targetWeightKg,LocalDate startDate,LocalDate targetDate,Integer maintenanceCalories,Integer dailyCalorieBudget){}
 public record Mission(Long id,Double startWeightKg,Double targetWeightKg,LocalDate startDate,LocalDate targetDate,int maintenanceCalories,int dailyCalorieBudget,double consumedCalories,double remainingCalories,double dailyDeficitCalories,double cumulativeDeficitCalories){}
 public record DailyAnalytics(LocalDate date,double calories,double proteinG,double carbsG,double fatG,double fiberG,boolean calorieTargetMet,boolean proteinTargetMet){}
 public record Analytics(LocalDate startDate,LocalDate endDate,double averageCalories,double averageProteinG,double averageCarbsG,double averageFatG,double averageFiberG,double averageDeficitCalories,double consistencyScore,String bestDay,List<LocalDate> missedTargets,List<DailyAnalytics> dailyBreakdown){}
 public record HydrationInput(@Min(0) int waterMl,Integer waterGoalMl,Double fiberTargetG){}
 public record Hydration(LocalDate logDate,int waterMl,int waterGoalMl,double fiberTargetG,double fiberConsumedG,double fiberRemainingG){}
 public record GroceryInput(LocalDate weekStartDate,@NotBlank String itemsJson){}
 public record Grocery(Long id,LocalDate weekStartDate,String itemsJson){}
 public record ReminderInput(String mealReminderJson,String proteinReminderJson,String waterReminderJson,String weightReminderJson,String eodVerdictReminderJson){}
 public record Reminders(String mealReminderJson,String proteinReminderJson,String waterReminderJson,String weightReminderJson,String eodVerdictReminderJson){}
 public record CalorieBalanceInput(@NotNull LocalDate entryDate,Double estimatedTdee,Double plannedDeficit){}
 public record CalorieBalance(Long id,LocalDate entryDate,double estimatedTdee,double consumedCalories,double plannedDeficit,double actualDeficit,double pendingGapKcal){}
 public record BacklogReview(double pendingGapKcal,LocalDate originalDeadline,LocalDate revisedDeadline,long updatedRemainingDays,boolean deadlineChanged,String deadlineNotification,double dailyDeficitTarget,double weeklyDeficitTarget,List<CalorieBalance> history){}
 public record MacroTotals(double calories,double proteinG,double carbsG,double fatG,double fiberG){}
}
