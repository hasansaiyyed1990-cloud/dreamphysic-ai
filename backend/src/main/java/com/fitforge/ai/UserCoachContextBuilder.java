package com.fitforge.ai;

import com.fitforge.auth.AppUser;
import com.fitforge.auth.AppUserRepository;
import com.fitforge.cardio.CardioRepository;
import com.fitforge.nutrition.FatLossMissionRepository;
import com.fitforge.nutrition.FoodDiaryEntry;
import com.fitforge.nutrition.FoodDiaryRepository;
import com.fitforge.nutrition.HydrationFiberLog;
import com.fitforge.nutrition.HydrationFiberRepository;
import com.fitforge.nutrition.MealEntry;
import com.fitforge.nutrition.MealRepository;
import com.fitforge.progress.WeightEntry;
import com.fitforge.progress.WeightRepository;
import com.fitforge.workout.WorkoutSession;
import com.fitforge.workout.WorkoutSessionRepository;
import com.fitforge.workout.WorkoutSet;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/** Builds prompt facts exclusively from the authenticated user's saved records. */
@Service
public class UserCoachContextBuilder {
    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    private static final List<String> MUSCLE_GROUPS = List.of("Chest", "Back", "Shoulders", "Arms", "Legs", "Core");

    public record CoachContext(String promptBlock, AppUser user, Double weightKg, boolean weightLogged,
                               double maintenanceCalories, double bestPaceMinPerKm, double maxDistanceKm,
                               int strengthSessions14d, int cardioSessions14d, boolean newUserNoLogs) {}

    private final AppUserRepository users;
    private final WeightRepository weights;
    private final FoodDiaryRepository diary;
    private final MealRepository legacyMeals;
    private final HydrationFiberRepository hydration;
    private final WorkoutSessionRepository workoutSessions;
    private final CardioRepository cardio;
    private final FatLossMissionRepository missions;

    public UserCoachContextBuilder(AppUserRepository users, WeightRepository weights, FoodDiaryRepository diary,
                                   MealRepository legacyMeals, HydrationFiberRepository hydration,
                                   WorkoutSessionRepository workoutSessions, CardioRepository cardio,
                                   FatLossMissionRepository missions) {
        this.users = users;
        this.weights = weights;
        this.diary = diary;
        this.legacyMeals = legacyMeals;
        this.hydration = hydration;
        this.workoutSessions = workoutSessions;
        this.cardio = cardio;
        this.missions = missions;
    }

    public CoachContext build(String email) {
        LocalDate today = LocalDate.now(IST);
        AppUser user = users.findByEmail(email).orElse(null);
        Long userId = user == null ? null : user.getId();
        List<WeightEntry> weight14 = weights.findByUserEmailAndDateBetweenOrderByDateAsc(email, today.minusDays(13), today);
        Optional<WeightEntry> latest = weights.findTopByUserEmailOrderByDateDesc(email);
        Double weightKg = latest.map(WeightEntry::getWeightKg).orElse(null);

        var foodRows = userId == null ? List.<FoodDiaryEntry>of()
                : diary.findByUserIdAndEntryDateBetweenOrderByEntryDateAscLoggedAtAsc(userId, today.minusDays(6), today);
        var oldMealRows = legacyMeals.findByUserEmailAndMealDateBetweenOrderByMealDateAsc(email, today.minusDays(6), today);
        var hydrationRows = new ArrayList<HydrationFiberLog>();
        if (userId != null) {
            for (int ago = 0; ago < 7; ago++) {
                hydration.findByUserIdAndLogDate(userId, today.minusDays(ago)).ifPresent(hydrationRows::add);
            }
        }

        LocalDateTime start = today.minusDays(13).atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();
        List<WorkoutSession> workouts = workoutSessions.findByUserEmailAndSessionDateBetweenOrderBySessionDateDesc(email, start, end);
        var cardioLogs = cardio.findByUserEmailAndSessionDateBetweenOrderBySessionDateDesc(email, start, end);
        Optional<com.fitforge.nutrition.FatLossMission> mission = userId == null ? Optional.empty() : missions.findByUserId(userId);

        StringBuilder out = new StringBuilder("[USER_LIVE_COACH_CONTEXT]\n");
        out.append("Profile: ").append(user == null ? "account profile unavailable" : profileLine(user, weightKg)).append("\n");
        out.append("Diet preference: not stored in the current account profile; ask before assuming veg/eggetarian/non-veg. Experience level: not stored; use beginner-safe defaults.\n");
        appendNutrition(out, today, foodRows, oldMealRows, hydrationRows);
        appendWeight(out, today, weight14, latest);
        appendStrength(out, workouts);
        appendCardio(out, cardioLogs);

        boolean noLogs = weight14.isEmpty() && foodRows.isEmpty() && oldMealRows.isEmpty()
                && workouts.isEmpty() && cardioLogs.isEmpty() && hydrationRows.isEmpty();
        if (noLogs) {
            out.append("NEW_USER_NO_LOGS_YET\n")
                    .append("Ask exactly two quick baseline questions: (1) age, height, current weight; (2) available training days/equipment and whether a 10-minute comfortable walk-jog is pain-free. Still give a safe Day-1 starter: 5-minute easy warm-up walk, 2 rounds of 8 chair squats, 8 wall push-ups, 10 glute bridges and 6 bird-dogs per side with 60-90 sec rest, then 10-minute easy walk; stop for pain and do not assume the user can perform it. Do not invent a profile or target.\n");
        }
        out.append("[/USER_LIVE_COACH_CONTEXT]");

        double maintenance = mission.map(m -> (double) m.getMaintenanceCalories()).orElse(0.0);
        double bestPace = cardioLogs.stream().filter(s -> s.getDistanceKm() >= 1
                        && s.getPaceMinPerKm() > 0
                        && !"WALKING".equalsIgnoreCase(s.getActivity()))
                .mapToDouble(s -> s.getPaceMinPerKm()).min().orElse(0.0);
        double maxDistance = cardioLogs.stream().mapToDouble(s -> s.getDistanceKm()).max().orElse(0);
        return new CoachContext(out.toString(), user, weightKg, weightKg != null, maintenance, bestPace,
                maxDistance, workouts.size(), cardioLogs.size(), noLogs);
    }

