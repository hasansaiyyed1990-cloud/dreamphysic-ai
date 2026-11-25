package com.fitforge.cardio;

import com.fasterxml.jackson.databind.JsonNode;
import com.fitforge.ai.GeminiService;
import com.fitforge.progress.WeightRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;

@Service
public class CardioFeatureService {
    private final CardioRepository sessions;
    private final CardioCustomExerciseRepository exercises;
    private final CardioGoalRepository goals;
    private final WeightRepository weights;
    private final GeminiService gemini;

    public CardioFeatureService(CardioRepository sessions,CardioCustomExerciseRepository exercises,CardioGoalRepository goals,WeightRepository weights,GeminiService gemini){this.sessions=sessions;this.exercises=exercises;this.goals=goals;this.weights=weights;this.gemini=gemini;}

    public CardioDtos.Overview overview(String email){
        LocalDate today=LocalDate.now(ZoneId.of("Asia/Kolkata"));
        var day=sessions.findByUserEmailAndSessionDateBetweenOrderBySessionDateDesc(email,today.atStartOfDay(),today.plusDays(1).atStartOfDay());
        var week=sessions.findByUserEmailAndSessionDateBetweenOrderBySessionDateDesc(email,today.minusDays(6).atStartOfDay(),today.plusDays(1).atStartOfDay());
        return new CardioDtos.Overview(day.size(),round(day.stream().mapToDouble(CardioSession::getDistanceKm).sum()),day.stream().mapToInt(CardioSession::getDurationMinutes).sum(),day.stream().mapToLong(s->s.getCaloriesBurned()==null?0:s.getCaloriesBurned()).sum(),week.size(),round(week.stream().mapToDouble(CardioSession::getDistanceKm).sum()),day.isEmpty()?null:day.get(0).getStaminaScore(),sessions.findByUserEmailOrderBySessionDateDesc(email,org.springframework.data.domain.PageRequest.of(0,20)).stream().map(this::dto).toList(),goals.findByUserEmailOrderByGoalNameAsc(email).stream().map(g->new CardioDtos.Goal(g.getId(),g.getGoalName(),g.getTargetDistanceKm(),g.getTargetPaceMinPerKm(),g.getTargetTimeSeconds(),g.getOriginalDeadline(),g.getRevisedDeadline(),0,0,0,false,false,0,0,0,"Build gradually; easy effort and recovery matter.",List.of())).toList(),"Cardio calorie values are estimates, not exact measurements. Avoid counting activity twice in your daily energy budget.");
    }

    public List<CardioDtos.CustomExercise> exercises(String email){return exercises.findByUserEmailAndDeletedFalseOrderByNameAsc(email).stream().map(this::dto).toList();}
    @Transactional public CardioDtos.CustomExercise createExercise(String email,CardioDtos.CustomExerciseInput input){validate(input);return dto(exercises.save(new CardioCustomExercise(email,input)));}
    @Transactional public CardioDtos.CustomExercise updateExercise(String email,long id,CardioDtos.CustomExerciseInput input){validate(input);var exercise=exercises.findByIdAndUserEmailAndDeletedFalse(id,email).orElseThrow(()->new IllegalArgumentException("Exercise not found"));exercise.update(input);return dto(exercise);}
    @Transactional public void deleteExercise(String email,long id){exercises.findByIdAndUserEmailAndDeletedFalse(id,email).orElseThrow(()->new IllegalArgumentException("Exercise not found")).softDelete();}
    private void validate(CardioDtos.CustomExerciseInput input){if(!Set.of("RUNNING","SWIMMING","CYCLING","HIIT","BODYWEIGHT","INDOOR_OTHER").contains(input.category().trim().toUpperCase(Locale.ROOT)))throw new IllegalArgumentException("Unsupported cardio exercise category");if(!Set.of("DISTANCE_TIME","DURATION_ONLY","REPS_ROUNDS").contains(input.trackingMode().trim().toUpperCase(Locale.ROOT)))throw new IllegalArgumentException("Unsupported tracking mode");String intensity=input.intensity().trim().toUpperCase(Locale.ROOT);if(!Set.of("LOW","MODERATE","HIGH","VIGOROUS").contains(intensity))throw new IllegalArgumentException("Intensity must be Low, Moderate, High, or Vigorous");if(input.metValue()!=null&&(input.metValue()<1||input.metValue()>25))throw new IllegalArgumentException("MET value must be between 1 and 25");}

