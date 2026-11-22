package com.fitforge.timetable;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity @Table(name="daily_check_ins",uniqueConstraints=@UniqueConstraint(name="uk_daily_checkin_user_date",columnNames={"user_email","checkin_date"}),indexes=@Index(name="idx_daily_checkin_user_date",columnList="user_email,checkin_date"))
public class DailyCheckIn {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="user_email",nullable=false,length=190) private String userEmail;
    @Column(name="checkin_date",nullable=false) private LocalDate date;
    @Column(nullable=false) private boolean creatineTaken;
    @Column(nullable=false) private boolean waterGoalMet;
    @Column(nullable=false) private int waterGlasses;
    @Column(nullable=false) private boolean workoutCompleted;
    protected DailyCheckIn(){}
    public DailyCheckIn(String email,LocalDate date){userEmail=email;this.date=date;}
    public LocalDate getDate(){return date;} public boolean isCreatineTaken(){return creatineTaken;} public boolean isWaterGoalMet(){return waterGoalMet;} public int getWaterGlasses(){return waterGlasses;} public boolean isWorkoutCompleted(){return workoutCompleted;}
    public void setCreatineTaken(boolean v){creatineTaken=v;} public void setWaterGoalMet(boolean v){waterGoalMet=v;} public void setWaterGlasses(int v){waterGlasses=v;} public void setWorkoutCompleted(boolean v){workoutCompleted=v;}
}
