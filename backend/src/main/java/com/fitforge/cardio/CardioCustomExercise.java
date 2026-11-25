package com.fitforge.cardio;

import jakarta.persistence.*;

@Entity
@Table(name="cardio_custom_exercises", indexes={
        @Index(name="idx_cardio_custom_owner", columnList="user_email,is_deleted"),
        @Index(name="idx_cardio_custom_name", columnList="name")
})
public class CardioCustomExercise {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="user_email",nullable=false,length=190) private String userEmail;
    @Column(nullable=false,length=100) private String name;
    @Column(nullable=false,length=30) private String category;
    @Column(name="tracking_mode",nullable=false,length=30) private String trackingMode;
    @Column(nullable=false,length=20) private String intensity;
    @Column(nullable=false) private double metValue;
    @Column(name="target_muscles",length=300) private String targetMuscles;
    @Column(length=1000) private String notes;
    @Column(name="low_impact",nullable=false) private boolean lowImpact;
    @Column(name="is_deleted",nullable=false) private boolean deleted;

    protected CardioCustomExercise() {}
    public CardioCustomExercise(String email, CardioDtos.CustomExerciseInput input) { userEmail=email; update(input); }
    public void update(CardioDtos.CustomExerciseInput input) {
        name=input.name().trim(); category=input.category().trim().toUpperCase();
        trackingMode=input.trackingMode().trim().toUpperCase(); intensity=input.intensity().trim().toUpperCase();
        metValue=input.metValue()==null?switch(intensity){case "LOW"->3.0;case "MODERATE"->5.0;case "HIGH"->7.0;default->9.0;}:input.metValue();
        targetMuscles=input.targetMuscles(); notes=input.notes(); lowImpact=input.lowImpact(); deleted=false;
    }
    public void softDelete(){deleted=true;}
    public Long getId(){return id;} public String getUserEmail(){return userEmail;} public String getName(){return name;}
    public String getCategory(){return category;} public String getTrackingMode(){return trackingMode;} public String getIntensity(){return intensity;}
    public double getMetValue(){return metValue;} public String getTargetMuscles(){return targetMuscles;} public String getNotes(){return notes;}
    public boolean isLowImpact(){return lowImpact;} public boolean isDeleted(){return deleted;}
}
