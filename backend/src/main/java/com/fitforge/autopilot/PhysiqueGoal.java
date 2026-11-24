package com.fitforge.autopilot;
import jakarta.persistence.*;
import java.time.*;
@Entity @Table(name="autopilot_physique_goals",indexes=@Index(name="idx_physique_goal_user",columnList="user_email,active"))
public class PhysiqueGoal {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="user_email",nullable=false,length=190) private String userEmail;
 @Column(nullable=false,length=60) private String focus;
 @Column(nullable=false,length=500) private String goal;
 @Column(length=80) private String measurement;
 private Double baseline; private Double target;
 @Column(name="linked_exercises",length=1000) private String linkedExercises;
 @Column(name="next_steps",length=2000) private String nextSteps;
 @Column(nullable=false) private boolean active=true;
 @Column(name="created_at",nullable=false) private LocalDateTime createdAt=LocalDateTime.now();
 protected PhysiqueGoal(){}
 public PhysiqueGoal(String email,AutopilotDtos.PhysiqueGoalInput i){userEmail=email;update(i);}
 public void update(AutopilotDtos.PhysiqueGoalInput i){focus=i.focus();goal=i.goal();measurement=i.measurement();baseline=i.baseline();target=i.target();linkedExercises=i.linkedExercises();nextSteps=i.nextSteps();active=i.active()==null||i.active();}
 public Long getId(){return id;} public String getUserEmail(){return userEmail;} public String getFocus(){return focus;} public String getGoal(){return goal;} public String getMeasurement(){return measurement;} public Double getBaseline(){return baseline;} public Double getTarget(){return target;} public String getLinkedExercises(){return linkedExercises;} public String getNextSteps(){return nextSteps;} public boolean isActive(){return active;} public LocalDateTime getCreatedAt(){return createdAt;}
}
