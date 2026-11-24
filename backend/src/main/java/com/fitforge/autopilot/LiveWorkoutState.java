package com.fitforge.autopilot;
import jakarta.persistence.*;
import java.time.*;
@Entity @Table(name="autopilot_live_workout_state",indexes=@Index(name="idx_live_state_user",columnList="user_email"))
public class LiveWorkoutState {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="user_email",nullable=false,length=190) private String userEmail;
 @Column(name="workout_session_id",nullable=false) private Long workoutSessionId;
 @Column(name="exercise_name",nullable=false,length=160) private String exerciseName;
 @Column(name="exercise_index",nullable=false) private int exerciseIndex;
 @Column(name="rest_until") private LocalDateTime restUntil;
 @Column(name="updated_at",nullable=false) private LocalDateTime updatedAt;
 protected LiveWorkoutState(){}
 public LiveWorkoutState(String email,Long session,String exercise){userEmail=email;workoutSessionId=session;exerciseName=exercise;updatedAt=LocalDateTime.now();}
 public void rest(int seconds){restUntil=LocalDateTime.now().plusSeconds(Math.max(0,seconds));updatedAt=LocalDateTime.now();}
 public void swap(String exercise){exerciseName=exercise;updatedAt=LocalDateTime.now();}
 public void next(String exercise){exerciseName=exercise;exerciseIndex++;updatedAt=LocalDateTime.now();}
 public Long getWorkoutSessionId(){return workoutSessionId;} public String getExerciseName(){return exerciseName;} public int getExerciseIndex(){return exerciseIndex;} public LocalDateTime getRestUntil(){return restUntil;} public String getUserEmail(){return userEmail;}
}
