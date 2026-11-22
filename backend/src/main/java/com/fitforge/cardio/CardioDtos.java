package com.fitforge.cardio;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public final class CardioDtos {
    private CardioDtos() {}
    public record Session(Long id,String activity,Double distanceKm,Integer durationMinutes,Double paceMinPerKm,Integer caloriesBurned,Integer staminaScore,LocalDateTime sessionDate,String notes){}
    public record Create(@NotNull @DecimalMin("0.01") Double distanceKm,@NotNull @Min(1) Integer durationMinutes,@Min(0) Integer caloriesBurned,@Min(0) Integer staminaScore,LocalDateTime sessionDate,String activity,String notes){}
}
