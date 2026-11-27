package com.fitforge.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitforge.common.ImageUploadValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.*;

@Service
public class GeminiService {
    private static final Logger LOG = LoggerFactory.getLogger(GeminiService.class);

    private static final String SYSTEM_INSTRUCTION = CoachPersonaPrompt.SYSTEM_INSTRUCTION;
    private static final String DEFAULT_MATH_NOTE = "Deterministic formulas are present in the live profile; use them exactly.";
    private static final String HISTORY_RULE = "HISTORY RULE: The live profile includes [HISTORICAL PROGRESS] with exact 1M/3M/6M/All-Time rollups and may include [SPECIFIC PAST-PERIOD LOG DIGEST] plus [RECENT COACH CHAT]. For any progress comparison or history question, cite those exact numbers and dates. Never claim you cannot see past months when logged history is present; if a recalled period shows no logs, say no logs were recorded for it.";

    private final RestClient client;
    private final ObjectMapper mapper;
    private final String key, baseUrl, model, fallbackModel;
    private final FitnessKnowledgeService knowledge;

    public GeminiService(RestClient.Builder builder, ObjectMapper mapper, FitnessKnowledgeService knowledge,
                         @Value("${app.gemini.api-key}") String key,
                         @Value("${app.gemini.base-url:https://generativelanguage.googleapis.com/v1beta}") String baseUrl,
                         @Value("${app.gemini.model:gemini-3.5-flash}") String model,
                         @Value("${app.gemini.fallback-model:gemini-flash-lite-latest}") String fallbackModel,
                         @Value("${app.gemini.timeout-ms:30000}") long timeoutMs) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(5));
        requestFactory.setReadTimeout(Duration.ofMillis(Math.max(5000, timeoutMs)));
        this.client = builder.requestFactory(requestFactory).build();
        if (key == null || key.isBlank() || key.startsWith("your-gemini")) {
            LOG.warn("GEMINI_API_KEY is not configured; AI endpoints will return 503");
        }
        this.mapper = mapper;
        this.knowledge = knowledge;
        this.key = key;
        this.baseUrl = baseUrl;
        this.model = model;
        this.fallbackModel = fallbackModel;
    }

    public JsonNode scanCardioScreenshot(byte[] imageBytes, String mimeType) {
        String instruction = "Read this cardio workout screenshot. Return only JSON with keys isCardioScreenshot(boolean), confidence(high|medium|low), sourceApp, activityType (RUNNING|SWIMMING|CYCLING|HIIT|WALKING|INDOOR_JOGGING|OTHER), sessionDate(YYYY-MM-DD or null), durationSeconds(integer or null), distanceKm(number or null), avgPaceSecPerKm(integer or null), caloriesBurned(integer or null), avgHeartRate(integer or null), notes. Use metric units (km, min/km). Do not guess unreadable values; set them null. If this is not a workout summary set isCardioScreenshot false and confidence low.";
        String encoded = Base64.getEncoder().encodeToString(imageBytes);
        String answer = generate(instruction, Map.of("inlineData", Map.of("mimeType", mimeType, "data", encoded)), true);
        try {
            int begin = answer.indexOf('{'), end = answer.lastIndexOf('}');
            if (begin < 0 || end < begin) throw new IllegalArgumentException("No JSON object in model output");
            return mapper.readTree(answer.substring(begin, end + 1));
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception ex) {
            throw new IllegalStateException("Screenshot scan is unavailable; try a clearer image");
        }
    }

    @Cacheable(value = "fitforge-ai-advice", key = "#email + ':' + #prompt.hashCode() + ':' + #live.promptBlock().hashCode()")
    public String workoutAdvice(String email, String prompt, AiLiveContextService.LiveContext live) {
        return coached("Give concise beginner strength/physique coaching. [USER_INPUT]" + prompt + "[/USER_INPUT]", prompt, live);
    }

    @Cacheable(value = "fitforge-ai-diet", key = "#email + ':' + #prompt.hashCode() + ':' + #live.promptBlock().hashCode()")
    public String dietPlan(String email, String prompt, AiLiveContextService.LiveContext live) {
        return coached("Create a concise Indian food plan using exact metric/Indian quantities (g, ml, roti, katori) and estimated kcal/protein/carbs/fat, aligned with the live athlete budget. [USER_INPUT]" + prompt + "[/USER_INPUT]", prompt, live);
    }

    public AiDtos.MealAnalysis scan(AiDtos.MealScanRequest req, AiLiveContextService.LiveContext live) {
        byte[] imageBytes = ImageUploadValidator.decodeAndValidateBase64(req.imageBase64(), req.mimeType());
        String verifiedMime = ImageUploadValidator.verifiedImageMime(imageBytes);
        String answer;
        try {
            String safeUserNote = req.prompt() == null ? "" : req.prompt().trim();
            String task = safeUserNote.isBlank()
                    ? "Analyze every visible Indian food item on the plate/thali. Return strictly JSON {isFood:boolean,confidence:\"high|medium|low\",name,items:[{foodName,estimatedServingSize,quantityG,calories,proteinG,carbsG,fatG,fiberG,confidencePercent,uncertaintyNote}],calories,proteinG,carbsG,fatG,fiberG,confidencePercent,uncertaintyNote}. If not food or too blurry, set isFood=false and confidence=\"low\". Use metric/Indian units only."
                    : "Analyze this image and return strictly JSON {isFood:boolean,confidence:\"high|medium|low\",name,items:[{foodName,estimatedServingSize,quantityG,calories,proteinG,carbsG,fatG,fiberG,confidencePercent,uncertaintyNote}],calories,proteinG,carbsG,fatG,fiberG,confidencePercent,uncertaintyNote}. If not food or too blurry, set isFood=false and confidence=\"low\". [USER_INPUT]" + safeUserNote + "[/USER_INPUT]";
            String encoded = Base64.getEncoder().encodeToString(imageBytes);
            answer = generate(live.promptBlock() + "\n" + knowledge.retrieve(task) + "\n" + task,
                    Map.of("inlineData", Map.of("mimeType", verifiedMime, "data", encoded)), true);
        } finally {
            Arrays.fill(imageBytes, (byte) 0);
        }
        try {
            String json = answer.substring(answer.indexOf('{'), answer.lastIndexOf('}') + 1);
            JsonNode n = mapper.readTree(json);
            boolean isFood = n.path("isFood").asBoolean(true);
            String confLabel = n.path("confidence").asText("").trim().toLowerCase(Locale.ROOT);
            List<AiDtos.MealItemAnalysis> items = new ArrayList<>();
            for (JsonNode x : n.path("items")) {
                items.add(new AiDtos.MealItemAnalysis(
                        x.path("foodName").asText("Indian food"),
                        x.path("estimatedServingSize").asText("estimated portion"),
                        x.path("quantityG").asDouble(),
                        x.path("calories").asDouble(),
                        x.path("proteinG").asDouble(),
                        x.path("carbsG").asDouble(),
                        x.path("fatG").asDouble(),
                        x.path("fiberG").asDouble(),
                        x.path("confidencePercent").asInt(60),
                        x.path("uncertaintyNote").asText("Photo portion estimate")));
            }
            int confidence = n.path("confidencePercent").asInt(
                    items.isEmpty() ? ("low".equals(confLabel) ? 20 : 60)
                            : (int) Math.round(items.stream().mapToInt(AiDtos.MealItemAnalysis::confidencePercent).average().orElse(60)));
            if (!isFood || "low".equals(confLabel) || confidence < 30) {
                throw new IllegalArgumentException("Image does not appear to be food or is too blurry; please upload a clear meal photo");
            }
            double kcal = n.has("calories") ? n.path("calories").asDouble() : items.stream().mapToDouble(AiDtos.MealItemAnalysis::calories).sum();
            double protein = n.has("proteinG") ? n.path("proteinG").asDouble() : items.stream().mapToDouble(AiDtos.MealItemAnalysis::proteinG).sum();
            double carbs = n.has("carbsG") ? n.path("carbsG").asDouble() : items.stream().mapToDouble(AiDtos.MealItemAnalysis::carbsG).sum();
            double fat = n.has("fatG") ? n.path("fatG").asDouble() : items.stream().mapToDouble(AiDtos.MealItemAnalysis::fatG).sum();
            Double fiber = n.has("fiberG") ? n.path("fiberG").asDouble() : items.stream().mapToDouble(AiDtos.MealItemAnalysis::fiberG).sum();
            String note = n.path("uncertaintyNote").asText("Photo estimates vary; please edit serving sizes before saving.");
            return new AiDtos.MealAnalysis(
                    n.path("name").asText(items.size() > 1 ? "Meal photo" : "Meal"),
                    (int) Math.round(kcal), protein, carbs, fat, fiber, note, items, confidence, note, true);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("AI response could not be parsed; try again with a clearer image");
        }
    }

    public String nutritionText(String email, String prompt, AiLiveContextService.LiveContext live) {
        String brain = CoachBrain.build(prompt, live);
        String math = brain.isBlank() ? DEFAULT_MATH_NOTE : brain;
        String answer = generate(CoachPersonaPrompt.compose(prompt + "\n" + HISTORY_RULE, live.promptBlock(), math, knowledge.retrieve(prompt)), null, true);
        return CoachPersonaPrompt.normalizeOrFallback(answer, mapper);
    }

    public String nutritionJson(String email, String prompt, AiLiveContextService.LiveContext live) {
        return generate(live.promptBlock() + "\n" + knowledge.retrieve(prompt) + "\n" + prompt, null, true);
    }

    private String coached(String task, String originalPrompt, AiLiveContextService.LiveContext live) {
        String brain = CoachBrain.build(originalPrompt, live);
        // Goal/timeline questions get pace or progression math; calorie-burn protocols only answer burn questions.
        String protocol = (brain.isBlank() && StaminaProtocols.applies(originalPrompt))
                ? StaminaProtocols.build(originalPrompt, live.protocolWeightKg(), live.weightLogged()) : "";
        String request = task + "\n" + HISTORY_RULE + (protocol.isBlank() ? "" : "\n\nInclude these deterministic stamina protocols in stepByStepPlan: " + protocol);
        String prompt = CoachPersonaPrompt.compose(request, live.promptBlock(),
                brain.isBlank() ? DEFAULT_MATH_NOTE : brain, knowledge.retrieve(originalPrompt));
        String answer = generate(prompt, null, true);
        return CoachPersonaPrompt.normalizeOrFallback(answer, mapper);
    }

    private String generate(String prompt, Map<String, Object> image, boolean jsonMode) {
        if (key == null || key.isBlank() || key.startsWith("your-gemini")) {
            throw new IllegalStateException("GEMINI_API_KEY is not configured on the server");
        }
        var parts = new ArrayList<Map<String, Object>>();
        parts.add(Map.of("text", prompt));
        if (image != null) parts.add(image);

        var genConfig = new LinkedHashMap<String, Object>();
        // Slightly warmer than a strict extractor so coach replies read like a human
        // trainer talking, while the JSON contract keeps the structure stable.
        genConfig.put("temperature", jsonMode ? 0.3 : 0.4);
        genConfig.put("maxOutputTokens", 4096);
        if (jsonMode) genConfig.put("responseMimeType", "application/json");

        var body = Map.of(
                "systemInstruction", Map.of("parts", List.of(Map.of("text", SYSTEM_INSTRUCTION))),
                "contents", List.of(Map.of("parts", parts)),
                "generationConfig", genConfig);

        try {
            return invokeModel(model, body);
        } catch (IllegalStateException known) {
            throw known;
        } catch (Exception primaryEx) {
            LOG.warn("Primary Gemini model {} failed: {}", model, summarizeGeminiError(primaryEx));
            if (isRetryableForFallback(primaryEx) && fallbackModel != null && !fallbackModel.isBlank() && !fallbackModel.equals(model)) {
                try {
                    return invokeModel(fallbackModel, body);
                } catch (IllegalStateException known) {
                    throw known;
                } catch (Exception fallbackEx) {
                    LOG.error("Fallback Gemini model {} also failed: {}", fallbackModel, summarizeGeminiError(fallbackEx));
                    throw new IllegalStateException("Gemini service is unavailable (" + summarizeGeminiError(fallbackEx) + ")");
                }
            }
            throw new IllegalStateException("Gemini service is unavailable (" + summarizeGeminiError(primaryEx) + ")");
        }
    }

    private static String summarizeGeminiError(Exception ex) {
        if (ex instanceof HttpClientErrorException httpEx) {
            return "HTTP " + httpEx.getStatusCode().value() + " - check GEMINI_API_KEY/quota";
        }
        if (ex instanceof HttpServerErrorException httpEx) {
            return "HTTP " + httpEx.getStatusCode().value() + " upstream error";
        }
        if (ex instanceof ResourceAccessException) {
            return "timeout/network error";
        }
        return ex.getClass().getSimpleName();
    }

    private String invokeModel(String targetModel, Map<String, Object> body) {
        JsonNode response = client.post()
                .uri(baseUrl + "/models/" + targetModel + ":generateContent")
                .header("x-goog-api-key", key)
                .body(body)
                .retrieve()
                .body(JsonNode.class);
        if (response == null) throw new IllegalStateException("Gemini service returned an empty response");
        String blockReason = response.path("promptFeedback").path("blockReason").asText("");
        if (!blockReason.isBlank()) {
            throw new IllegalStateException("AI request was blocked by safety filters; please rephrase");
        }
        JsonNode candidate = response.path("candidates").path(0);
        String finishReason = candidate.path("finishReason").asText("");
        if ("SAFETY".equalsIgnoreCase(finishReason) || "RECITATION".equalsIgnoreCase(finishReason) || "BLOCKLIST".equalsIgnoreCase(finishReason)) {
            throw new IllegalStateException("AI response was blocked by safety filters; please rephrase or use a clearer image");
        }
        if ("MAX_TOKENS".equalsIgnoreCase(finishReason)) {
            throw new IllegalStateException("AI response was truncated due to length; please try a simpler request or clearer photo");
        }
        String text = candidate.path("content").path("parts").path(0).path("text").asText(null);
        if (text == null || text.isBlank()) throw new IllegalStateException("Gemini service returned no content");
        return text;
    }

    private boolean isRetryableForFallback(Exception ex) {
        if (ex instanceof ResourceAccessException || ex instanceof HttpServerErrorException) return true;
        if (ex instanceof HttpClientErrorException clientEx) {
            int code = clientEx.getStatusCode().value();
            return code == 429 || code == 404;
        }
        return false;
    }
}