    private String profileLine(AppUser user, Double weightKg) {
        return "weight=" + (weightKg == null ? "not logged" : String.format(Locale.ROOT, "%.1f kg", weightKg))
                + ", height=" + (user.getHeightCm() == null ? "not logged" : user.getHeightCm() + " cm")
                + ", age=" + (user.getAgeYears() == null ? "not logged" : user.getAgeYears())
                + ", gender=" + notSet(user.getGender()) + ", goal=" + notSet(user.getPrimaryGoal())
                + (user.getSecondaryGoal() == null ? "" : "; secondary goal=" + user.getSecondaryGoal())
                + ", activity level=" + notSet(user.getActivityLevel());
    }

    private void appendNutrition(StringBuilder out, LocalDate today, List<FoodDiaryEntry> rows,
                                 List<MealEntry> legacy, List<HydrationFiberLog> water) {
        Map<LocalDate, MacroDay> days = new LinkedHashMap<>();
        rows.forEach(e -> days.computeIfAbsent(e.getEntryDate(), ignored -> new MacroDay())
                .add(e.getCalories(), e.getProteinG(), e.getCarbsG(), e.getFatG()));
        legacy.forEach(e -> days.computeIfAbsent(e.getMealDate(), ignored -> new MacroDay())
                .add(e.getCalories(), e.getProteinG(), e.getCarbsG(), e.getFatG()));
        double divisor = Math.max(1, days.size());
        out.append("Last 7 days nutrition (averaged over ").append(days.size()).append(" logged days; unlogged days are unknown, not zero): ")
                .append(Math.round(days.values().stream().mapToDouble(d -> d.kcal).sum() / divisor)).append(" kcal/day, ")
                .append(round(days.values().stream().mapToDouble(d -> d.protein).sum() / divisor)).append(" g protein/day, ")
                .append(round(days.values().stream().mapToDouble(d -> d.carbs).sum() / divisor)).append(" g carbs/day, ")
                .append(round(days.values().stream().mapToDouble(d -> d.fat).sum() / divisor)).append(" g fat/day.\n");
        double waterAvg = water.stream().mapToInt(HydrationFiberLog::getWaterMl).average().orElse(0);
        out.append("Water: ").append(water.isEmpty() ? "not logged" : Math.round(waterAvg) + " ml/day average over " + water.size() + " logged days").append(".\n");
        out.append("Today's food tracking: ").append(days.containsKey(today) ? "logged" : "not logged yet; do not assume zero intake").append(".\n");
    }

