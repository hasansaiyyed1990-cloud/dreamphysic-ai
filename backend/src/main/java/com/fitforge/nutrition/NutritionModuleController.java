package com.fitforge.nutrition;

import com.fitforge.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate; import java.util.List;

@RestController @RequestMapping("/api/nutrition")
public class NutritionModuleController {
 private final NutritionModuleService service;
 private final com.fitforge.common.IdempotencyGuard idempotency;
 public NutritionModuleController(NutritionModuleService service, com.fitforge.common.IdempotencyGuard idempotency){this.service=service;this.idempotency=idempotency;}
 @GetMapping("/foods") public ApiResponse<List<NutritionModuleDtos.Food>> foods(Authentication a,@RequestParam(defaultValue="") String search,@RequestParam(defaultValue="true") boolean includeCustom){return ApiResponse.ok(service.foods(a.getName(),search,includeCustom));}
 @PostMapping("/foods/custom") public ApiResponse<NutritionModuleDtos.Food> customFood(Authentication a,@Valid @RequestBody NutritionModuleDtos.CustomFoodInput i){return ApiResponse.ok("Custom food saved",service.customFood(a.getName(),i));}
 @GetMapping("/diary/{date}") public ApiResponse<NutritionModuleDtos.DiaryDay> day(Authentication a,@PathVariable LocalDate date){return ApiResponse.ok(service.day(a.getName(),date));}
 @PostMapping("/diary") public ApiResponse<NutritionModuleDtos.Diary> add(Authentication a,@Valid @RequestBody NutritionModuleDtos.DiaryInput i){idempotency.check(a.getName(),"diary-create",i);return ApiResponse.ok("Diary entry saved",service.addDiary(a.getName(),i));}
 @PutMapping("/diary/{id}") public ApiResponse<NutritionModuleDtos.Diary> update(Authentication a,@PathVariable Long id,@Valid @RequestBody NutritionModuleDtos.DiaryInput i){return ApiResponse.ok("Diary entry updated",service.updateDiary(a.getName(),id,i));}
 @DeleteMapping("/diary/{id}") public ApiResponse<Void> delete(Authentication a,@PathVariable Long id){service.deleteDiary(a.getName(),id);return ApiResponse.ok("Diary entry deleted",null);}
 @GetMapping("/favorites") public ApiResponse<List<NutritionModuleDtos.Favorite>> favorites(Authentication a){return ApiResponse.ok(service.favorites(a.getName()));}
 @PostMapping("/favorites") public ApiResponse<NutritionModuleDtos.Favorite> favorite(Authentication a,@Valid @RequestBody NutritionModuleDtos.FavoriteInput i){return ApiResponse.ok("Favorite saved",service.addFavorite(a.getName(),i));}
 @PostMapping("/favorites/{id}/log") public ApiResponse<NutritionModuleDtos.DiaryDay> logFavorite(Authentication a,@PathVariable Long id,@RequestParam(defaultValue="") String date,@RequestParam(defaultValue="SNACKS") String mealCategory){return ApiResponse.ok("Favorite logged",service.logFavorite(a.getName(),id,date.isBlank()?LocalDate.now():LocalDate.parse(date),mealCategory));}
 @DeleteMapping("/favorites/{id}") public ApiResponse<Void> deleteFavorite(Authentication a,@PathVariable Long id){service.deleteFavorite(a.getName(),id);return ApiResponse.ok("Favorite deleted",null);}
 @GetMapping("/mission") public ApiResponse<NutritionModuleDtos.Mission> mission(Authentication a,@RequestParam(required=false) LocalDate date){return ApiResponse.ok(service.mission(a.getName(),date==null?LocalDate.now():date));}
 @PostMapping("/mission") public ApiResponse<NutritionModuleDtos.Mission> mission(Authentication a,@Valid @RequestBody NutritionModuleDtos.MissionInput i,@RequestParam(required=false) LocalDate date){return ApiResponse.ok("Mission saved",service.saveMission(a.getName(),i,date==null?LocalDate.now():date));}
 @GetMapping("/analytics") public ApiResponse<NutritionModuleDtos.Analytics> analytics(Authentication a,@RequestParam(defaultValue="7") int days,@RequestParam(required=false) LocalDate startDate,@RequestParam(required=false) LocalDate endDate){return ApiResponse.ok(service.analytics(a.getName(),days,startDate,endDate));}
 @GetMapping("/categories") public ApiResponse<List<NutritionModuleDtos.MealCategory>> categories(Authentication a){return ApiResponse.ok(service.categories(a.getName()));}
 @PostMapping("/categories") public ApiResponse<NutritionModuleDtos.MealCategory> addCategory(Authentication a,@Valid @RequestBody NutritionModuleDtos.MealCategoryInput i){return ApiResponse.ok("Meal category added",service.addCategory(a.getName(),i));}
 @PutMapping("/categories/{id}") public ApiResponse<NutritionModuleDtos.MealCategory> updateCategory(Authentication a,@PathVariable Long id,@Valid @RequestBody NutritionModuleDtos.MealCategoryInput i){return ApiResponse.ok("Meal category updated",service.updateCategory(a.getName(),id,i));}
 @PostMapping("/categories/reorder") public ApiResponse<Void> reorder(Authentication a,@Valid @RequestBody NutritionModuleDtos.CategoryReorderInput i){service.reorderCategories(a.getName(),i);return ApiResponse.ok("Meal categories reordered",null);}
 @DeleteMapping("/categories/{id}") public ApiResponse<Void> deleteCategory(Authentication a,@PathVariable Long id,@RequestParam(required=false) Long moveTo){service.deleteCategory(a.getName(),id,moveTo);return ApiResponse.ok("Meal category deleted",null);}
 @GetMapping("/targets") public ApiResponse<NutritionModuleDtos.Targets> targets(Authentication a){return ApiResponse.ok(service.targets(a.getName()));}
 @PutMapping("/targets") public ApiResponse<NutritionModuleDtos.Targets> saveTargets(Authentication a,@Valid @RequestBody NutritionModuleDtos.TargetsInput i){return ApiResponse.ok("Nutrition targets saved",service.saveTargets(a.getName(),i));}
 @GetMapping("/micros/{date}") public ApiResponse<List<NutritionModuleDtos.Micronutrient>> micros(Authentication a,@PathVariable LocalDate date){return ApiResponse.ok(service.micronutrients(a.getName(),date));}
 @PostMapping("/diary/copy-meal") public ApiResponse<NutritionModuleDtos.DiaryDay> copyMeal(Authentication a,@Valid @RequestBody NutritionModuleDtos.CopyMealInput i){return ApiResponse.ok("Meal copied",service.copyMeal(a.getName(),i));}
 @PostMapping("/diary/copy-day") public ApiResponse<NutritionModuleDtos.DiaryDay> copyDay(Authentication a,@Valid @RequestBody NutritionModuleDtos.CopyDayInput i){return ApiResponse.ok("Day copied",service.copyDay(a.getName(),i));}
 @GetMapping("/hydration/{date}") public ApiResponse<NutritionModuleDtos.Hydration> hydration(Authentication a,@PathVariable LocalDate date){return ApiResponse.ok(service.hydration(a.getName(),date));}
 @PostMapping("/hydration/{date}") public ApiResponse<NutritionModuleDtos.Hydration> hydration(Authentication a,@PathVariable LocalDate date,@Valid @RequestBody NutritionModuleDtos.HydrationInput i){return ApiResponse.ok("Hydration saved",service.saveHydration(a.getName(),date,i));}
 @GetMapping("/grocery") public ApiResponse<NutritionModuleDtos.Grocery> grocery(Authentication a){return ApiResponse.ok(service.grocery(a.getName()));}
 @PutMapping("/grocery") public ApiResponse<NutritionModuleDtos.Grocery> grocery(Authentication a,@Valid @RequestBody NutritionModuleDtos.GroceryInput i){return ApiResponse.ok("Grocery list saved",service.putGrocery(a.getName(),i));}
 @GetMapping("/reminders") public ApiResponse<NutritionModuleDtos.Reminders> reminders(Authentication a){return ApiResponse.ok(service.reminders(a.getName()));}
 @PutMapping("/reminders") public ApiResponse<NutritionModuleDtos.Reminders> reminders(Authentication a,@RequestBody NutritionModuleDtos.ReminderInput i){return ApiResponse.ok("Reminder preferences saved",service.putReminders(a.getName(),i));}
 @GetMapping("/backlog") public ApiResponse<NutritionModuleDtos.BacklogReview> backlog(Authentication a){return ApiResponse.ok(service.backlog(a.getName()));}
 @PostMapping("/backlog") public ApiResponse<NutritionModuleDtos.CalorieBalance> backlogDay(Authentication a,@Valid @RequestBody NutritionModuleDtos.CalorieBalanceInput i){return ApiResponse.ok("Daily calorie balance recorded",service.recordBalance(a.getName(),i));}
 @PostMapping("/backlog/review") public ApiResponse<NutritionModuleDtos.BacklogReview> backlogReview(Authentication a){return ApiResponse.ok("Weekly backlog review completed",service.reviewBacklog(a.getName()));}
}
