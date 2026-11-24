package com.fitforge.nutrition;
import jakarta.persistence.*;
@Entity @Table(name="nutrition_reminder_prefs",uniqueConstraints=@UniqueConstraint(name="uk_reminder_user",columnNames="user_id"))
public class NutritionReminderPref {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id; @Column(name="user_id",nullable=false) private Long userId;
 @Column(name="meal_reminder_json",columnDefinition="text") private String mealReminderJson; @Column(name="protein_reminder_json",columnDefinition="text") private String proteinReminderJson; @Column(name="water_reminder_json",columnDefinition="text") private String waterReminderJson; @Column(name="weight_reminder_json",columnDefinition="text") private String weightReminderJson; @Column(name="eod_verdict_reminder_json",columnDefinition="text") private String eodVerdictReminderJson;
 protected NutritionReminderPref(){} public NutritionReminderPref(Long id){this.userId=id;}
 public void update(NutritionModuleDtos.ReminderInput i){mealReminderJson=i.mealReminderJson();proteinReminderJson=i.proteinReminderJson();waterReminderJson=i.waterReminderJson();weightReminderJson=i.weightReminderJson();eodVerdictReminderJson=i.eodVerdictReminderJson();}
 public Long getUserId(){return userId;} public String getMealReminderJson(){return mealReminderJson;} public String getProteinReminderJson(){return proteinReminderJson;} public String getWaterReminderJson(){return waterReminderJson;} public String getWeightReminderJson(){return weightReminderJson;} public String getEodVerdictReminderJson(){return eodVerdictReminderJson;}
}
