package com.fitforge.progress;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
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
}
