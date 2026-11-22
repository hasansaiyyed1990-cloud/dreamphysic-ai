package com.fitforge.nutrition;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity @Table(name="meal_entries",indexes={@Index(name="idx_meal_owner_date",columnList="user_email,meal_date"),@Index(name="idx_meal_owner_type",columnList="user_email,meal_type")})
public class MealEntry {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="user_email",nullable=false,length=190) private String userEmail;
    @Column(nullable=false,length=180) private String name;
    @Column(nullable=false) private int calories;
    @Column(nullable=false) private double proteinG,carbsG,fatG;
    private Double fiberG;
    @Column(name="meal_type",length=40) private String mealType;
    @Column(name="meal_date",nullable=false) private LocalDate mealDate;
    protected MealEntry(){}
    public MealEntry(String email,NutritionDtos.MealInput i){userEmail=email;name=i.name();calories=i.calories();proteinG=i.proteinG();carbsG=i.carbsG();fatG=i.fatG();fiberG=i.fiberG();mealType=i.mealType();mealDate=i.mealDate()==null?LocalDate.now():i.mealDate();}
    public Long getId(){return id;} public String getName(){return name;} public int getCalories(){return calories;} public double getProteinG(){return proteinG;} public double getCarbsG(){return carbsG;} public double getFatG(){return fatG;} public Double getFiberG(){return fiberG;} public String getMealType(){return mealType;} public LocalDate getMealDate(){return mealDate;}
}
