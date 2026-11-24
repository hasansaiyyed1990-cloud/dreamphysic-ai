package com.fitforge.workout;

import com.fitforge.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.fitforge.ai.FitnessKnowledgeService;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;

@RestController @RequestMapping("/api/workouts") public class WorkoutController {
    private final WorkoutService service;private final FitnessKnowledgeService fitnessKnowledge;public WorkoutController(WorkoutService service,FitnessKnowledgeService fitnessKnowledge){this.service=service;this.fitnessKnowledge=fitnessKnowledge;}
    @GetMapping("/library") public ApiResponse<List<WorkoutDtos.ExerciseGuide>> library(@RequestParam(defaultValue="") String muscle,@RequestParam(defaultValue="") String search,@RequestParam(defaultValue="") String equipment){return ApiResponse.ok(service.library(muscle,search,equipment));}
    @GetMapping("/programs") public ApiResponse<List<JsonNode>> programs(){return ApiResponse.ok(fitnessKnowledge.programs());}
    @PostMapping("/library") public ApiResponse<WorkoutDtos.ExerciseGuide> addGuide(@Valid @RequestBody WorkoutDtos.ExerciseGuideInput i){return ApiResponse.ok(service.addGuide(i));}
    @GetMapping public ApiResponse<List<WorkoutDtos.Session>> sessions(Authentication a){return ApiResponse.ok(service.sessions(a.getName()));}
    @PostMapping public ApiResponse<WorkoutDtos.Session> create(Authentication a,@Valid @RequestBody WorkoutDtos.SessionInput i){return ApiResponse.ok("Workout started",service.create(a.getName(),i));}
    @GetMapping("/{id}") public ApiResponse<WorkoutDtos.Session> get(Authentication a,@PathVariable Long id){return ApiResponse.ok(service.session(a.getName(),id));}
    @PostMapping("/{id}/sets") public ApiResponse<WorkoutDtos.SetEntry> set(Authentication a,@PathVariable Long id,@Valid @RequestBody WorkoutDtos.SetInput i){return ApiResponse.ok("Set logged",service.addSet(a.getName(),id,i));}
    @GetMapping("/last-session/sets") public ApiResponse<List<WorkoutDtos.SetEntry>> last(Authentication a,@RequestParam String exerciseName){return ApiResponse.ok(service.lastSets(a.getName(),exerciseName));}
    @PostMapping("/{id}/repeat-last") public ApiResponse<WorkoutDtos.RepeatResult> repeat(Authentication a,@PathVariable Long id,@RequestParam String exerciseName){return ApiResponse.ok("Previous sets copied",service.repeat(a.getName(),id,exerciseName));}
    @PostMapping("/pushups") public ApiResponse<WorkoutDtos.PushUp> pushup(Authentication a,@Valid @RequestBody WorkoutDtos.PushUpInput i){return ApiResponse.ok("Push-up challenge logged",service.addPushUp(a.getName(),i));}
    @GetMapping("/pushups") public ApiResponse<List<WorkoutDtos.PushUp>> pushups(Authentication a){return ApiResponse.ok(service.pushups(a.getName()));}
    @GetMapping("/goals") public ApiResponse<List<WorkoutDtos.ExerciseProgress>> goals(Authentication a){return ApiResponse.ok(service.goals(a.getName()));}
    @PutMapping("/goals") public ApiResponse<WorkoutDtos.ExerciseProgress> goal(Authentication a,@Valid @RequestBody WorkoutDtos.ExerciseGoalInput i){return ApiResponse.ok("Exercise target saved",service.putGoal(a.getName(),i));}
}
