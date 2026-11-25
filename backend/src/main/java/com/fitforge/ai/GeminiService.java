package com.fitforge.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import java.util.*;

@Service
public class GeminiService {
    private static final String SYSTEM_INSTRUCTION = """
        You are Dream Physic AI: Personal Trainer for Bodybuilding, a veteran Indian gym-floor personal trainer and strength/conditioning coach with 10+ years of practical experience. Speak in natural, direct Hinglish: concise, authoritative, motivating, practical. No robotic filler, no textbook essay, never say 'As an AI'.
        Strict domain: answer only gym training, hypertrophy, strength, physique, cardio, running/stamina, calorie balance, recovery, supplements, or Indian nutrition. For anything outside this domain, reply with exactly one sharp Hinglish line redirecting to fitness and nothing else.
        Treat [ATHLETE LIVE PROFILE] as the source of truth. In the first two lines call out only logged stats that are actually available (weight, recent lift, remaining calories/protein/water, cardio pace, backlog, or recovery). If a stat is missing, say it is not logged; never fabricate age, height, BMI, BMR, TDEE, weight, PR, or recovery.
        For every normal coaching answer use exactly these four headings and order:
        **Coach's Diagnosis:** 1-2 direct lines tied to real stats.
        **Kya Karna Hai (Exact Action Plan):** exact sets, reps, rest seconds, tempo and safe load/progression for lifting; or precise pace/zone/duration for cardio; or exact Indian food quantities and macros for nutrition. Use matching FitnessKnowledgeService exercise cues, anatomy, program, and science rules.
        **Kya Bilkul Nahi Karna Hai (Strict DON'Ts):** 2-3 specific mistakes to avoid now.
        **Next Checkpoint:** one measurable target before next session/weigh-in.
        Keep workout prose short. For normal beginner double progression, add reps first; raise isolation loads by 0.5-1 kg only after the rep ceiling with clean form for 2 sessions, and compounds by the smallest practical 1.25-2.5 kg upper / 2.5-5 kg lower only after criteria and recovery support it. Give exercise-specific cues, not generic anatomy claims.
        Healthy reserve is mandatory: pendingGapKcal is tracking context, never exercise debt. No crash diets, punishment cardio, excessive cardio, or earning food. Extra activity can only be 0, 50, or 100 kcal, strictly optional easy walking/cycling when recovery is green; choose 0 for fatigue, low intake, pain, or poor hydration and prioritize rest/nutrition. Respect revised deadlines.
        For structured API requests (JSON/photo scan, protein option object, grocery list, verdict fields), return exactly the requested schema; do not wrap JSON in the four prose headings. Meal photo estimates must say uncertain and remain editable.
        Follow matching knowledge resource rules included with the request. If dataset matching finds no exercise cue, say so rather than inventing a database citation.
        """;

    private final RestClient client;
    private final ObjectMapper mapper;
    private final String key,baseUrl,model;
    private final FitnessKnowledgeService knowledge;

    public GeminiService(RestClient.Builder builder,ObjectMapper mapper,FitnessKnowledgeService knowledge,
                         @Value("${app.gemini.api-key}") String key,
                         @Value("${app.gemini.base-url:https://generativelanguage.googleapis.com/v1beta}") String baseUrl,
                         @Value("${app.gemini.model:gemini-2.5-flash}") String model){var requestFactory=new org.springframework.http.client.SimpleClientHttpRequestFactory();requestFactory.setConnectTimeout(java.time.Duration.ofSeconds(5));requestFactory.setReadTimeout(java.time.Duration.ofSeconds(60));this.client=builder.requestFactory(requestFactory).build();if(key==null||key.isBlank()||key.startsWith("your-gemini"))org.slf4j.LoggerFactory.getLogger(GeminiService.class).warn("GEMINI_API_KEY is not configured; AI endpoints will return 503");this.mapper=mapper;this.knowledge=knowledge;this.key=key;this.baseUrl=baseUrl;this.model=model;}

    public JsonNode scanCardioScreenshot(byte[] imageBytes,String mimeType){
        String instruction="Read this cardio workout screenshot. Return only JSON with keys isCardioScreenshot(boolean), confidence(high|medium|low), sourceApp, activityType (RUNNING|SWIMMING|CYCLING|HIIT|WALKING|INDOOR_JOGGING|OTHER), sessionDate(YYYY-MM-DD or null), durationSeconds(integer or null), distanceKm(number or null), avgPaceSecPerKm(integer or null), caloriesBurned(integer or null), avgHeartRate(integer or null), notes. Use metric units. Do not guess unreadable values; set them null. If this is not a workout summary set isCardioScreenshot false and confidence low.";
        try {
            String encoded=Base64.getEncoder().encodeToString(imageBytes);
            String answer=generate(instruction,Map.of("inlineData",Map.of("mimeType",mimeType,"data",encoded)));
            int begin=answer.indexOf('{'),end=answer.lastIndexOf('}');
            if(begin<0||end<begin)throw new IllegalArgumentException("No JSON object in model output");
            return mapper.readTree(answer.substring(begin,end+1));
        } catch(Exception ex) { throw new IllegalStateException("Screenshot scan is unavailable; try a clearer image"); }
    }
    @Cacheable(value="fitforge-ai-advice",key="#email + ':' + #prompt.hashCode() + ':' + #live.promptBlock().hashCode()")
    public String workoutAdvice(String email,String prompt,AiLiveContextService.LiveContext live){return coached("Give concise beginner strength/physique coaching. User request: "+prompt,prompt,live);}

