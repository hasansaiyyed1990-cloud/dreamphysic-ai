package com.fitforge.nutrition;

import jakarta.persistence.*;

@Entity @Table(name="favorite_meals",uniqueConstraints=@UniqueConstraint(name="uk_favorite_owner_name",columnNames={"user_email","name"}),indexes=@Index(name="idx_favorite_owner",columnList="user_email"))
public class FavoriteMeal {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="user_email",nullable=false,length=190) private String userEmail;
    @Column(nullable=false,length=180) private String name; @Column(nullable=false) private int calories;
    @Column(nullable=false) private double proteinG,carbsG,fatG; private Double fiberG;
    @Column(name="meal_type",length=40) private String mealType;
    protected FavoriteMeal(){}
    public FavoriteMeal(String email,NutritionDtos.MealInput i){userEmail=email;name=i.name();calories=i.calories();proteinG=i.proteinG();carbsG=i.carbsG();fatG=i.fatG();fiberG=i.fiberG();mealType=i.mealType();}
    public Long getId(){return id;} public String getName(){return name;} public int getCalories(){return calories;} public double getProteinG(){return proteinG;} public double getCarbsG(){return carbsG;} public double getFatG(){return fatG;} public Double getFiberG(){return fiberG;} public String getMealType(){return mealType;}
}
