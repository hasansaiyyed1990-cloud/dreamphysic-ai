package com.fitforge.cardio;

import com.fitforge.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.*;

@RestController
@RequestMapping("/api/cardio")
public class CardioFeatureController {
    private final CardioFeatureService service;
    private final CardioAiQuota quota;
    private final com.fitforge.common.IdempotencyGuard idempotency;
    public CardioFeatureController(CardioFeatureService service, CardioAiQuota quota, com.fitforge.common.IdempotencyGuard idempotency){this.service=service;this.quota=quota;this.idempotency=idempotency;}

    @GetMapping("/overview") public ApiResponse<CardioDtos.Overview> overview(Authentication auth){return ApiResponse.ok("Cardio overview",service.overview(auth.getName()));}
    @GetMapping("/library") public ApiResponse<List<Map<String,Object>>> library(@RequestParam(required=false) String search){
        List<Map<String,Object>> all=List.of(
                item("Running","RUNNING","DISTANCE_TIME",8.3,"Outdoor or treadmill running."),item("Swimming","SWIMMING","DISTANCE_TIME",7.0,"Pool or open water; enter distance and duration."),item("Cycling","CYCLING","DISTANCE_TIME",6.8,"Outdoor or stationary cycling."),item("Walking","WALKING","DISTANCE_TIME",4.3,"Comfortable or brisk walking."),item("Indoor jogging","INDOOR_JOGGING","DISTANCE_TIME",7.0,"Jog in place or on a treadmill; manual distance is optional."),item("HIIT circuit","HIIT","DURATION_ONLY",7.8,"Intervals with comfortable recovery."),item("Bodyweight cardio","BODYWEIGHT","DURATION_ONLY",5.0,"Bodyweight movement at a self-selected effort."),item("Custom cardio","CUSTOM","DURATION_ONLY",5.0,"A user-created activity."));
        String q=search==null?"":search.toLowerCase(Locale.ROOT);return ApiResponse.ok(all.stream().filter(x->q.isBlank()||x.get("name").toString().toLowerCase(Locale.ROOT).contains(q)).toList());
    }
    @GetMapping("/exercises/custom") public ApiResponse<List<CardioDtos.CustomExercise>> custom(Authentication a){return ApiResponse.ok(service.exercises(a.getName()));}
    @PostMapping("/exercises/custom") public ApiResponse<CardioDtos.CustomExercise> createCustom(Authentication a,@Valid @RequestBody CardioDtos.CustomExerciseInput i){return ApiResponse.ok("Custom exercise created",service.createExercise(a.getName(),i));}
    @PutMapping("/exercises/custom/{id}") public ApiResponse<CardioDtos.CustomExercise> updateCustom(Authentication a,@PathVariable long id,@Valid @RequestBody CardioDtos.CustomExerciseInput i){return ApiResponse.ok("Custom exercise updated",service.updateExercise(a.getName(),id,i));}
    @DeleteMapping("/exercises/custom/{id}") public ApiResponse<Void> deleteCustom(Authentication a,@PathVariable long id){service.deleteExercise(a.getName(),id);return ApiResponse.ok("Custom exercise archived",null);}

    @PostMapping(value="/import-screenshot",consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<CardioDtos.ScreenshotImport> scan(Authentication a,@RequestPart("image") MultipartFile file) throws IOException {
        quota.enforce(a.getName());
        byte[] bytes=file.getBytes();try{return ApiResponse.ok("Screenshot analyzed; review before saving",service.scanScreenshot(a.getName(),bytes,file.getContentType()));}finally{Arrays.fill(bytes,(byte)0);}
    }
    @PostMapping("/import-screenshot/confirm") public ApiResponse<CardioDtos.Session> confirm(Authentication a,@Valid @RequestBody CardioDtos.ScreenshotImport input){idempotency.check(a.getName(),"cardio-confirm",input);return ApiResponse.ok("Screenshot workout saved",service.confirmScreenshot(a.getName(),input));}

    private Map<String,Object> item(String name,String category,String mode,double met,String description){return Map.of("name",name,"category",category,"trackingMode",mode,"metValue",met,"description",description);}
}
