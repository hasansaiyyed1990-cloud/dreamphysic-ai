package com.fitforge.workout;

import jakarta.persistence.*;

@Entity
@Table(name="custom_workout_exercises", indexes={@Index(name="idx_custom_exercise_owner", columnList="user_email,is_deleted")})
public class CustomWorkoutExercise {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="user_email",nullable=false,length=190) private String userEmail;
    @Column(nullable=false,length=160) private String name;
    @Column(name="muscle_group",nullable=false,length=80) private String muscleGroup;
    @Column(name="sub_muscle",length=100) private String subMuscle;
    @Column(length=120) private String equipment;
    @Column(name="primary_muscles_json",columnDefinition="text") private String primaryMusclesJson;
    @Column(name="secondary_muscles_json",columnDefinition="text") private String secondaryMusclesJson;
    @Column(name="tracking_type",length=24) private String trackingType;
    @Column(columnDefinition="text") private String notes;
    @Column(name="is_deleted",nullable=false) private boolean deleted;
    protected CustomWorkoutExercise(){}
    public CustomWorkoutExercise(String owner,WorkoutDtos.CustomExerciseInput input,String primary,String secondary){userEmail=owner;update(input,primary,secondary);}
    public void update(WorkoutDtos.CustomExerciseInput input,String primary,String secondary){name=input.name().trim();muscleGroup=input.muscleGroup().trim();subMuscle=input.subMuscle();equipment=input.equipment();primaryMusclesJson=primary;secondaryMusclesJson=secondary;trackingType=input.trackingType();notes=input.notes();deleted=false;}
    public void softDelete(){deleted=true;}
    public Long getId(){return id;}public String getUserEmail(){return userEmail;}public String getName(){return name;}public String getMuscleGroup(){return muscleGroup;}public String getSubMuscle(){return subMuscle;}public String getEquipment(){return equipment;}public String getPrimaryMusclesJson(){return primaryMusclesJson;}public String getSecondaryMusclesJson(){return secondaryMusclesJson;}public String getTrackingType(){return trackingType;}public String getNotes(){return notes;}public boolean isDeleted(){return deleted;}
}
