package com.fitforge.nutrition;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service public class NutritionService {
    private final MealRepository meals;private final FavoriteMealRepository favorites;
    public NutritionService(MealRepository meals,FavoriteMealRepository favorites){this.meals=meals;this.favorites=favorites;}
    public List<NutritionDtos.Meal> meals(String email,LocalDate date){return meals.findByUserEmailAndMealDateOrderByIdAsc(email,date).stream().map(e->meal(e,false)).toList();}
    @Transactional public NutritionDtos.Meal add(String email,NutritionDtos.MealInput i){return meal(meals.save(new MealEntry(email,i)),false);}
    @Transactional public void delete(String email,Long id){meals.delete(meals.findByIdAndUserEmail(id,email).orElseThrow(()->new IllegalArgumentException("Meal not found")));}
    public NutritionDtos.Summary summary(String email,LocalDate date){var list=meals.findByUserEmailAndMealDateOrderByIdAsc(email,date);int c=list.stream().mapToInt(MealEntry::getCalories).sum();return new NutritionDtos.Summary(date,1800,c,1800-c,list.stream().mapToDouble(MealEntry::getProteinG).sum(),list.stream().mapToDouble(MealEntry::getCarbsG).sum(),list.stream().mapToDouble(MealEntry::getFatG).sum(),list.size());}
    public List<NutritionDtos.Favorite> favorites(String email){return favorites.findByUserEmailOrderByNameAsc(email).stream().map(this::favorite).toList();}
    @Transactional public NutritionDtos.Favorite addFavorite(String email,NutritionDtos.MealInput i){return favorite(favorites.save(new FavoriteMeal(email,i)));}
    @Transactional public void deleteFavorite(String email,Long id){favorites.delete(favorites.findByIdAndUserEmail(id,email).orElseThrow(()->new IllegalArgumentException("Favorite meal not found")));}
    @Transactional public NutritionDtos.Meal logFavorite(String email,Long id,LocalDate date){var f=favorites.findByIdAndUserEmail(id,email).orElseThrow(()->new IllegalArgumentException("Favorite meal not found"));var i=new NutritionDtos.MealInput(f.getName(),f.getCalories(),f.getProteinG(),f.getCarbsG(),f.getFatG(),f.getFiberG(),f.getMealType(),date);return meal(meals.save(new MealEntry(email,i)),false);}
    private NutritionDtos.Meal meal(MealEntry e,boolean favorite){return new NutritionDtos.Meal(e.getId(),e.getName(),e.getCalories(),e.getProteinG(),e.getCarbsG(),e.getFatG(),e.getFiberG(),e.getMealType(),e.getMealDate(),favorite);}
    private NutritionDtos.Favorite favorite(FavoriteMeal e){return new NutritionDtos.Favorite(e.getId(),e.getName(),e.getCalories(),e.getProteinG(),e.getCarbsG(),e.getFatG(),e.getFiberG(),e.getMealType());}
}
