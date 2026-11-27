package com.fitforge.workout;

import com.fitforge.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.fitforge.ai.FitnessKnowledgeService;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
import java.time.LocalDate;

@RestController @RequestMapping("/api/workouts") public class WorkoutController {
    private final WorkoutService service;private final FitnessKnowledgeService fitnessKnowledge;private final com.fitforge.common.IdempotencyGuard idempotency;
    public WorkoutController(WorkoutService service,FitnessKnowledgeService fitnessKnowledge,com.fitforge.common.IdempotencyGuard idempotency){this.service=service;this.fitnessKnowledge=fitnessKnowledge;this.idempotency=idempotency;}
    @GetMapping("/library") public ApiResponse<List<WorkoutDtos.ExerciseGuide>> library(@RequestParam(defaultValue="") String muscle,@RequestParam(defaultValue="") String search,@RequestParam(defaultValue="") String equipment){return ApiResponse.ok(service.library(muscle,search,equipment));}
    @GetMapping("/programs") public ApiResponse<List<JsonNode>> programs(){return ApiResponse.ok(fitnessKnowledge.programs());}
    @PostMapping("/library") public ApiResponse<WorkoutDtos.ExerciseGuide> addGuide(@Valid @RequestBody WorkoutDtos.ExerciseGuideInput i){return ApiResponse.ok(service.addGuide(i));}
    @GetMapping public ApiResponse<List<WorkoutDtos.Session>> sessions(Authentication a,@RequestParam(required=false) Integer page,@RequestParam(required=false) Integer size){return ApiResponse.ok(service.sessions(a.getName(),page,size));}
    @GetMapping("/history") public ApiResponse<List<WorkoutDtos.Session>> history(Authentication a,@RequestParam(required=false) LocalDate from,@RequestParam(required=false) LocalDate to,@RequestParam(defaultValue="") String muscle,@RequestParam(defaultValue="") String subMuscle,@RequestParam(defaultValue="") String equipment,@RequestParam(defaultValue="") String exercise){return ApiResponse.ok(service.history(a.getName(),from,to,muscle,subMuscle,equipment,exercise));}
    @GetMapping("/history/analytics") public ApiResponse<WorkoutDtos.HistoryAnalytics> historyAnalytics(Authentication a,@RequestParam(required=false) LocalDate from,@RequestParam(required=false) LocalDate to){return ApiResponse.ok(service.historyAnalytics(a.getName(),from,to));}
    @GetMapping("/custom-exercises") public ApiResponse<List<WorkoutDtos.CustomExercise>> customExercises(Authentication a){return ApiResponse.ok(service.customExercises(a.getName()));}
    @PostMapping("/custom-exercises") public ApiResponse<WorkoutDtos.CustomExercise> addCustomExercise(Authentication a,@Valid @RequestBody WorkoutDtos.CustomExerciseInput input){return ApiResponse.ok("Exercise saved",service.saveCustomExercise(a.getName(),input));}
    @PutMapping("/custom-exercises/{id}") public ApiResponse<WorkoutDtos.CustomExercise> updateCustomExercise(Authentication a,@PathVariable Long id,@Valid @RequestBody WorkoutDtos.CustomExerciseInput input){return ApiResponse.ok("Exercise updated",service.updateCustomExercise(a.getName(),id,input));}
    @PostMapping("/custom-exercises/{id}/duplicate") public ApiResponse<WorkoutDtos.CustomExercise> duplicateCustomExercise(Authentication a,@PathVariable Long id){return ApiResponse.ok("Exercise duplicated",service.duplicateCustomExercise(a.getName(),id));}
    @DeleteMapping("/custom-exercises/{id}") public ApiResponse<Void> deleteCustomExercise(Authentication a,@PathVariable Long id){service.deleteCustomExercise(a.getName(),id);return ApiResponse.ok("Exercise deleted from library; history retained",null);}
    @GetMapping("/routines") public ApiResponse<List<WorkoutDtos.Routine>> routines(Authentication a){return ApiResponse.ok(service.routines(a.getName()));}
    @PostMapping("/routines") public ApiResponse<WorkoutDtos.Routine> addRoutine(Authentication a,@Valid @RequestBody WorkoutDtos.RoutineInput input){return ApiResponse.ok("Routine saved",service.saveRoutine(a.getName(),input));}
    @PutMapping("/routines/{id}") public ApiResponse<WorkoutDtos.Routine> updateRoutine(Authentication a,@PathVariable Long id,@Valid @RequestBody WorkoutDtos.RoutineInput input){return ApiResponse.ok("Routine updated",service.updateRoutine(a.getName(),id,input));}
    @PostMapping("/routines/{id}/duplicate") public ApiResponse<WorkoutDtos.Routine> duplicateRoutine(Authentication a,@PathVariable Long id){return ApiResponse.ok("Routine duplicated",service.duplicateRoutine(a.getName(),id));}
    @DeleteMapping("/routines/{id}") public ApiResponse<Void> deleteRoutine(Authentication a,@PathVariable Long id){service.deleteRoutine(a.getName(),id);return ApiResponse.ok("Routine deleted",null);}
    @PostMapping public ApiResponse<WorkoutDtos.Session> create(Authentication a,@Valid @RequestBody WorkoutDtos.SessionInput i){idempotency.check(a.getName(),"workout-create",i);return ApiResponse.ok("Workout started",service.create(a.getName(),i));}
    @GetMapping("/{id}") public ApiResponse<WorkoutDtos.Session> get(Authentication a,@PathVariable Long id){return ApiResponse.ok(service.session(a.getName(),id));}
    @PutMapping("/{id}") public ApiResponse<WorkoutDtos.Session> update(Authentication a,@PathVariable Long id,@Valid @RequestBody WorkoutDtos.SessionUpdate input){return ApiResponse.ok("Workout updated",service.updateSession(a.getName(),id,input));}
    @PostMapping("/{id}/duplicate") public ApiResponse<WorkoutDtos.Session> duplicate(Authentication a,@PathVariable Long id){return ApiResponse.ok("Workout duplicated",service.duplicateSession(a.getName(),id));}
    @DeleteMapping("/{id}") public ApiResponse<Void> delete(Authentication a,@PathVariable Long id){service.deleteSession(a.getName(),id);return ApiResponse.ok("Workout deleted",null);}
    @PostMapping("/{id}/sets") public ApiResponse<WorkoutDtos.SetEntry> set(Authentication a,@PathVariable Long id,@Valid @RequestBody WorkoutDtos.SetInput i){idempotency.check(a.getName(),"workout-set:"+id,i);return ApiResponse.ok("Set logged",service.addSet(a.getName(),id,i));}
    @DeleteMapping("/sets/{setId}") public ApiResponse<Void> deleteSet(Authentication a,@PathVariable Long setId){service.deleteSet(a.getName(),setId);return ApiResponse.ok("Set removed",null);}
    @PutMapping("/sets/{setId}") public ApiResponse<WorkoutDtos.SetEntry> updateSet(Authentication a,@PathVariable Long setId,@Valid @RequestBody WorkoutDtos.SetInput input){return ApiResponse.ok("Set updated",service.updateSet(a.getName(),setId,input));}
    @GetMapping("/last-session/sets") public ApiResponse<List<WorkoutDtos.SetEntry>> last(Authentication a,@RequestParam String exerciseName,@RequestParam(required=false) String equipment){return ApiResponse.ok(service.lastSets(a.getName(),exerciseName,equipment));}
    @PostMapping("/{id}/repeat-last") public ApiResponse<WorkoutDtos.RepeatResult> repeat(Authentication a,@PathVariable Long id,@RequestParam String exerciseName){return ApiResponse.ok("Previous sets copied",service.repeat(a.getName(),id,exerciseName));}
    @PostMapping("/pushups") public ApiResponse<WorkoutDtos.PushUp> pushup(Authentication a,@Valid @RequestBody WorkoutDtos.PushUpInput i){return ApiResponse.ok("Push-up challenge logged",service.addPushUp(a.getName(),i));}
    @GetMapping("/pushups") public ApiResponse<List<WorkoutDtos.PushUp>> pushups(Authentication a){return ApiResponse.ok(service.pushups(a.getName()));}
    @GetMapping("/goals") public ApiResponse<List<WorkoutDtos.ExerciseProgress>> goals(Authentication a){return ApiResponse.ok(service.goals(a.getName()));}
    @GetMapping("/records") public ApiResponse<List<WorkoutDtos.PersonalRecord>> records(Authentication a){return ApiResponse.ok(service.prs(a.getName()));}
    @PutMapping("/goals") public ApiResponse<WorkoutDtos.ExerciseProgress> goal(Authentication a,@Valid @RequestBody WorkoutDtos.ExerciseGoalInput i){return ApiResponse.ok("Exercise target saved",service.putGoal(a.getName(),i));}
    @DeleteMapping("/goals/{exerciseName}") public ApiResponse<Void> deleteGoal(Authentication a,@PathVariable String exerciseName){service.deleteGoal(a.getName(),exerciseName);return ApiResponse.ok("Exercise target removed",null);}
}
