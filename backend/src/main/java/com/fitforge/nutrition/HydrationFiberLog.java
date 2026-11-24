package com.fitforge.nutrition;
import jakarta.persistence.*; import java.time.LocalDate;
@Entity @Table(name="hydration_fiber_logs",uniqueConstraints=@UniqueConstraint(name="uk_hydration_user_date",columnNames={"user_id","log_date"}),indexes=@Index(name="idx_hydration_user_date",columnList="user_id,log_date"))
public class HydrationFiberLog {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id; @Column(name="user_id",nullable=false) private Long userId; @Column(name="log_date",nullable=false) private LocalDate logDate;
 @Column(nullable=false) private int waterMl,waterGoalMl; @Column(nullable=false) private double fiberTargetG;
 protected HydrationFiberLog(){} public HydrationFiberLog(Long userId,LocalDate date,NutritionModuleDtos.HydrationInput i){this.userId=userId;this.logDate=date;update(i);} public void update(NutritionModuleDtos.HydrationInput i){waterMl=i.waterMl();waterGoalMl=i.waterGoalMl()==null?2500:i.waterGoalMl();fiberTargetG=i.fiberTargetG()==null?25:i.fiberTargetG();}
 public Long getId(){return id;} public Long getUserId(){return userId;} public LocalDate getLogDate(){return logDate;} public int getWaterMl(){return waterMl;} public int getWaterGoalMl(){return waterGoalMl;} public double getFiberTargetG(){return fiberTargetG;}
}
