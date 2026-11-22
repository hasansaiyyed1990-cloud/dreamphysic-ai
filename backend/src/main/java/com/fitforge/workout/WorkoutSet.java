package com.fitforge.workout;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name="workout_sets",indexes={@Index(name="idx_workout_set_owner_ex_date",columnList="user_email,exercise_name,workout_date"),@Index(name="idx_workout_set_session",columnList="session_id,set_number")})
public class WorkoutSet {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="session_id",nullable=false) private WorkoutSession session;
    @Column(name="user_email",nullable=false,length=190) private String userEmail;
    @Column(name="exercise_name",nullable=false,length=160) private String exerciseName;
    @Column(name="set_number",nullable=false) private int setNumber;
    @Column(nullable=false) private int reps;
    @Column(name="weight_kg",nullable=false) private double weightKg;
    @Column(name="previous_weight_kg") private Double previousWeightKg;
    @Column(name="delta_kg",nullable=false) private double deltaKg;
    @Column(name="rest_seconds",nullable=false) private int restSeconds;
    @Column(name="workout_date",nullable=false) private LocalDateTime workoutDate;
    protected WorkoutSet(){}
    public WorkoutSet(String email,WorkoutDtos.SetInput i,LocalDateTime date){userEmail=email;exerciseName=i.exerciseName();setNumber=i.setNumber();reps=i.reps();weightKg=i.weightKg();previousWeightKg=i.previousWeightKg();deltaKg=previousWeightKg==null?0:weightKg-previousWeightKg;restSeconds=i.restSeconds();workoutDate=date;}
    public void setSession(WorkoutSession s){session=s;}public Long getId(){return id;}public String getExerciseName(){return exerciseName;}public int getSetNumber(){return setNumber;}public int getReps(){return reps;}public double getWeightKg(){return weightKg;}public Double getPreviousWeightKg(){return previousWeightKg;}public double getDeltaKg(){return deltaKg;}public int getRestSeconds(){return restSeconds;}public LocalDateTime getWorkoutDate(){return workoutDate;}
}
