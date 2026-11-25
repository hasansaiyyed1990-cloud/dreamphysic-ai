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

    public AiController(GeminiService service, AiLiveContextService context, CardioAiQuota quota) {
        this.service = service;
        this.context = context;
        this.quota = quota;
    }

    @PostMapping("/meal-scan")
    public ApiResponse<AiDtos.MealAnalysis> meal(@Valid @RequestBody AiDtos.MealScanRequest r, Authentication auth) {
        quota.enforce(auth.getName());
        return ApiResponse.ok("Meal analyzed", service.scan(r, context.load(auth.getName())));
    }

    @PostMapping("/workout-advice")
    public ApiResponse<String> workout(@Valid @RequestBody AiDtos.PromptRequest r, Authentication auth) {
        String email = auth.getName();
        quota.enforce(email);
        return ApiResponse.ok("Workout advice generated", service.workoutAdvice(email, r.prompt(), context.load(email)));
    }

    @PostMapping("/diet-plan")
    public ApiResponse<String> diet(@Valid @RequestBody AiDtos.PromptRequest r, Authentication auth) {
        String email = auth.getName();
        quota.enforce(email);
        return ApiResponse.ok("Diet plan generated", service.dietPlan(email, r.prompt(), context.load(email)));
    }
}
