package com.fitforge.autopilot;
import com.fitforge.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import com.fitforge.workout.WorkoutDtos;
@RestController @RequestMapping("/api/autopilot")
public class AutopilotController {
 private final AutopilotService service;
 private final com.fitforge.cardio.CardioAiQuota quota;
 private final com.fitforge.common.IdempotencyGuard idempotency;
 public AutopilotController(AutopilotService service, com.fitforge.cardio.CardioAiQuota quota, com.fitforge.common.IdempotencyGuard idempotency){this.service=service;this.quota=quota;this.idempotency=idempotency;}
 @GetMapping("/plan/today") public ApiResponse<AutopilotDtos.PlanSnapshot> planToday(Authentication a){return ApiResponse.ok(service.planSnapshot(a.getName()));}
 @PatchMapping("/plan/today") public ApiResponse<AutopilotDtos.PlanSnapshot> patchPlan(Authentication a,@Valid @RequestBody AutopilotDtos.PlanPatch p){return ApiResponse.ok("Plan updated",service.patchPlan(a.getName(),p));}
 @PutMapping("/defaults") public ApiResponse<AutopilotDtos.PlanSnapshot> defaults(Authentication a,@Valid @RequestBody AutopilotDtos.DefaultsUpdate d){return ApiResponse.ok("Autopilot preferences saved",service.updateDefaults(a.getName(),d));}
 @PostMapping("/plan/today/recalibrate-preview") public ApiResponse<AutopilotDtos.RecalibratePreview> recalibratePreview(Authentication a,@Valid @RequestBody AutopilotDtos.RecalibrateRequest r){return ApiResponse.ok(service.previewRecalibration(a.getName(),r));}
 @PostMapping("/plan/today/recalibrate-apply") public ApiResponse<AutopilotDtos.PlanSnapshot> recalibrateApply(Authentication a,@Valid @RequestBody AutopilotDtos.RecalibrateRequest r){return ApiResponse.ok("Plan recalibrated",service.applyRecalibration(a.getName(),r));}
 @PostMapping("/plan/today/reset") public ApiResponse<AutopilotDtos.PlanSnapshot> resetPlan(Authentication a){return ApiResponse.ok("Today's plan reset",service.resetToday(a.getName()));}
 @GetMapping("/today") public ApiResponse<AutopilotDtos.DailyPlan> today(Authentication a){return ApiResponse.ok(service.today(a.getName()));}
 @PutMapping("/today") public ApiResponse<AutopilotDtos.DailyPlan> save(Authentication a,@Valid @RequestBody AutopilotDtos.PlanUpdate p){return ApiResponse.ok("Daily plan saved",service.saveToday(a.getName(),p));}
 @PostMapping("/today/generate") public ApiResponse<AutopilotDtos.DailyPlan> generateToday(Authentication a){return ApiResponse.ok("Today's plan generated",service.generateToday(a.getName()));}
 @GetMapping("/briefing") public ApiResponse<String> briefing(Authentication a){quota.enforce(a.getName());return ApiResponse.ok("Daily briefing ready",service.briefing(a.getName()));}
 @PostMapping("/coach") public ApiResponse<String> coach(Authentication a,@Valid @RequestBody AutopilotDtos.CoachPrompt p){quota.enforce(a.getName());return ApiResponse.ok("Coach response ready",service.coach(a.getName(),p));}
 @PostMapping("/physique") public ApiResponse<String> physique(Authentication a,@Valid @RequestBody AutopilotDtos.PhysiqueGoal g){quota.enforce(a.getName());return ApiResponse.ok("Physique analysis ready",service.physique(a.getName(),g));}
 @PostMapping("/overload/predict") public ApiResponse<AutopilotDtos.OverloadPrediction> overload(Authentication a,@Valid @RequestBody AutopilotDtos.OverloadRequest r){return ApiResponse.ok(service.overload(a.getName(),r));}
 @GetMapping("/physique/goals") public ApiResponse<List<AutopilotDtos.PhysiqueGoalView>> physiqueGoals(Authentication a){return ApiResponse.ok(service.physiqueGoals(a.getName()));}
 @PostMapping("/physique/goals") public ApiResponse<AutopilotDtos.PhysiqueGoalView> savePhysiqueGoal(Authentication a,@Valid @RequestBody AutopilotDtos.PhysiqueGoalInput g){return ApiResponse.ok("Physique goal saved",service.savePhysiqueGoal(a.getName(),g));}
 @PutMapping("/physique/goals/{id}") public ApiResponse<AutopilotDtos.PhysiqueGoalView> updatePhysiqueGoal(Authentication a,@PathVariable Long id,@Valid @RequestBody AutopilotDtos.PhysiqueGoalInput g){return ApiResponse.ok("Physique goal updated",service.updatePhysiqueGoal(a.getName(),id,g));}
 @DeleteMapping("/physique/goals/{id}") public ApiResponse<Void> deletePhysiqueGoal(Authentication a,@PathVariable Long id){service.deletePhysiqueGoal(a.getName(),id);return ApiResponse.ok("Physique goal deleted",null);}
 @PostMapping("/recovery/evaluate") public ApiResponse<AutopilotDtos.RecoveryAssessment> recovery(Authentication a,@RequestBody AutopilotDtos.RecoveryInput i){return ApiResponse.ok(service.recovery(a.getName(),i));}
 @GetMapping("/recovery/backlog") public ApiResponse<AutopilotDtos.BacklogState> backlog(Authentication a){return ApiResponse.ok(service.backlog(a.getName()));}
 @PostMapping("/live/start") public ApiResponse<AutopilotDtos.LiveSession> startLive(Authentication a,@Valid @RequestBody AutopilotDtos.LiveStart i){idempotency.check(a.getName(),"live-start",i);return ApiResponse.ok("Live workout started",service.startLive(a.getName(),i));}
 @PostMapping("/live/{id}/sets") public ApiResponse<WorkoutDtos.SetEntry> logSet(Authentication a,@PathVariable Long id,@Valid @RequestBody WorkoutDtos.SetInput i){return ApiResponse.ok("Set logged",service.logLiveSet(a.getName(),id,i));}
 @PostMapping("/live/{id}/rest") public ApiResponse<AutopilotDtos.LiveSession> rest(Authentication a,@PathVariable Long id,@Valid @RequestBody AutopilotDtos.RestInput i){return ApiResponse.ok(service.startRest(a.getName(),id,i.restSeconds()));}
 @PostMapping("/live/{id}/swap") public ApiResponse<AutopilotDtos.LiveSession> swap(Authentication a,@PathVariable Long id,@Valid @RequestBody AutopilotDtos.SwapInput i){return ApiResponse.ok("Exercise swapped",service.swapExercise(a.getName(),id,i));}
 @PostMapping("/voice-intent") public ApiResponse<AutopilotDtos.VoiceIntent> voice(@Valid @RequestBody AutopilotDtos.VoiceCommand i){return ApiResponse.ok(service.voiceIntent(i));}
 @PostMapping("/missed-workout/reschedule") public ApiResponse<AutopilotDtos.Reschedule> reschedule(Authentication a,@Valid @RequestBody AutopilotDtos.MissedWorkout i){return ApiResponse.ok(service.reschedule(a.getName(),i));}
 @GetMapping("/live/{id}/next-set") public ApiResponse<AutopilotDtos.LiveFeedback> nextSetFeedback(Authentication a,@PathVariable Long id){return ApiResponse.ok(service.nextSetFeedback(a.getName(),id));}
 @GetMapping("/recovery") public ApiResponse<AutopilotDtos.BacklogState> recoveryState(Authentication a){return ApiResponse.ok(service.backlog(a.getName()));}
 @PostMapping("/recovery") public ApiResponse<AutopilotDtos.RecoveryAssessment> recoveryEvaluate(Authentication a,@RequestBody AutopilotDtos.RecoveryInput i){return ApiResponse.ok("Readiness evaluated",service.recovery(a.getName(),i));}
 @PostMapping("/weekly-review") public ApiResponse<AutopilotDtos.Review> review(Authentication a){quota.enforce(a.getName());return ApiResponse.ok("Weekly review generated",service.review(a.getName()));}
 @GetMapping("/proposals") public ApiResponse<List<AutopilotDtos.Proposal>> proposals(Authentication a){return ApiResponse.ok(service.listProposals(a.getName()));}
 @PostMapping("/proposals/{id}/decision") public ApiResponse<AutopilotDtos.Proposal> decide(Authentication a,@PathVariable Long id,@Valid @RequestBody AutopilotDtos.Decision d){return ApiResponse.ok("Proposal updated",service.decide(a.getName(),id,d));}
}
