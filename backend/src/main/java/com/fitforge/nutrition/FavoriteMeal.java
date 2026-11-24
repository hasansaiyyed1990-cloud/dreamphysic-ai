package com.fitforge.nutrition;

import jakarta.persistence.*;

@Entity @Table(name="favorite_meals",uniqueConstraints=@UniqueConstraint(name="uk_favorite_owner_name",columnNames={"user_email","name"}),indexes=@Index(name="idx_favorite_owner",columnList="user_email"))
public class FavoriteMeal {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="user_email",nullable=false,length=190) private String userEmail;
    @Column(name="user_id") private Long userId;
    @Column(nullable=false,length=180) private String name; @Column(nullable=false) private int calories;
    @Column(nullable=false) private double proteinG,carbsG,fatG; private Double fiberG;
    @Column(name="meal_type",length=40) private String mealType;
    @Column(name="items_json",columnDefinition="text") private String itemsJson;
    protected FavoriteMeal(){}
    public FavoriteMeal(String email,NutritionDtos.MealInput i){userEmail=email;name=i.name();calories=i.calories();proteinG=i.proteinG();carbsG=i.carbsG();fatG=i.fatG();fiberG=i.fiberG();mealType=i.mealType();}
    public FavoriteMeal(String email,Long userId,String name,String itemsJson,int calories,double proteinG,double carbsG,double fatG,double fiberG,String mealType){this.userEmail=email;this.userId=userId;this.name=name;this.itemsJson=itemsJson;this.calories=calories;this.proteinG=proteinG;this.carbsG=carbsG;this.fatG=fatG;this.fiberG=fiberG;this.mealType=mealType;}
    public Long getId(){return id;} public Long getUserId(){return userId;} public String getItemsJson(){return itemsJson;} public String getName(){return name;} public int getCalories(){return calories;} public double getProteinG(){return proteinG;} public double getCarbsG(){return carbsG;} public double getFatG(){return fatG;} public Double getFiberG(){return fiberG;} public String getMealType(){return mealType;}
}
