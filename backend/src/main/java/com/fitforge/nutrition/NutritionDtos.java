package com.fitforge.nutrition;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public final class NutritionDtos {
    private NutritionDtos(){}
    public record Meal(Long id,String name,int calories,double proteinG,double carbsG,double fatG,Double fiberG,String mealType,LocalDate mealDate,boolean favorite){}
    public record MealInput(@NotBlank String name,@Min(0) int calories,@DecimalMin("0.0") double proteinG,@DecimalMin("0.0") double carbsG,@DecimalMin("0.0") double fatG,Double fiberG,String mealType,LocalDate mealDate){}
    public record Summary(LocalDate date,int targetCalories,int calories,int remainingCalories,double proteinG,double carbsG,double fatG,int mealCount){}
    public record Favorite(Long id,String name,int calories,double proteinG,double carbsG,double fatG,Double fiberG,String mealType){}
}
