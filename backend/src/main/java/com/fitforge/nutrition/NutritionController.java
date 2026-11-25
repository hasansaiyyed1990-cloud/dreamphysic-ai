package com.fitforge.nutrition;

import com.fitforge.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController @RequestMapping("/api/meals") public class NutritionController {
    private final NutritionService service;
    private final com.fitforge.common.IdempotencyGuard idempotency;
    public NutritionController(NutritionService service, com.fitforge.common.IdempotencyGuard idempotency){this.service=service;this.idempotency=idempotency;}
    @GetMapping public ApiResponse<List<NutritionDtos.Meal>> meals(Authentication a,@RequestParam(defaultValue="") String date){return ApiResponse.ok(service.meals(a.getName(),date.isBlank()?LocalDate.now():LocalDate.parse(date)));}
    @PostMapping public ApiResponse<NutritionDtos.Meal> add(Authentication a,@Valid @RequestBody NutritionDtos.MealInput i){idempotency.check(a.getName(),"meal-create",i);return ApiResponse.ok("Meal saved",service.add(a.getName(),i));}
    @DeleteMapping("/{id}") public ApiResponse<Void> delete(Authentication a,@PathVariable Long id){service.delete(a.getName(),id);return ApiResponse.ok("Meal deleted",null);}
    @GetMapping("/summary") public ApiResponse<NutritionDtos.Summary> summary(Authentication a,@RequestParam(defaultValue="") String date){return ApiResponse.ok(service.summary(a.getName(),date.isBlank()?LocalDate.now():LocalDate.parse(date)));}
    @GetMapping("/favorites") public ApiResponse<List<NutritionDtos.Favorite>> favorites(Authentication a){return ApiResponse.ok(service.favorites(a.getName()));}
    @PostMapping("/favorites") public ApiResponse<NutritionDtos.Favorite> favorite(Authentication a,@Valid @RequestBody NutritionDtos.MealInput i){return ApiResponse.ok(service.addFavorite(a.getName(),i));}
    @DeleteMapping("/favorites/{id}") public ApiResponse<Void> deleteFavorite(Authentication a,@PathVariable Long id){service.deleteFavorite(a.getName(),id);return ApiResponse.ok("Favorite deleted",null);}
    @PostMapping("/favorites/{id}/log") public ApiResponse<NutritionDtos.Meal> logFavorite(Authentication a,@PathVariable Long id,@RequestParam(required=false) LocalDate date){return ApiResponse.ok("Favorite meal logged",service.logFavorite(a.getName(),id,date==null?LocalDate.now():date));}
}
