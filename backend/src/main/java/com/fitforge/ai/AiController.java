package com.fitforge.ai;

import com.fitforge.cardio.CardioAiQuota;
import com.fitforge.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/ai") public class AiController {
    private final GeminiService service;
    private final AiLiveContextService context;
    private final CardioAiQuota quota;
    private final AiChatHistoryService history;

    public AiController(GeminiService service, AiLiveContextService context, CardioAiQuota quota, AiChatHistoryService history) {
        this.service = service;
        this.context = context;
        this.quota = quota;
        this.history = history;
    }

    @PostMapping("/meal-scan")
    public ApiResponse<AiDtos.MealAnalysis> meal(@Valid @RequestBody AiDtos.MealScanRequest r, Authentication auth) {
        quota.enforce(auth.getName());
        var analysis = service.scan(r, context.load(auth.getName()));
        history.record(auth.getName(), "MEAL_SCAN", r.prompt(), analysis == null ? null : analysis.name() + " (" + analysis.calories() + " kcal)");
        return ApiResponse.ok("Meal analyzed", analysis);
    }

    @PostMapping("/workout-advice")
    public ApiResponse<String> workout(@Valid @RequestBody AiDtos.PromptRequest r, Authentication auth) {
        String email = auth.getName();
        quota.enforce(email);
        String advice = service.workoutAdvice(email, r.prompt(), context.load(email, r.prompt()));
        history.record(email, "WORKOUT_ADVICE", r.prompt(), advice);
        return ApiResponse.ok("Workout advice generated", advice);
    }

    @PostMapping("/diet-plan")
    public ApiResponse<String> diet(@Valid @RequestBody AiDtos.PromptRequest r, Authentication auth) {
        String email = auth.getName();
        quota.enforce(email);
        String plan = service.dietPlan(email, r.prompt(), context.load(email, r.prompt()));
        history.record(email, "DIET_PLAN", r.prompt(), plan);
        return ApiResponse.ok("Diet plan generated", plan);
    }
}
