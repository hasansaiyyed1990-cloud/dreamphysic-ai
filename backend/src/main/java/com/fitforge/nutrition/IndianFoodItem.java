package com.fitforge.nutrition;

import jakarta.persistence.*;

@Entity @Table(name="indian_food_items", indexes={@Index(name="idx_food_global_name", columnList="user_id,name"), @Index(name="idx_food_name", columnList="name")})
public class IndianFoodItem {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="user_id") private Long userId;
    @Column(nullable=false,length=140) private String name;
    @Column(nullable=false) private double calories,proteinG,carbsG,fatG,fiberG;
    @Column(nullable=false,length=40) private String defaultUnit;
    @Column(nullable=false,length=20) private String preparationType;
    @Column(nullable=false) private boolean isCustom;
    @Column(nullable=false) private double servingGrams;
    protected IndianFoodItem(){}
    public IndianFoodItem(String name,double calories,double proteinG,double carbsG,double fatG,double fiberG,String unit,String preparation,double servingGrams,Long userId,boolean custom){this.name=name;this.calories=calories;this.proteinG=proteinG;this.carbsG=carbsG;this.fatG=fatG;this.fiberG=fiberG;this.defaultUnit=unit;this.preparationType=preparation;this.servingGrams=servingGrams;this.userId=userId;this.isCustom=custom;}
    public Long getId(){return id;} public Long getUserId(){return userId;} public String getName(){return name;} public double getCalories(){return calories;} public double getProteinG(){return proteinG;} public double getCarbsG(){return carbsG;} public double getFatG(){return fatG;} public double getFiberG(){return fiberG;} public String getDefaultUnit(){return defaultUnit;} public String getPreparationType(){return preparationType;} public boolean isCustom(){return isCustom;} public double getServingGrams(){return servingGrams;}
}