    private void appendWeight(StringBuilder out, LocalDate today, List<WeightEntry> weight14, Optional<WeightEntry> latest) {
        double recent = weight14.stream().filter(w -> !w.getDate().isBefore(today.minusDays(6)))
                .mapToDouble(WeightEntry::getWeightKg).average().orElse(Double.NaN);
        double prior = weight14.stream().filter(w -> w.getDate().isBefore(today.minusDays(6)))
                .mapToDouble(WeightEntry::getWeightKg).average().orElse(Double.NaN);
        out.append("Last 14 days weight: latest=").append(latest.map(w -> String.format(Locale.ROOT, "%.1f kg (%s)", w.getWeightKg(), w.getDate())).orElse("not logged"));
        if (Double.isFinite(recent)) out.append("; recent 7-day average=").append(String.format(Locale.ROOT, "%.2f kg", recent));
        if (Double.isFinite(prior)) out.append("; prior 7-day average=").append(String.format(Locale.ROOT, "%.2f kg", prior));
        if (Double.isFinite(recent) && Double.isFinite(prior)) out.append("; weekly trend=").append(String.format(Locale.ROOT, "%+.2f kg/week", recent - prior));
        else out.append("; kg/week trend not calculable from available weigh-ins");
        out.append(".\n");
    }

    private void appendStrength(StringBuilder out, List<WorkoutSession> workouts) {
        Map<String, Double> topWeights = new LinkedHashMap<>();
        Set<String> covered = new LinkedHashSet<>();
        for (WorkoutSession workout : workouts) for (WorkoutSet set : workout.getSets()) {
            String exercise = set.getExerciseName();
            String normalized = exercise == null ? "" : exercise.toLowerCase(Locale.ROOT);
            String group = muscleFor(normalized);
            if (group != null) covered.add(group);
            if (group != null && set.getWeightKg() > 0 && set.getWeightKg() <= 500 && !"W".equalsIgnoreCase(set.getTrackingType())) {
                topWeights.merge(exercise, set.getWeightKg(), Math::max);
            }
        }
        List<String> skipped = MUSCLE_GROUPS.stream().filter(g -> !covered.contains(g)).toList();
        out.append("Last 14 days strength: ").append(workouts.size()).append(" workout sessions (about ")
                .append(String.format(Locale.ROOT, "%.1f", workouts.size() / 2.0)).append(" per week); top working weights=")
                .append(topWeights.isEmpty() ? "none logged" : topWeights.entrySet().stream().limit(8).map(e -> e.getKey() + " " + round(e.getValue()) + " kg").toList())
                .append(". Muscle groups without a mapped set in this window (not necessarily skipped): ")
                .append(skipped.isEmpty() ? "none" : skipped).append(".\n");
    }

    private void appendCardio(StringBuilder out, List<com.fitforge.cardio.CardioSession> sessions) {
        double maxKm = sessions.stream().mapToDouble(s -> s.getDistanceKm()).max().orElse(0);
        double pace = sessions.stream().filter(s -> s.getDistanceKm() > 0 && s.getPaceMinPerKm() > 0)
                .mapToDouble(s -> s.getPaceMinPerKm()).average().orElse(Double.NaN);
        int duration = sessions.stream().mapToInt(s -> s.getDurationMinutes()).sum();
        out.append("Last 14 days cardio: ").append(sessions.size()).append(" sessions; max distance=")
                .append(maxKm > 0 ? round(maxKm) + " km" : "none logged")
                .append("; average pace=").append(Double.isFinite(pace) ? String.format(Locale.ROOT, "%.2f min/km", pace) : "not calculable")
                .append("; total duration=").append(duration).append(" minutes.\n");
    }

    private String muscleFor(String n) {
        if (n.contains("bench") || n.contains("push-up") || n.contains("push up") || n.contains("chest")) return "Chest";
        if (n.contains("row") || n.contains("pull") || n.contains("lat") || n.contains("deadlift")) return "Back";
        if (n.contains("shoulder") || n.contains("overhead press") || n.contains("ohp")) return "Shoulders";
        if (n.contains("curl") || n.contains("tricep") || n.contains("pushdown") || n.contains("extension")) return "Arms";
        if (n.contains("squat") || n.contains("leg") || n.contains("lunge") || n.contains("calf") || n.contains("hinge")) return "Legs";
        if (n.contains("plank") || n.contains("crunch") || n.contains("core") || n.contains("sit-up")) return "Core";
        return null;
    }

    private String notSet(String value) { return value == null || value.isBlank() ? "not stored" : value; }
    private double round(double value) { return Math.round(value * 10.0) / 10.0; }
    private static final class MacroDay {
        double kcal, protein, carbs, fat;
        void add(double k, double p, double c, double f) { kcal += k; protein += p; carbs += c; fat += f; }
    }
}
