package com.fitforge.workout;

import com.fitforge.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/workouts/sections") public class WorkoutSectionController {
    private final WorkoutSectionService service;
    public WorkoutSectionController(WorkoutSectionService service){this.service=service;}
    @GetMapping public ApiResponse<List<WorkoutDtos.SectionView>> list(Authentication a){return ApiResponse.ok(service.list(a.getName()));}
    @PostMapping public ApiResponse<WorkoutDtos.SectionView> create(Authentication a,@Valid @RequestBody WorkoutDtos.SectionInput i){return ApiResponse.ok("Section added",service.create(a.getName(),i));}
    @PutMapping("/{id}") public ApiResponse<WorkoutDtos.SectionView> rename(Authentication a,@PathVariable Long id,@Valid @RequestBody WorkoutDtos.SectionInput i){return ApiResponse.ok("Section renamed",service.rename(a.getName(),id,i));}
    @DeleteMapping("/{id}") public ApiResponse<Void> delete(Authentication a,@PathVariable Long id){service.delete(a.getName(),id);return ApiResponse.ok("Section deleted",null);}
    @PostMapping("/{id}/exercises") public ApiResponse<WorkoutDtos.SectionView> addExercise(Authentication a,@PathVariable Long id,@Valid @RequestBody WorkoutDtos.SectionExerciseInput i){return ApiResponse.ok("Exercise saved to section",service.addExercise(a.getName(),id,i));}
    @DeleteMapping("/{id}/exercises/{exerciseId}") public ApiResponse<WorkoutDtos.SectionView> removeExercise(Authentication a,@PathVariable Long id,@PathVariable Long exerciseId){return ApiResponse.ok("Exercise removed",service.removeExercise(a.getName(),id,exerciseId));}
}
