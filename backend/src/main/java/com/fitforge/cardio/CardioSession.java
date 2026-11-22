package com.fitforge.cardio;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name="cardio_sessions",indexes={@Index(name="idx_cardio_owner_date",columnList="user_email,session_date"),@Index(name="idx_cardio_owner_type",columnList="user_email,activity")})
public class CardioSession {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="user_email",nullable=false,length=190) private String userEmail;
    @Column(nullable=false,length=30) private String activity;
    @Column(nullable=false) private double distanceKm;
    @Column(nullable=false) private int durationMinutes;
    @Column(nullable=false) private double paceMinPerKm;
    private Integer caloriesBurned; private Integer staminaScore;
    @Column(name="session_date",nullable=false) private LocalDateTime sessionDate;
    @Column(length=1000) private String notes;
    protected CardioSession(){}
    public CardioSession(String email,CardioDtos.Create c){userEmail=email;activity=c.activity()==null?"RUNNING":c.activity().trim().toUpperCase();distanceKm=c.distanceKm();durationMinutes=c.durationMinutes();paceMinPerKm=(double)c.durationMinutes()/c.distanceKm();caloriesBurned=c.caloriesBurned();staminaScore=c.staminaScore();sessionDate=c.sessionDate()==null?LocalDateTime.now():c.sessionDate();notes=c.notes();}
    public Long getId(){return id;} public String getActivity(){return activity;} public double getDistanceKm(){return distanceKm;} public int getDurationMinutes(){return durationMinutes;} public double getPaceMinPerKm(){return paceMinPerKm;} public Integer getCaloriesBurned(){return caloriesBurned;} public Integer getStaminaScore(){return staminaScore;} public LocalDateTime getSessionDate(){return sessionDate;} public String getNotes(){return notes;}
}
