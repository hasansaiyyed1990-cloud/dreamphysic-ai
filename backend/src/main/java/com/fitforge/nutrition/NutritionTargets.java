package com.fitforge.nutrition;

import jakarta.persistence.*;

/** Per-user nutrition targets (macros, water, sodium/sugar limits and optional micronutrients). */
@Entity
@Table(name = "nutrition_targets")
public class NutritionTargets {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "user_id", nullable = false, unique = true) private Long userId;
    @Column(nullable = false) private double calories;
    @Column(nullable = false) private double proteinG;
    @Column(nullable = false) private double carbsG;
    @Column(nullable = false) private double fatG;
    @Column(nullable = false) private double fiberG;
    @Column(name = "water_ml", nullable = false) private double waterMl;
    @Column(name = "sodium_mg_max", nullable = false) private double sodiumMgMax;
    @Column(name = "sugar_g_max", nullable = false) private double sugarGMax;
    @Column(name = "micros_json", length = 4000) private String microsJson;

    protected NutritionTargets() {}

    public NutritionTargets(Long userId, NutritionModuleDtos.TargetsInput i, String microsJson) {
        this.userId = userId;
        this.microsJson = microsJson;
        apply(i);
    }

    public void apply(NutritionModuleDtos.TargetsInput i) {
        this.calories = i.calories();
        this.proteinG = i.proteinG();
        this.carbsG = i.carbsG();
        this.fatG = i.fatG();
        this.fiberG = i.fiberG();
        this.waterMl = i.waterMl();
        this.sodiumMgMax = i.sodiumMgMax();
        this.sugarGMax = i.sugarGMax();
    }

    public void setMicrosJson(String json) { this.microsJson = json; }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public double getCalories() { return calories; }
    public double getProteinG() { return proteinG; }
    public double getCarbsG() { return carbsG; }
    public double getFatG() { return fatG; }
    public double getFiberG() { return fiberG; }
    public double getWaterMl() { return waterMl; }
    public double getSodiumMgMax() { return sodiumMgMax; }
    public double getSugarGMax() { return sugarGMax; }
    public String getMicrosJson() { return microsJson; }
}
