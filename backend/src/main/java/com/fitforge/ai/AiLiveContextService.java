package com.fitforge.ai;

import com.fitforge.auth.AppUserRepository;
import com.fitforge.cardio.CardioRepository;
import com.fitforge.progress.WeightRepository;
import com.fitforge.workout.WorkoutSet;
import com.fitforge.workout.WorkoutSetRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Locale;

@Service
public class AiLiveContextService {
    public record LiveContext(String promptBlock, double protocolWeightKg, boolean weightLogged, int calorieTarget) {}

    private final AppUserRepository users;
    private final WeightRepository weights;
    private final WorkoutSetRepository sets;
    private final CardioRepository cardio;

    public AiLiveContextService(AppUserRepository users, WeightRepository weights, WorkoutSetRepository sets, CardioRepository cardio) {
        this.users = users; this.weights = weights; this.sets = sets; this.cardio = cardio;
    }

    public LiveContext load(String email) {
        var weight = weights.findTopByUserEmailOrderByDateDesc(email);
        int calories = users.findByEmail(email).map(u -> u.getTargetCalories()).orElse(1800);
        var recent = sets.findByUserEmailOrderByWorkoutDateDesc(email, PageRequest.of(0, 12));
        var best = new LinkedHashMap<String, WorkoutSet>();
        for (WorkoutSet set : sets.findByUserEmailOrderByExerciseNameAscWeightKgDescWorkoutDateDesc(email)) {
            best.putIfAbsent(set.getExerciseName().toLowerCase(Locale.ROOT), set);
        }
        var cardioLogs = cardio.findByUserEmailOrderBySessionDateDesc(email, PageRequest.of(0, 5));
        StringBuilder b = new StringBuilder("[USER_LIVE_STATS]\n");
        if (weight.isPresent()) b.append("Latest body weight: ").append(weight.get().getWeightKg()).append(" kg (logged ").append(weight.get().getDate()).append(").\n");
        else b.append("Latest body weight: not logged; any exercise-calorie protocol must label its 70 kg basis as a provisional estimate.\n");
        b.append("Daily calorie target: ").append(calories).append(" kcal.\n");
        b.append("Strength PRs (highest logged set by exercise):\n");
        best.values().stream().limit(8).forEach(s -> b.append("- ").append(s.getExerciseName()).append(": ").append(s.getWeightKg()).append(" kg x ").append(s.getReps()).append(" reps; ").append(s.getWorkoutDate()).append("\n"));
        if (best.isEmpty()) b.append("- No strength sets logged. Do not invent current lift loads.\n");
        b.append("Recent workout sets (up to 12):\n");
        recent.forEach(s -> b.append("- ").append(s.getExerciseName()).append(" set ").append(s.getSetNumber()).append(": ").append(s.getWeightKg()).append(" kg x ").append(s.getReps()).append(" reps; rest ").append(s.getRestSeconds()).append(" sec; ").append(s.getWorkoutDate()).append("\n"));
        if (recent.isEmpty()) b.append("- No recent workout sets logged.\n");
        b.append("Recent cardio logs (up to 5):\n");
        cardioLogs.forEach(c -> b.append("- ").append(c.getActivity()).append(": ").append(c.getDistanceKm()).append(" km, ").append(c.getDurationMinutes()).append(" min, ").append(c.getCaloriesBurned() == null ? "calories unlogged" : c.getCaloriesBurned() + " kcal").append(", stamina score ").append(c.getStaminaScore() == null ? "unlogged" : c.getStaminaScore()).append("; ").append(c.getSessionDate()).append("\n"));
        if (cardioLogs.isEmpty()) b.append("- No cardio sessions logged.\n");
        b.append("[/USER_LIVE_STATS]");
        return new LiveContext(b.toString(), weight.map(w -> w.getWeightKg()).orElse(70.0), weight.isPresent(), calories);
    }
}