    public CardioDtos.ScreenshotImport scanScreenshot(String email,byte[] bytes,String mime){
        if(bytes==null||bytes.length==0||bytes.length>10*1024*1024)throw new IllegalArgumentException("Choose an image smaller than 10 MB");
        String verified=verifiedImageMime(bytes);if(verified==null||!verified.equals(mime))throw new IllegalArgumentException("Only valid JPEG, PNG, or WebP images are accepted");
        JsonNode result=gemini.scanCardioScreenshot(bytes,verified);
        boolean valid=result.path("isCardioScreenshot").asBoolean(false);String confidence=result.path("confidence").asText("low").toLowerCase(Locale.ROOT);
        LocalDate date=null;try{if(result.hasNonNull("sessionDate"))date=LocalDate.parse(result.path("sessionDate").asText());}catch(Exception ignored){}
        Integer duration=integer(result,"durationSeconds"),calories=integer(result,"caloriesBurned"),pace=integer(result,"avgPaceSecPerKm"),hr=integer(result,"avgHeartRate");Double distance=decimal(result,"distanceKm");
        boolean estimated=false;String warning="Check every extracted value before saving.";
        if((calories==null||calories<=0)&&duration!=null&&duration>0){var weight=weights.findTopByUserEmailOrderByDateDesc(email);if(weight.isPresent()){double met=metFor(result.path("activityType").asText("OTHER"));calories=(int)Math.round(met*weight.get().getWeightKg()*(duration/3600.0));estimated=true;warning="Calories are estimated from your latest logged body weight and activity MET; edit before saving.";}else warning="No body weight is logged, so calories are not estimated. Add weight or enter calories manually.";}
        String rawActivity=result.path("activityType").asText("OTHER").toUpperCase(Locale.ROOT).replace(' ','_');String activity=Set.of("RUNNING","SWIMMING","CYCLING","HIIT","WALKING","INDOOR_JOGGING","BODYWEIGHT","CUSTOM").contains(rawActivity)?rawActivity:"CUSTOM";
        return new CardioDtos.ScreenshotImport(valid,confidence,result.path("sourceApp").asText("Unknown"),activity,date,duration,distance,pace,calories,hr, result.path("notes").asText(""),estimated,valid&&Set.of("high","medium").contains(confidence)?warning:"Screenshot was not confidently recognized. Upload a clearer workout summary.");
    }
    @Transactional public CardioDtos.Session confirmScreenshot(String email,CardioDtos.ScreenshotImport data){
        if(!data.isCardioScreenshot()||!Set.of("high","medium").contains(data.confidence().toLowerCase(Locale.ROOT)))throw new IllegalArgumentException("Only a confidently recognized cardio screenshot can be saved");
        if(data.durationSeconds()==null||data.durationSeconds()<1||data.durationSeconds()>86400)throw new IllegalArgumentException("Enter a valid workout duration");
        double distance=data.distanceKm()==null?0:data.distanceKm();if(distance<0||distance>1000)throw new IllegalArgumentException("Enter a valid distance");
        if(data.sessionDate()==null)throw new IllegalArgumentException("Add the workout date before saving");
        LocalDateTime startedAt=data.sessionDate().atStartOfDay();var existing=sessions.findByUserEmailAndSessionDateBetweenOrderBySessionDateDesc(email,startedAt.minusDays(1),startedAt.plusDays(2));
        for(var old:existing){if(!old.getActivity().equalsIgnoreCase(data.activityType()))continue;boolean distanceNear=distance==0||old.getDistanceKm()==0||Math.abs(old.getDistanceKm()-distance)/Math.max(old.getDistanceKm(),distance)<=.05;double minutes=data.durationSeconds()/60.0;boolean timeNear=Math.abs(old.getDurationMinutes()-minutes)/Math.max(old.getDurationMinutes(),minutes)<=.05;if(distanceNear&&timeNear)throw new IllegalArgumentException("A similar workout is already logged for this date");}
        var input=new CardioDtos.Create(distance,(int)Math.max(1,Math.round(data.durationSeconds()/60.0)),data.caloriesBurned(),null,startedAt,data.activityType(),data.notes(),"SCREENSHOT_IMPORT",null,data.avgHeartRate(),null,null,null,null,null);
        CardioSession entity=new CardioSession(email,input);entity.setCaloriesEstimated(data.caloriesEstimated());return dto(sessions.save(entity));
    }
    private String verifiedImageMime(byte[] b){if(b.length>=3&&(b[0]&255)==255&&(b[1]&255)==216&&(b[2]&255)==255)return "image/jpeg";if(b.length>=8&&(b[0]&255)==137&&b[1]==80&&b[2]==78&&b[3]==71&&b[4]==13&&b[5]==10&&b[6]==26&&b[7]==10)return "image/png";if(b.length>=12&&b[0]==82&&b[1]==73&&b[2]==70&&b[3]==70&&b[8]==87&&b[9]==69&&b[10]==66&&b[11]==80)return "image/webp";return null;}
    private Integer integer(JsonNode n,String key){return n.hasNonNull(key)&&n.path(key).canConvertToInt()?n.path(key).asInt():null;}
    private Double decimal(JsonNode n,String key){return n.hasNonNull(key)&&n.path(key).isNumber()?n.path(key).asDouble():null;}
    private double metFor(String activity){return switch(activity.toUpperCase(Locale.ROOT)){case "RUNNING"->8.3;case "INDOOR_JOGGING"->7.0;case "CYCLING"->6.8;case "SWIMMING"->7.0;case "HIIT","BODYWEIGHT"->7.8;case "WALKING"->4.3;default->5.0;};}
    private double round(double n){return Math.round(n*100.0)/100.0;}
    private CardioDtos.CustomExercise dto(CardioCustomExercise e){return new CardioDtos.CustomExercise(e.getId(),e.getName(),e.getCategory(),e.getTrackingMode(),e.getIntensity(),e.getMetValue(),e.getTargetMuscles(),e.getNotes(),e.isLowImpact());}
    private CardioDtos.Session dto(CardioSession e){return new CardioDtos.Session(e.getId(),e.getActivity(),e.getDistanceKm(),e.getDurationMinutes(),e.getPaceMinPerKm(),e.getCaloriesBurned(),e.getCaloriesEstimated(),e.getStaminaScore(),e.getSessionDate(),e.getNotes(),e.getSource(),e.getExternalActivityId(),e.getAverageHeartRate(),e.getMaximumHeartRate(),e.getElevationGainM(),e.getCadence(),e.getRoutePolyline(),e.getLapSplitsJson());}
}
