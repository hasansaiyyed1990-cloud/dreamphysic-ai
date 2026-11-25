package com.fitforge;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitforge.ai.AiLiveContextService;
import com.fitforge.ai.FitnessKnowledgeService;
import com.fitforge.ai.GeminiService;
import com.fitforge.auth.AppUser;
import com.fitforge.auth.AppUserRepository;
import com.fitforge.auth.JwtService;
import com.fitforge.cardio.CardioRepository;
import com.fitforge.nutrition.DailyCalorieBalanceRepository;
import com.fitforge.nutrition.FoodDiaryRepository;
import com.fitforge.progress.WeightRepository;
import com.fitforge.workout.WorkoutSessionRepository;
import com.fitforge.workout.WorkoutSetRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** H2-backed HTTP integration coverage for the highest-risk production contracts. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(ProductionCriticalScenariosTest.TestAiConfiguration.class)
class ProductionCriticalScenariosTest {
    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired AppUserRepository users;
    @Autowired PasswordEncoder encoder;
    @Autowired JwtService jwt;
    @Autowired WorkoutSessionRepository workoutSessions;
    @Autowired WorkoutSetRepository workoutSets;
    @Autowired CardioRepository cardioSessions;
    @Autowired FoodDiaryRepository diary;
    @Autowired WeightRepository weights;
    @Autowired DailyCalorieBalanceRepository balances;
    @Autowired GeminiService gemini;

    private String email;
    private String token;
    private AppUser user;

    @BeforeEach
    void createUser() {
        email = "integration-" + UUID.randomUUID() + "@example.test";
        user = users.saveAndFlush(new AppUser("Integration User", email, encoder.encode("SafeTestPass123")));
        token = jwt.issue(user);
    }

