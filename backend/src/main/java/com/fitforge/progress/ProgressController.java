package com.fitforge.progress;

import com.fitforge.common.ApiResponse;
import com.fitforge.workout.WorkoutDtos;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController @RequestMapping("/api/progress") public class ProgressController {
    private final ProgressService service;public ProgressController(ProgressService service){this.service=service;}
    @PostMapping("/weight") public ApiResponse<ProgressDtos.WeightEntry> addWeight(Authentication a,@Valid @RequestBody ProgressDtos.WeightInput i){return ApiResponse.ok("Weight logged",service.addWeight(a.getName(),i));}
    @GetMapping("/weight") public ApiResponse<List<ProgressDtos.WeightEntry>> weights(Authentication a,@RequestParam LocalDate from,@RequestParam LocalDate to,@RequestParam(required=false) Integer page,@RequestParam(required=false) Integer size){return ApiResponse.ok(service.weights(a.getName(),from,to,page,size));}
    @GetMapping("/weight/weekly") public ApiResponse<ProgressDtos.WeeklyWeight> weekly(Authentication a,@RequestParam(required=false) LocalDate weekStart){return ApiResponse.ok(service.weekly(a.getName(),weekStart==null?LocalDate.now():weekStart));}
    @PostMapping("/physique") public ApiResponse<ProgressDtos.PhysiqueCheckIn> addPhysique(Authentication a,@Valid @RequestBody ProgressDtos.PhysiqueInput i){return ApiResponse.ok("Physique check-in saved",service.addPhysique(a.getName(),i));}
    @GetMapping("/physique") public ApiResponse<List<ProgressDtos.PhysiqueCheckIn>> physique(Authentication a){return ApiResponse.ok(service.physique(a.getName()));}
    @GetMapping("/metabolic") public ApiResponse<ProgressDtos.Metabolic> metabolic(Authentication a){return ApiResponse.ok(service.metabolic(a.getName()));}
    @PutMapping("/metabolic") public ApiResponse<ProgressDtos.Metabolic> saveMetabolic(Authentication a,@Valid @RequestBody ProgressDtos.MetabolicInput i){return ApiResponse.ok("Metabolic profile saved",service.saveMetabolic(a.getName(),i));}
    @GetMapping("/streak") public ApiResponse<ProgressDtos.Streak> streak(Authentication a){return ApiResponse.ok(service.streak(a.getName()));}
    @GetMapping("/strength-prs") public ApiResponse<List<WorkoutDtos.PersonalRecord>> prs(Authentication a){return ApiResponse.ok(service.prs(a.getName()));}
    @GetMapping("/alerts") public ApiResponse<List<ProgressDtos.Alert>> alerts(Authentication a){return ApiResponse.ok(service.alerts(a.getName()));}
}
