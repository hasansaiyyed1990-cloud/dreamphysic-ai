package com.fitforge.cardio;

import com.fitforge.ai.AiLiveContextService;
import com.fitforge.ai.GeminiService;
import com.fitforge.common.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/cardio/ai")
public class CardioAiController {
    private final CardioRepository sessions;private final CardioGoalRepository goals;private final GeminiService gemini;private final AiLiveContextService context;private final CardioAiQuota quota;
    public CardioAiController(CardioRepository sessions,CardioGoalRepository goals,GeminiService gemini,AiLiveContextService context,CardioAiQuota quota){this.sessions=sessions;this.goals=goals;this.gemini=gemini;this.context=context;this.quota=quota;}

    @PostMapping("/coach") public ApiResponse<String> coach(Authentication auth,@Valid @RequestBody CoachInput input){String email=auth.getName();enforceQuota(email);var recent=sessions.findByUserEmailOrderBySessionDateDesc(email,org.springframework.data.domain.PageRequest.of(0,30));String facts=historyFacts(recent)+" Active cardio goals: "+goalFacts(email)+". User question: "+input.prompt()+". Respond as a concise Hinglish cardio coach. Never invent heart rate, age, or VO2 max; if unavailable, state it. Recommend beginner-appropriate pacing, recovery and exact session structure.";return ApiResponse.ok("Cardio coaching generated",gemini.nutritionText(email,facts,context.load(email)));}

    @GetMapping("/weekly-report") public ApiResponse<String> weekly(Authentication auth){String email=auth.getName();enforceQuota(email);LocalDate today=LocalDate.now(ZoneId.of("Asia/Kolkata"));var week=sessions.findByUserEmailAndSessionDateBetweenOrderBySessionDateDesc(email,today.minusDays(6).atStartOfDay(),today.plusDays(1).atStartOfDay());String facts="Prepare a 7-day cardio review from only these records. "+historyFacts(week)+" Report sessions, distance, minutes, available pace/heart rate, and clear missing-data notes. Explain trends only if comparison data exists. Give a conservative next-week plan with easy days and recovery; no punishment cardio.";return ApiResponse.ok("Weekly cardio report generated",gemini.nutritionText(email,facts,context.load(email)));}

    @GetMapping("/next-session") public ApiResponse<String> next(Authentication auth){String email=auth.getName();enforceQuota(email);var recent=sessions.findByUserEmailOrderBySessionDateDesc(email,org.springframework.data.domain.PageRequest.of(0,20));String facts="Suggest tomorrow's optional cardio session from saved history and active goals. "+historyFacts(recent)+" Goals: "+goalFacts(email)+". Return activity, warm-up, main set, cool-down, duration, a comfortable target pace only where recent pace exists, effort, recovery notes and why. Never make up age, heart rate, VO2 max or current capacity. If no data, recommend an easy walk or rest and ask for a first log.";return ApiResponse.ok("Next session suggestion generated",gemini.nutritionText(email,facts,context.load(email)));}

    @PostMapping("/readiness") public ApiResponse<String> readiness(Authentication auth,@Valid @RequestBody ReadinessInput input){String email=auth.getName();enforceQuota(email);var recent=sessions.findByUserEmailOrderBySessionDateDesc(email,org.springframework.data.domain.PageRequest.of(0,10));String facts="Give non-medical cardio readiness guidance. User reports sleep "+input.sleepHours()+" hours, fatigue "+input.fatigue()+"/10, soreness "+input.soreness()+"/10, pain="+input.sharpPain()+". Recent saved activity: "+historyFacts(recent)+". If sharp pain, illness, injury, or high fatigue, recommend rest and medical assessment for pain. Do not present this as diagnosis.";return ApiResponse.ok("Readiness guidance generated",gemini.nutritionText(email,facts,context.load(email)));}

    private void enforceQuota(String email){if(!quota.allow(email))throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,"Daily cardio AI limit reached; try again tomorrow");}
    private String goalFacts(String email){return goals.findByUserEmailOrderByGoalNameAsc(email).stream().map(g->g.getGoalName()+" targetDistanceKm="+g.getTargetDistanceKm()+" targetPaceMinPerKm="+g.getTargetPaceMinPerKm()+" targetTimeSeconds="+g.getTargetTimeSeconds()+" originalDeadline="+g.getOriginalDeadline()+" revisedDeadline="+g.getRevisedDeadline()).collect(Collectors.joining("; "));}
    private String historyFacts(List<CardioSession> rows){if(rows.isEmpty())return "No cardio sessions have been logged yet.";return rows.stream().map(s->String.format(Locale.ROOT,"%s %s: %.2f km, %d min, pace %.2f min/km, calories %s, average HR %s, source %s",s.getSessionDate(),s.getActivity(),s.getDistanceKm(),s.getDurationMinutes(),s.getPaceMinPerKm(),s.getCaloriesBurned()==null?"not logged":s.getCaloriesBurned(),s.getAverageHeartRate()==null?"not logged":s.getAverageHeartRate(),s.getSource())).collect(Collectors.joining("; "));}
    public record CoachInput(@NotBlank String prompt){}
    public record ReadinessInput(@jakarta.validation.constraints.DecimalMin("0") @jakarta.validation.constraints.DecimalMax("24") double sleepHours,@jakarta.validation.constraints.Min(0) @jakarta.validation.constraints.Max(10) int fatigue,@jakarta.validation.constraints.Min(0) @jakarta.validation.constraints.Max(10) int soreness,boolean sharpPain){}
}
