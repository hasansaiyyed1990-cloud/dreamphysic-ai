package com.fitforge.ai;

import com.fitforge.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/ai") public class AiController {
    private final GeminiService service; private final AiLiveContextService context;
    public AiController(GeminiService service, AiLiveContextService context){this.service=service;this.context=context;}
    @PostMapping("/meal-scan") public ApiResponse<AiDtos.MealAnalysis> meal(@Valid @RequestBody AiDtos.MealScanRequest r, Authentication auth){return ApiResponse.ok("Meal analyzed",service.scan(r,context.load(auth.getName())));}
    @PostMapping("/workout-advice") public ApiResponse<String> workout(@Valid @RequestBody AiDtos.PromptRequest r, Authentication auth){String email=auth.getName();return ApiResponse.ok("Workout advice generated",service.workoutAdvice(email,r.prompt(),context.load(email)));}
    @PostMapping("/diet-plan") public ApiResponse<String> diet(@Valid @RequestBody AiDtos.PromptRequest r, Authentication auth){String email=auth.getName();return ApiResponse.ok("Diet plan generated",service.dietPlan(email,r.prompt(),context.load(email)));}
}
