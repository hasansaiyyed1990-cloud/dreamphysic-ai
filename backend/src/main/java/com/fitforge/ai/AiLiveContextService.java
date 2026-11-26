package com.fitforge.ai;

import com.fitforge.auth.AppUserRepository;
import com.fitforge.cardio.CardioRepository;
import com.fitforge.cardio.CardioSession;
import com.fitforge.cardio.CardioGoalRepository;
import com.fitforge.progress.WeightRepository;
import com.fitforge.nutrition.*;
import com.fitforge.workout.WorkoutSet;
import com.fitforge.workout.WorkoutSetRepository;
import com.fitforge.workout.ExerciseGoalRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AiLiveContextService {
    public record LiveContext(String promptBlock, double protocolWeightKg, boolean weightLogged, int calorieTarget,
                              double weeklyRunKm, double longestRunKm, double recentRunPaceMinPerKm,
                              String primaryGoal, Double targetWeightKg, String targetDate) {
        public LiveContext(String promptBlock, double protocolWeightKg, boolean weightLogged, int calorieTarget) {
            this(promptBlock, protocolWeightKg, weightLogged, calorieTarget, 0, 0, 0, "not set", null, null);
        }
    }

    private final AppUserRepository users;
    private final WeightRepository weights;
    private final WorkoutSetRepository sets;
    private final CardioRepository cardio;
    private final CardioGoalRepository cardioGoals;
    private final ExerciseGoalRepository exerciseGoals;
    private final FoodDiaryRepository foodDiary;
    private final FatLossMissionRepository missions;
    private final DailyCalorieBalanceRepository balances;
    private final HydrationFiberRepository hydration;
    private final MealRepository legacyMeals;
    @Autowired(required = false) private UserCoachContextBuilder coachContextBuilder;
    @Autowired(required = false) private CoachFormulaEngine formulaEngine;
    @Autowired(required = false) private AiChatHistoryService chatHistory;

    public AiLiveContextService(AppUserRepository users, WeightRepository weights, WorkoutSetRepository sets, CardioRepository cardio,CardioGoalRepository cardioGoals,ExerciseGoalRepository exerciseGoals,FoodDiaryRepository foodDiary,FatLossMissionRepository missions,DailyCalorieBalanceRepository balances,HydrationFiberRepository hydration,MealRepository legacyMeals) {
        this.users = users; this.weights = weights; this.sets = sets; this.cardio = cardio;this.cardioGoals=cardioGoals;this.exerciseGoals=exerciseGoals;this.foodDiary=foodDiary;this.missions=missions;this.balances=balances;this.hydration=hydration;this.legacyMeals=legacyMeals;
    }

    public LiveContext load(String email) {
        return load(email, null);
    }

    public LiveContext load(String email, String userQuestion) {
        var weight = weights.findTopByUserEmailOrderByDateDesc(email);
        int calories = users.findByEmail(email).map(u -> u.getTargetCalories()).orElse(1800);
        var recent = sets.findByUserEmailOrderByWorkoutDateDesc(email, PageRequest.of(0, 12));
        var best = new LinkedHashMap<String, WorkoutSet>();
        for (WorkoutSet set : sets.findByUserEmailOrderByExerciseNameAscWeightKgDescWorkoutDateDesc(email)) {
            best.putIfAbsent(set.getExerciseName().toLowerCase(Locale.ROOT), set);
        }
        var cardioLogs = cardio.findByUserEmailOrderBySessionDateDesc(email, PageRequest.of(0, 20));
        var userId=users.findByEmail(email).map(u->u.getId()).orElse(null);
        var today=java.time.LocalDate.now();
        var diet=foodDiary.findByUserIdAndEntryDateBetweenOrderByEntryDateAscLoggedAtAsc(userId,today.minusDays(6),today);
        var weightTrend=weights.findByUserEmailAndDateBetweenOrderByDateAsc(email,today.minusDays(29),today);
        double consumedToday=diet.stream().filter(x->x.getEntryDate().equals(today)).mapToDouble(FoodDiaryEntry::getCalories).sum()+legacyMeals.findByUserEmailAndMealDateOrderByIdAsc(email,today).stream().mapToDouble(MealEntry::getCalories).sum();
        double proteinToday=diet.stream().filter(x->x.getEntryDate().equals(today)).mapToDouble(FoodDiaryEntry::getProteinG).sum()+legacyMeals.findByUserEmailAndMealDateOrderByIdAsc(email,today).stream().mapToDouble(MealEntry::getProteinG).sum();
        var mission=userId==null?java.util.Optional.<FatLossMission>empty():missions.findByUserId(userId);double calorieBudget=mission.map(m->(double)m.getDailyCalorieBudget()).orElse((double)calories);double proteinTarget=mission.map(m->m.getStartWeightKg()*1.6).orElse(weight.map(w->w.getWeightKg()*1.6).orElse(0.0));
        var hydrationToday=userId==null?java.util.Optional.<HydrationFiberLog>empty():hydration.findByUserIdAndLogDate(userId,today);double waterMl=hydrationToday.map(HydrationFiberLog::getWaterMl).orElse(0);
        StringBuilder b = new StringBuilder("[ATHLETE LIVE PROFILE]\n");
        if (weight.isPresent()) b.append("Latest body weight: ").append(weight.get().getWeightKg()).append(" kg (logged ").append(weight.get().getDate()).append(").\n");
        else b.append("Latest body weight: not logged; any exercise-calorie protocol must label its 70 kg basis as a provisional estimate.\n");
        b.append("Daily calorie budget: ").append(calorieBudget).append(" kcal; consumed today: ").append(consumedToday).append(" kcal; remaining: ").append(Math.max(0,calorieBudget-consumedToday)).append(" kcal. Estimated TDEE: ").append(mission.map(FatLossMission::getMaintenanceCalories).map(v->v+" kcal (saved estimate)").orElse("not set; do not invent")).append(".\n");
        b.append("Protein today: ").append(proteinToday).append(" g; target: ").append(proteinTarget>0?proteinTarget+" g":"not set; estimate only if clearly labeled").append("; remaining: ").append(proteinTarget>0?Math.max(0,proteinTarget-proteinToday)+" g":"unknown").append(". Water today: ").append(waterMl).append("/").append(hydrationToday.map(HydrationFiberLog::getWaterGoalMl).orElse(0)).append(" ml; remaining: ").append(hydrationToday.map(h->Math.max(0,h.getWaterGoalMl()-h.getWaterMl())).orElse(0)).append(" ml.\n");
        b.append("BMI/BMR: ").append(users.findByEmail(email).map(u->{Double h=u.getHeightCm();Integer age=u.getAgeYears();Double w=weight.map(x->x.getWeightKg()).orElse(null);if(h==null||h<=0||age==null||age<=0||w==null)return "unavailable because age, height or weight is missing; do not guess.";double bmi=w/Math.pow(h/100.0,2),bmr=10*w+6.25*h-5*age+((u.getGender()!=null&&u.getGender().toUpperCase(Locale.ROOT).startsWith("M"))?5:-161);return String.format(Locale.ROOT,"%.1f BMI, %.0f kcal BMR (Mifflin-St Jeor, profile-derived)\n",bmi,bmr);}).orElse("unavailable; do not guess.\n"));
        b.append("Strength PRs (highest logged set by exercise):\n");
        best.values().stream().limit(8).forEach(s -> b.append("- ").append(s.getExerciseName()).append(": ").append(s.getWeightKg()).append(" kg x ").append(s.getReps()).append(" reps; ").append(s.getWorkoutDate()).append("\n"));
        if (best.isEmpty()) b.append("- No strength sets logged. Do not invent current lift loads.\n");
        b.append("Recent workout sets (up to 12):\n");
        recent.forEach(s -> b.append("- ").append(s.getExerciseName()).append(" set ").append(s.getSetNumber()).append(": ").append(s.getWeightKg()).append(" kg x ").append(s.getReps()).append(" reps; rest ").append(s.getRestSeconds()).append(" sec; ").append(s.getWorkoutDate()).append("\n"));
        if (recent.isEmpty()) b.append("- No recent workout sets logged.\n");
        b.append("Recent cardio logs (up to 5):\n");
        cardioLogs.forEach(c -> b.append("- ").append(c.getActivity()).append(": ").append(c.getDistanceKm()).append(" km, ").append(c.getDurationMinutes()).append(" min, pace ").append(String.format(Locale.ROOT,"%.2f",c.getPaceMinPerKm())).append(" min/km, ").append(c.getCaloriesBurned() == null ? "calories unlogged" : c.getCaloriesBurned() + " kcal").append(", stamina score ").append(c.getStaminaScore() == null ? "unlogged" : c.getStaminaScore()).append("; ").append(c.getSessionDate()).append("\n"));
        if (cardioLogs.isEmpty()) b.append("- No cardio sessions logged.\n");
        b.append("Recent 7-day nutrition diary (each item totals; missing days are unlogged): ").append(diet.stream().map(x->x.getEntryDate()+" "+x.getCalories()+"kcal/"+x.getProteinG()+"g protein/"+x.getFiberG()+"g fiber").toList()).append("\n");
        b.append("Recent 7-day legacy meal logs: ").append(legacyMeals.findByUserEmailAndMealDateBetweenOrderByMealDateAsc(email,today.minusDays(6),today).stream().map(x->x.getMealDate()+" "+x.getName()+" "+x.getCalories()+"kcal/"+x.getProteinG()+"g protein").toList()).append("\n");
        b.append("Weight history (last 30 days): ").append(weightTrend.stream().map(w->w.getDate()+":"+w.getWeightKg()+"kg").toList()).append("\n");
        double recent7=weightTrend.stream().filter(w->!w.getDate().isBefore(today.minusDays(6))).mapToDouble(w->w.getWeightKg()).average().orElse(0),prior7=weightTrend.stream().filter(w->!w.getDate().isAfter(today.minusDays(7))&&!w.getDate().isBefore(today.minusDays(13))).mapToDouble(w->w.getWeightKg()).average().orElse(0);b.append("7-day weight average: ").append(recent7==0?"not enough logged weigh-ins":String.format(Locale.ROOT,"%.2f kg",recent7)).append("; prior-week average: ").append(prior7==0?"not enough logged weigh-ins":String.format(Locale.ROOT,"%.2f kg",prior7)).append(".\n");
        if(userId!=null){mission.ifPresent(m->{b.append("Fitness mission: current ").append(weight.map(w->w.getWeightKg()+"kg").orElse("weight not logged")).append("; target ").append(m.getTargetWeightKg()).append("kg; original deadline ").append(m.getOriginalDeadline()).append("; revised deadline ").append(m.getRevisedDeadline()).append(".\n");});balances.findTopByUserIdOrderByEntryDateDesc(userId).ifPresent(x->b.append("pendingGapKcal: ").append(x.getPendingGapKcal()).append(" kcal; this is tracking only, never exercise debt.\n"));b.append("Custom exercise goals and plateau flags: ").append(exerciseGoals.findByUserEmailOrderByExerciseNameAsc(email).stream().map(g->g.getExerciseName()+" target "+g.getTargetWeightKg()+"kg x "+g.getTargetReps()+" by "+g.getDeadlineDate()+"; "+plateauFlag(email,g.getExerciseName())).toList()).append(".\n");b.append("Cardio goals: ").append(cardioGoals.findByUserEmailOrderByGoalNameAsc(email).stream().map(g->g.getGoalName()+" "+g.getTargetDistanceKm()+"km pace "+g.getTargetPaceMinPerKm()+" deadline "+g.getRevisedDeadline()).toList()).append(".\n");}
        b.append("Recovery flags: ").append(consumedToday<calorieBudget*.65?"low logged intake; prioritize food/rest":"no low-intake flag from today's available logs").append(hydrationToday.isPresent()&&hydrationToday.get().getWaterMl()<hydrationToday.get().getWaterGoalMl()*.5?"; water under half goal":"").append(". Sleep/readiness not logged, so do not infer recovery.\n[/ATHLETE LIVE PROFILE]");
        double weeklyRunKm = cardioLogs.stream().filter(c -> isRun(c.getActivity()) && c.getSessionDate() != null && !c.getSessionDate().toLocalDate().isBefore(today.minusDays(6)))
                .mapToDouble(CardioSession::getDistanceKm).sum();
        double longestRunKm = cardioLogs.stream().filter(c -> isRun(c.getActivity())).mapToDouble(CardioSession::getDistanceKm).max().orElse(0);
        double recentRunPace = cardioLogs.stream().filter(c -> isRun(c.getActivity()) && c.getDistanceKm() >= 1 && c.getPaceMinPerKm() > 0)
                .mapToDouble(CardioSession::getPaceMinPerKm).min().orElse(0);
        String primaryGoal = users.findByEmail(email).map(u -> u.getPrimaryGoal() == null ? "not set" : u.getPrimaryGoal()).orElse("not set");
        Double targetWeight = mission.map(FatLossMission::getTargetWeightKg).orElse(null);
        String targetDate = mission.map(m -> m.getRevisedDeadline().toString()).orElse(null);
        if (coachContextBuilder != null) {
            UserCoachContextBuilder.CoachContext coach = coachContextBuilder.build(email, userQuestion);
            b.append("\n").append(coach.promptBlock()).append("\n");
            if (formulaEngine != null) b.append(formulaEngine.build(coach)).append("\n");
        }
        if (chatHistory != null) {
            String recentChat = chatHistory.recentBlock(email, 10);
            if (!recentChat.isBlank()) {
                b.append("\n[RECENT COACH CHAT - only for follow-up continuity, never repeat or contradict it]\n")
                        .append(recentChat).append("[/RECENT COACH CHAT]\n");
            }
        }
        return new LiveContext(b.toString(), weight.map(w -> w.getWeightKg()).orElse(70.0), weight.isPresent(), calories,
                weeklyRunKm, longestRunKm, recentRunPace, primaryGoal, targetWeight, targetDate);
    }
    private boolean isRun(String activity) {
        if (activity == null) return false;
        String value = activity.toUpperCase(Locale.ROOT);
        return value.contains("RUN") || value.contains("JOG") || value.contains("TREADMILL");
    }
    private String plateauFlag(String email,String exercise){var rows=sets.sessionsForExercise(email,exercise);var sessions=new LinkedHashMap<java.time.LocalDateTime,List<WorkoutSet>>();for(var s:rows)sessions.computeIfAbsent(s.getWorkoutDate(),k->new java.util.ArrayList<>()).add(s);var it=sessions.values().iterator();if(!it.hasNext())return "no sessions logged";var current=metric(it.next());if(!it.hasNext())return "plateau not assessable yet";var previous=metric(it.next());return current.weight<=previous.weight&&current.reps<=previous.reps&&current.volume<=previous.volume?"possible stagnation in latest comparison":"progress observed in latest comparison";}
    private LiftMetric metric(List<WorkoutSet> s){return new LiftMetric(s.stream().mapToDouble(WorkoutSet::getWeightKg).max().orElse(0),s.stream().mapToInt(WorkoutSet::getReps).max().orElse(0),s.stream().mapToDouble(x->x.getWeightKg()*x.getReps()).sum());}
    private record LiftMetric(double weight,int reps,double volume){}
}