    @Cacheable(value="fitforge-ai-diet",key="#email + ':' + #prompt.hashCode() + ':' + #live.promptBlock().hashCode()")
    public String dietPlan(String email,String prompt,AiLiveContextService.LiveContext live){return coached("Create a concise Indian food plan using exact quantities and estimated kcal/protein/carbs/fat, aligned with the live athlete budget. User request: "+prompt,prompt,live);}

    public AiDtos.MealAnalysis scan(AiDtos.MealScanRequest req,AiLiveContextService.LiveContext live){String task=req.prompt()==null||req.prompt().isBlank()?"Analyze every visible Indian food item. Return only JSON {name,items:[{foodName,estimatedServingSize,quantityG,calories,proteinG,carbsG,fatG,fiberG,confidencePercent,uncertaintyNote}],calories,proteinG,carbsG,fatG,fiberG,confidencePercent,uncertaintyNote}. State uncertainty; estimates must be editable before diary save.":"Analyze this image and return only the requested per-item nutrition JSON with serving sizes, kcal/macros/fiber, confidencePercent, uncertaintyNote. User note: "+req.prompt();String answer=generate(live.promptBlock()+"\n"+knowledge.retrieve(task)+"\n"+task,Map.of("inlineData",Map.of("mimeType",req.mimeType()==null?"image/jpeg":req.mimeType(),"data",req.imageBase64())));try{String json=answer.substring(answer.indexOf('{'),answer.lastIndexOf('}')+1);JsonNode n=mapper.readTree(json);List<AiDtos.MealItemAnalysis> items=new ArrayList<>();for(JsonNode x:n.path("items"))items.add(new AiDtos.MealItemAnalysis(x.path("foodName").asText("Indian food"),x.path("estimatedServingSize").asText("estimated portion"),x.path("quantityG").asDouble(),x.path("calories").asDouble(),x.path("proteinG").asDouble(),x.path("carbsG").asDouble(),x.path("fatG").asDouble(),x.path("fiberG").asDouble(),x.path("confidencePercent").asInt(60),x.path("uncertaintyNote").asText("Photo portion estimate")));int confidence=n.path("confidencePercent").asInt(items.isEmpty()?60:(int)Math.round(items.stream().mapToInt(AiDtos.MealItemAnalysis::confidencePercent).average().orElse(60)));double kcal=n.has("calories")?n.path("calories").asDouble():items.stream().mapToDouble(AiDtos.MealItemAnalysis::calories).sum();double protein=n.has("proteinG")?n.path("proteinG").asDouble():items.stream().mapToDouble(AiDtos.MealItemAnalysis::proteinG).sum();double carbs=n.has("carbsG")?n.path("carbsG").asDouble():items.stream().mapToDouble(AiDtos.MealItemAnalysis::carbsG).sum();double fat=n.has("fatG")?n.path("fatG").asDouble():items.stream().mapToDouble(AiDtos.MealItemAnalysis::fatG).sum();Double fiber=n.has("fiberG")?n.path("fiberG").asDouble():items.stream().mapToDouble(AiDtos.MealItemAnalysis::fiberG).sum();String note=n.path("uncertaintyNote").asText("Photo estimates vary; please edit serving sizes before saving.");return new AiDtos.MealAnalysis(n.path("name").asText(items.size()>1?"Meal photo":"Meal"),(int)Math.round(kcal),protein,carbs,fat,fiber,note,items,confidence,note);}catch(Exception e){throw new IllegalStateException("AI response could not be parsed; try again with a clearer image");}}

    public String nutritionText(String email,String prompt,AiLiveContextService.LiveContext live){return generate(live.promptBlock()+"\n"+knowledge.retrieve(prompt)+"\n"+prompt,null);}

    private String coached(String task,String originalPrompt,AiLiveContextService.LiveContext live){String protocol=StaminaProtocols.applies(originalPrompt)?StaminaProtocols.build(originalPrompt,live.protocolWeightKg(),live.weightLogged()):"";String prompt=live.promptBlock()+"\n"+knowledge.retrieve(originalPrompt)+"\n"+task+(protocol.isBlank()?"":"\n\n[REQUIRED_PROTOCOLS: include both options inside Kya Karna Hai exactly]\n"+protocol);String answer=generate(prompt,null);if(protocol.isBlank())return answer;int insert=answer.indexOf("**Kya Bilkul Nahi Karna Hai");if(insert>=0)return answer.substring(0,insert)+protocol+"\n\n"+answer.substring(insert);return answer+"\n\n**Kya Karna Hai (Exact Action Plan):**"+protocol;}

    private String generate(String prompt,Map<String,Object> image){try{var parts=new ArrayList<Map<String,Object>>();parts.add(Map.of("text",prompt));if(image!=null)parts.add(image);var body=Map.of("systemInstruction",Map.of("parts",List.of(Map.of("text",SYSTEM_INSTRUCTION))),"contents",List.of(Map.of("parts",parts)),"generationConfig",Map.of("temperature",0.35,"maxOutputTokens",4096));JsonNode response=client.post().uri(baseUrl+"/models/"+model+":generateContent").header("x-goog-api-key",key).body(body).retrieve().body(JsonNode.class);String text=response==null?null:response.path("candidates").path(0).path("content").path("parts").path(0).path("text").asText(null);if(text==null||text.isBlank())throw new IllegalStateException();return text;}catch(Exception e){throw new IllegalStateException("Gemini service is unavailable; retry shortly");}}
}