    @Test
    void idorCannotReadChangeOrDeleteAnotherUsersFitnessRecords() throws Exception {
        AppUser owner = newUser();
        String ownerToken = jwt.issue(owner);
        LocalDate day = LocalDate.now(IST).minusDays(2);

        JsonNode workout = postJson(ownerToken, "/api/workouts", """
                {"name":"Owner session","sessionDate":"%sT08:00:00"}
                """.formatted(day));
        long workoutId = workout.path("id").asLong();
        JsonNode set = postJson(ownerToken, "/api/workouts/" + workoutId + "/sets", """
                {"exerciseName":"Bench Press","setNumber":1,"reps":8,"weightKg":40,"restSeconds":90}
                """);

        JsonNode cardio = postJson(ownerToken, "/api/cardio", """
                {"distanceKm":3.0,"durationMinutes":20,"caloriesBurned":150,"activity":"RUNNING","sessionDate":"%sT07:00:00","source":"MANUAL"}
                """.formatted(day));
        long cardioId = cardio.path("id").asLong();
        JsonNode meal = postJson(ownerToken, "/api/nutrition/diary", mealJson(day, 420));
        long mealId = meal.path("id").asLong();
        JsonNode weight = postJson(ownerToken, "/api/progress/weight", """
                {"date":"%s","weightKg":79.45}
                """.formatted(day));
        long weightId = weight.path("id").asLong();

        mvc.perform(bearer(get("/api/workouts/" + workoutId), token)).andExpect(status().isBadRequest());
        mvc.perform(bearer(delete("/api/workouts/sets/" + set.path("id").asLong()), token)).andExpect(status().isBadRequest());
        mvc.perform(bearer(put("/api/workouts/" + workoutId), token).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().is4xxClientError());
        mvc.perform(bearer(delete("/api/workouts/" + workoutId), token)).andExpect(status().is4xxClientError());

        mvc.perform(bearer(get("/api/cardio"), token)).andExpect(status().isOk()).andExpect(jsonPath("$.data").isEmpty());
        mvc.perform(bearer(put("/api/cardio/" + cardioId), token).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().is4xxClientError());
        mvc.perform(bearer(delete("/api/cardio/" + cardioId), token)).andExpect(status().isBadRequest());

        mvc.perform(bearer(get("/api/nutrition/diary/" + day), token)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.entries").isEmpty());
        mvc.perform(bearer(put("/api/nutrition/diary/" + mealId), token).contentType(MediaType.APPLICATION_JSON).content(mealJson(day, 500)))
                .andExpect(status().isBadRequest());
        mvc.perform(bearer(delete("/api/nutrition/diary/" + mealId), token)).andExpect(status().isBadRequest());

        mvc.perform(bearer(get("/api/progress/weight?from=" + day + "&to=" + day), token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data").isEmpty());
        mvc.perform(bearer(put("/api/progress/weight/" + weightId), token).content("{}")).andExpect(status().is4xxClientError());
        mvc.perform(bearer(delete("/api/progress/weight/" + weightId), token)).andExpect(status().is4xxClientError());

        assertThat(workoutSessions.findById(workoutId)).isPresent();
        assertThat(cardioSessions.findById(cardioId)).isPresent();
        assertThat(diary.findById(mealId)).isPresent();
        assertThat(weights.findById(weightId)).isPresent();
    }

    @Test
    void expiredAndInvalidatedJwtTokensAreRejected() throws Exception {
        mvc.perform(get("/api/progress/metabolic"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().json("{\"error\":\"Unauthorized\"}"));

        String expired = expiredJwt(user);
        mvc.perform(bearer(get("/api/progress/metabolic"), expired)).andExpect(status().isUnauthorized())
                .andExpect(content().json("{\"error\":\"Unauthorized\"}"));

        mvc.perform(bearer(post("/api/auth/logout-all"), token)).andExpect(status().isOk());
        mvc.perform(bearer(get("/api/progress/metabolic"), token)).andExpect(status().isUnauthorized())
                .andExpect(content().json("{\"error\":\"Unauthorized\"}"));
    }

    @Test
    void loginRateLimitAndDailyCardioAiQuotaReturn429() throws Exception {
        String ip = "198.51.100." + (10 + Math.floorMod(email.hashCode(), 200));
        for (int i = 0; i < 5; i++) {
            mvc.perform(post("/api/auth/login").header("X-Forwarded-For", ip)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(("{\"email\":\"absent-%d@example.test\",\"password\":\"BadPass123\"}").formatted(i)))
                    .andExpect(status().isUnauthorized());
        }
        mvc.perform(post("/api/auth/login").header("X-Forwarded-For", ip)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"still-absent@example.test\",\"password\":\"BadPass123\"}"))
                .andExpect(status().isTooManyRequests());

        String payload = "{\"prompt\":\"Suggest an easy beginner run\"}";
        mvc.perform(bearer(post("/api/cardio/ai/coach"), token).contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isOk());
        mvc.perform(bearer(post("/api/cardio/ai/coach"), token).contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void identicalWorkoutSetAndMealPostsConflictWithinFiveSeconds() throws Exception {
        JsonNode workout = postJson(token, "/api/workouts", """
                {"name":"Idempotency session","sessionDate":"%s"}
                """.formatted(LocalDateTime.now(IST)));
        long workoutId = workout.path("id").asLong();
        String set = "{\"exerciseName\":\"Squat\",\"setNumber\":1,\"reps\":8,\"weightKg\":30,\"restSeconds\":90}";
        mvc.perform(bearer(post("/api/workouts/" + workoutId + "/sets"), token).contentType(MediaType.APPLICATION_JSON).content(set))
                .andExpect(status().isOk());
        mvc.perform(bearer(post("/api/workouts/" + workoutId + "/sets"), token).contentType(MediaType.APPLICATION_JSON).content(set))
                .andExpect(status().isConflict());

        String meal = mealJson(LocalDate.now(IST), 300);
        mvc.perform(bearer(post("/api/nutrition/diary"), token).contentType(MediaType.APPLICATION_JSON).content(meal))
                .andExpect(status().isOk());
        mvc.perform(bearer(post("/api/nutrition/diary"), token).contentType(MediaType.APPLICATION_JSON).content(meal))
                .andExpect(status().isConflict());
    }

    @Test
    void yesterdayMealAndCardioChangesRecalculateStoredCalorieBalance() throws Exception {
        LocalDate yesterday = LocalDate.now(IST).minusDays(1);
        JsonNode balance = postJson(token, "/api/nutrition/backlog", """
                {"entryDate":"%s","estimatedTdee":2300,"plannedDeficit":500}
                """.formatted(yesterday));
        assertThat(balance.path("actualDeficit").asDouble()).isEqualTo(2300.0);

        JsonNode meal = postJson(token, "/api/nutrition/diary", mealJson(yesterday, 800));
        assertThat(balanceFor(yesterday).getConsumedCalories()).isEqualTo(800.0);
        mvc.perform(bearer(put("/api/nutrition/diary/" + meal.path("id").asLong()), token)
                .contentType(MediaType.APPLICATION_JSON).content(mealJson(yesterday, 900)))
                .andExpect(status().isOk());
        assertThat(balanceFor(yesterday).getConsumedCalories()).isEqualTo(900.0);
        assertThat(balanceFor(yesterday).getActualDeficit()).isEqualTo(1400.0);

        JsonNode cardio = postJson(token, "/api/cardio", """
                {"distanceKm":2.0,"durationMinutes":15,"caloriesBurned":90,"activity":"INDOOR_JOGGING","sessionDate":"%sT18:30:00"}
                """.formatted(yesterday));
        assertThat(balanceFor(yesterday).getConsumedCalories()).isEqualTo(900.0);
        mvc.perform(bearer(delete("/api/cardio/" + cardio.path("id").asLong()), token)).andExpect(status().isOk());
        assertThat(balanceFor(yesterday).getConsumedCalories()).isEqualTo(900.0);

        mvc.perform(bearer(delete("/api/nutrition/diary/" + meal.path("id").asLong()), token)).andExpect(status().isOk());
        assertThat(balanceFor(yesterday).getConsumedCalories()).isEqualTo(0.0);
        assertThat(balanceFor(yesterday).getActualDeficit()).isEqualTo(2300.0);
        assertThat(Double.isFinite(balanceFor(yesterday).getPendingGapKcal())).isTrue();
    }

    @Test
    void bigDecimalWeightFeedsValidBmrAndTdee() throws Exception {
        mvc.perform(bearer(put("/api/progress/metabolic"), token).contentType(MediaType.APPLICATION_JSON)
                .content("{\"heightCm\":180,\"ageYears\":30,\"gender\":\"MALE\",\"activityLevel\":\"MODERATE\"}"))
                .andExpect(status().isOk());
        postJson(token, "/api/progress/weight", """
                {"date":"%s","weightKg":80.12}
                """.formatted(LocalDate.now(IST)));

        mvc.perform(get("/api/progress/metabolic").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.latestWeightKg").value(80.12))
                .andExpect(jsonPath("$.data.bmr").value(1781.2))
                .andExpect(jsonPath("$.data.tdee").value(2760.9));
        assertThat(weights.findTopByUserEmailOrderByDateDesc(email).orElseThrow().getWeightKg()).isEqualTo(80.12);
    }

    @Test
    void accountDeletionRemovesUserRecordsAndInvalidatesJwt() throws Exception {
        LocalDate today = LocalDate.now(IST);
        JsonNode workout = postJson(token, "/api/workouts", """
                {"name":"Delete account workout","sessionDate":"%sT09:00:00"}
                """.formatted(today));
        long workoutId = workout.path("id").asLong();
        postJson(token, "/api/workouts/" + workoutId + "/sets", """
                {"exerciseName":"Row","setNumber":1,"reps":10,"weightKg":20,"restSeconds":60}
                """);
        postJson(token, "/api/cardio", """
                {"distanceKm":1.5,"durationMinutes":12,"caloriesBurned":80,"activity":"RUNNING","sessionDate":"%sT07:00:00"}
                """.formatted(today));
        postJson(token, "/api/nutrition/diary", mealJson(today, 350));
        postJson(token, "/api/progress/weight", ("{\"date\":\"%s\",\"weightKg\":80}").formatted(today));

        mvc.perform(delete("/api/user/account").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        assertThat(users.findByEmail(email)).isEmpty();
        assertThat(workoutSessions.findByUserEmailOrderBySessionDateDesc(email)).isEmpty();
        assertThat(workoutSets.findByUserEmailOrderByWorkoutDateDesc(email,
                org.springframework.data.domain.PageRequest.of(0, 20))).isEmpty();
        assertThat(cardioSessions.findByUserEmailOrderBySessionDateDesc(email)).isEmpty();
        assertThat(weights.findByUserEmailAndDateBetweenOrderByDateAsc(email, today.minusDays(1), today)).isEmpty();
        mvc.perform(get("/api/progress/metabolic").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized())
                .andExpect(content().json("{\"error\":\"Unauthorized\"}"));
    }

    private AppUser newUser() {
        String otherEmail = "owner-" + UUID.randomUUID() + "@example.test";
        return users.saveAndFlush(new AppUser("Owner", otherEmail, encoder.encode("SafeTestPass123")));
    }

    private JsonNode postJson(String bearer, String path, String body) throws Exception {
        String response = mvc.perform(post(path).header("Authorization", "Bearer " + bearer)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return mapper.readTree(response).path("data");
    }

    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder bearer(
            org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request, String value) {
        return request.header("Authorization", "Bearer " + value);
    }

    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder get(String path) { return getRequest(path); }
    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder post(String path) { return postRequest(path); }
    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder put(String path) { return putRequest(path); }
    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder delete(String path) { return deleteRequest(path); }
    private static org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder getRequest(String path) { return org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(path); }
    private static org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder postRequest(String path) { return org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(path); }
    private static org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder putRequest(String path) { return org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put(path); }
    private static org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder deleteRequest(String path) { return org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete(path); }

    private String mealJson(LocalDate date, double calories) {
        return ("{\"entryDate\":\"%s\",\"mealCategory\":\"LUNCH\",\"foodName\":\"Test Meal\",\"quantity\":1,\"unit\":\"serving\",\"preparationType\":\"COOKED\",\"calories\":%s,\"proteinG\":30,\"carbsG\":40,\"fatG\":10,\"fiberG\":5}")
                .formatted(date, calories);
    }

    private com.fitforge.nutrition.DailyCalorieBalance balanceFor(LocalDate date) {
        return balances.findByUserIdAndEntryDate(user.getId(), date).orElseThrow();
    }

    private String expiredJwt(AppUser user) {
        byte[] secret = io.jsonwebtoken.io.Decoders.BASE64.decode("MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=");
        java.util.Date now = new java.util.Date();
        return io.jsonwebtoken.Jwts.builder().subject(user.getUsername())
                .claim("tv", user.getTokenVersion())
                .issuedAt(new java.util.Date(now.getTime() - 120_000))
                .expiration(new java.util.Date(now.getTime() - 60_000))
                .signWith(io.jsonwebtoken.security.Keys.hmacShaKeyFor(secret)).compact();
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class TestAiConfiguration {
        @Bean
        @Primary
        GeminiService mockGeminiService(org.springframework.web.client.RestClient.Builder builder,
                                        ObjectMapper mapper, FitnessKnowledgeService knowledge,
                                        @Value("${app.gemini.api-key}") String key,
                                        @Value("${app.gemini.base-url:https://generativelanguage.googleapis.com/v1beta}") String baseUrl,
                                        @Value("${app.gemini.model:gemini-2.5-flash}") String model,
                                        @Value("${app.gemini.fallback-model:gemini-2.5-flash-lite}") String fallback,
                                        @Value("${app.gemini.timeout-ms:1000}") long timeout) {
            return new GeminiService(builder, mapper, knowledge, key, baseUrl, model, fallback, timeout) {
                @Override
                public String nutritionText(String email, String prompt, AiLiveContextService.LiveContext live) {
                    return "Test Gemini response";
                }
            };
        }
    }
}
