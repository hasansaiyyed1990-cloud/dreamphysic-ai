package com.fitforge.nutrition;

import jakarta.persistence.*;
import java.time.*;

@Entity @Table(name = "food_diary_entries", indexes = {@Index(name = "idx_food_diary_user_date", columnList = "user_id,entry_date"), @Index(name = "idx_food_diary_logged", columnList = "user_id,logged_at")})
public class FoodDiaryEntry {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @Column(name = "user_id", nullable = false) private Long userId;
 @Column(name = "entry_date", nullable = false) private LocalDate entryDate;
 @Column(name = "logged_at", nullable = false) private LocalDateTime loggedAt;
 @Column(name = "meal_category", nullable = false, length = 60) private String mealCategory;
 @Column(name = "food_name", nullable = false, length = 160) private String foodName;
 @Column(nullable = false) private double quantity;
 @Column(nullable = false, length = 40) private String unit;
 @Column(name = "preparation_type", nullable = false, length = 20) private String preparationType;
 @Column(nullable = false) private double calories, proteinG, carbsG, fatG, fiberG;
 @Column(name = "scan_confidence") private Double scanConfidence;
 /** Extra nutrients as JSON: sugar, satFat, sodium, calcium, iron, vitamins... (scaled per logged portion). */
 @Column(name = "micros_json", length = 4000) private String microsJson;

 protected FoodDiaryEntry() {}

 public FoodDiaryEntry(Long userId, NutritionModuleDtos.DiaryInput i, String microsJson) {
  this.userId = userId;
  this.entryDate = i.entryDate() == null ? LocalDate.now() : i.entryDate();
  this.loggedAt = LocalDateTime.now();
  this.mealCategory = i.mealCategory().trim();
  this.foodName = i.foodName();
  this.quantity = i.quantity();
  this.unit = i.unit();
  this.preparationType = i.preparationType() == null ? "COOKED" : i.preparationType().toUpperCase(java.util.Locale.ROOT);
  this.calories = i.calories();
  this.proteinG = i.proteinG();
  this.carbsG = i.carbsG();
  this.fatG = i.fatG();
  this.fiberG = i.fiberG() == null ? 0 : i.fiberG();
  this.scanConfidence = i.scanConfidence();
  this.microsJson = microsJson;
 }

 public void update(NutritionModuleDtos.DiaryInput i, String microsJson) {
  entryDate = i.entryDate() == null ? entryDate : i.entryDate();
  mealCategory = i.mealCategory().trim();
  foodName = i.foodName();
  quantity = i.quantity();
  unit = i.unit();
  preparationType = i.preparationType() == null ? preparationType : i.preparationType().toUpperCase(java.util.Locale.ROOT);
  calories = i.calories();
  proteinG = i.proteinG();
  carbsG = i.carbsG();
  fatG = i.fatG();
  fiberG = i.fiberG() == null ? 0 : i.fiberG();
  scanConfidence = i.scanConfidence();
  this.microsJson = microsJson;
 }

 /** Used when a meal category is deleted: entries move instead of being lost. */
 public void moveCategory(String category) { this.mealCategory = category; }

 public Long getId() { return id; }
 public Long getUserId() { return userId; }
 public LocalDate getEntryDate() { return entryDate; }
 public LocalDateTime getLoggedAt() { return loggedAt; }
 public String getMealCategory() { return mealCategory; }
 public String getFoodName() { return foodName; }
 public double getQuantity() { return quantity; }
 public String getUnit() { return unit; }
 public String getPreparationType() { return preparationType; }
 public double getCalories() { return calories; }
 public double getProteinG() { return proteinG; }
 public double getCarbsG() { return carbsG; }
 public double getFatG() { return fatG; }
 public double getFiberG() { return fiberG; }
 public Double getScanConfidence() { return scanConfidence; }
 public String getMicrosJson() { return microsJson; }
}
