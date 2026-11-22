package com.fitforge.timetable;

import jakarta.persistence.*;
import java.time.DayOfWeek;

@Entity @Table(name="weekly_plan_days",uniqueConstraints=@UniqueConstraint(name="uk_weekly_plan_user_day",columnNames={"user_email","day_of_week"}),indexes=@Index(name="idx_weekly_plan_user",columnList="user_email"))
public class WeeklyPlanDay {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="user_email",nullable=false,length=190) private String userEmail;
    @Enumerated(EnumType.STRING) @Column(name="day_of_week",nullable=false,length=10) private DayOfWeek dayOfWeek;
    @Column(nullable=false,length=100) private String focus;
    @Column(length=2000) private String plan;
    @Column(nullable=false) private boolean express20;
    protected WeeklyPlanDay(){}
    public WeeklyPlanDay(String email,DayOfWeek day,String focus,String plan,boolean express){this.userEmail=email;this.dayOfWeek=day;this.focus=focus;this.plan=plan;this.express20=express;}
    public DayOfWeek getDayOfWeek(){return dayOfWeek;} public String getFocus(){return focus;} public String getPlan(){return plan;} public boolean isExpress20(){return express20;} public void setFocus(String v){focus=v;} public void setPlan(String v){plan=v;} public void setExpress20(boolean v){express20=v;}
}
