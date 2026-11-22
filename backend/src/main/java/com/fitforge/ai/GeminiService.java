package com.fitforge.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import java.util.List;
import java.util.Map;

@Service
public class GeminiService {
    private static final String SYSTEM_INSTRUCTION = "You are FitForge AI Coach, an elite but realistic Indian beginner coach for strength, hypertrophy, aesthetic physique, progressive overload, cardio/running/indoor stamina, calorie burn, recovery, creatine/whey, and Indian fitness nutrition. ONLY answer those fitness topics. For unrelated questions (coding, movies, news, general chat), respond with exactly one polite Hinglish line: 'Main sirf workouts, strength, stamina aur Indian fitness nutrition mein madad karta hoon—apna fitness goal poochho.' Do not continue the unrelated topic.\n" +
            "Use [USER_LIVE_STATS] as private user context; tailor advice to logged weight, actual sets/PRs, cardio, and calorie target. Never invent missing measurements or lift loads. Beginner advice must be precise: specify sets, reps, rest seconds, tempo (eccentric-pause-concentric), effort, and realistic progression criteria/timeline. Increase isolation exercises by 0.5–1 kg only after the rep ceiling is achieved with good form for 2 sessions (usually 1–3 weeks); compounds by 1.25–2.5 kg upper body or 2.5–5 kg lower body after criteria are met (often 2–4 weeks), adjusting to available plates and recovery. Explain that progress varies. For extreme natural physique goals such as 22-inch biceps, state natural-vs-pro limits honestly first, then give a concrete 6-month aesthetic plan with measurable milestones based on actual logged lifts; if no baseline load is logged, use rep/RIR milestones and ask the user to log loads rather than making up kilograms. Give safe, sustainable guidance and flag pain/injury concerns. For nutrition, use common Indian foods and the live calorie target; avoid medical diagnosis. If the request concerns calorie burn, stamina, running, or cardio, honor the [REQUIRED_PROTOCOLS] below exactly; the server appends both required protocols after your answer.";

    private final RestClient client;
    private final ObjectMapper mapper;
    private final String key;
    private final String baseUrl;
    private final String model;

    public GeminiService(RestClient.Builder builder, ObjectMapper mapper,
                         @Value("${app.gemini.api-key}") String key,
                         @Value("${app.gemini.base-url:https://generativelanguage.googleapis.com/v1beta}") String baseUrl,
                         @Value("${app.gemini.model:gemini-3.8-flash}") String model) {
        this.client = builder.build(); this.mapper = mapper; this.key = key; this.baseUrl = baseUrl; this.model = model;
    }

    @Cacheable(value="fitforge-ai-advice", key="#email + ':' + #prompt.hashCode() + ':' + #live.promptBlock().hashCode()")
    public String workoutAdvice(String email, String prompt, AiLiveContextService.LiveContext live) {
        return coached("Give beginner-friendly strength and physique coaching. Request: " + prompt, prompt, live);
    }

    @Cacheable(value="fitforge-ai-diet", key="#email + ':' + #prompt.hashCode() + ':' + #live.promptBlock().hashCode()")
    public String dietPlan(String email, String prompt, AiLiveContextService.LiveContext live) {
        return coached("Create a practical Indian nutrition plan aligned to the user's live daily calorie target. Include meal-wise estimated kcal and protein/carbohydrate/fat. Request: " + prompt, prompt, live);
    }

    public AiDtos.MealAnalysis scan(AiDtos.MealScanRequest req, AiLiveContextService.LiveContext live) {
        String p = req.prompt()==null || req.prompt().isBlank()
                ? "Analyze this Indian meal photo for a fitness meal log. Return only JSON with name, calories, proteinG, carbsG, fatG, fiberG, description. Estimate portions conservatively and mention uncertainty."
                : req.prompt();
        String answer = generate(live.promptBlock() + "\n\n" + p,
                Map.of("inlineData", Map.of("mimeType", req.mimeType()==null ? "image/jpeg" : req.mimeType(), "data", req.imageBase64())));
        try {
            String json = answer.substring(answer.indexOf('{'), answer.lastIndexOf('}')+1);
            JsonNode n = mapper.readTree(json);
            return new AiDtos.MealAnalysis(n.path("name").asText("Meal"), n.path("calories").asInt(), n.path("proteinG").asDouble(), n.path("carbsG").asDouble(), n.path("fatG").asDouble(), n.hasNonNull("fiberG") ? n.get("fiberG").asDouble() : null, n.path("description").asText("Estimated from photo"));
        } catch (Exception e) { throw new IllegalStateException("AI response could not be parsed; try again with a clearer image"); }
    }

    private String coached(String task, String originalPrompt, AiLiveContextService.LiveContext live) {
        String protocols = StaminaProtocols.applies(originalPrompt) ? StaminaProtocols.build(originalPrompt, live.protocolWeightKg(), live.weightLogged()) : "";
        String prompt = live.promptBlock() + "\n\n" + task + (protocols.isBlank() ? "" : "\n\n[REQUIRED_PROTOCOLS]\n" + protocols);
        String answer = generate(prompt, null);
        return answer + protocols;
    }

    private String generate(String prompt, Map<String,Object> image) {
        try {
            var parts = new java.util.ArrayList<Map<String,Object>>(); parts.add(Map.of("text", prompt)); if (image != null) parts.add(image);
            var body = Map.of("systemInstruction", Map.of("parts", List.of(Map.of("text", SYSTEM_INSTRUCTION))),
                    "contents", List.of(Map.of("parts", parts)),
                    "generationConfig", Map.of("temperature", 0.35, "maxOutputTokens", 1400));
            String url = baseUrl + "/models/" + model + ":generateContent";
            JsonNode response = client.post().uri(url).header("x-goog-api-key", key).body(body).retrieve().body(JsonNode.class);
            String result = response==null ? null : response.path("candidates").path(0).path("content").path("parts").path(0).path("text").asText(null);
            if (result==null || result.isBlank()) throw new IllegalStateException();
            return result;
        } catch (Exception e) { throw new IllegalStateException("Gemini service is unavailable; retry shortly"); }
    }
}
