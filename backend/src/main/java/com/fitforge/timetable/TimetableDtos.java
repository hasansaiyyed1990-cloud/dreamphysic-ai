package com.fitforge.timetable;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.time.DayOfWeek;
import java.time.LocalDate;

public final class TimetableDtos {
    private TimetableDtos() {}
    public record PlanDay(DayOfWeek day, String focus, String plan, boolean express20) {}
    public record PlanUpdate(@NotBlank String focus, String plan, boolean express20) {}
    public record Toggle(boolean enabled) {}
    public record WaterUpdate(@Min(0) @Max(40) int glasses) {}
    public record DailyCheckIn(LocalDate date, boolean creatineTaken, boolean waterGoalMet, int waterGlasses, boolean workoutCompleted) {}
    public record Streak(int currentStreak, int longestStreak) {}
}
