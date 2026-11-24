package com.fitforge.nutrition;
import jakarta.persistence.*; import java.time.LocalDate;
@Entity @Table(name="fat_loss_missions",uniqueConstraints=@UniqueConstraint(name="uk_mission_user",columnNames="user_id"),indexes=@Index(name="idx_mission_user",columnList="user_id"))
public class FatLossMission {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id; @Column(name="user_id",nullable=false) private Long userId;
 @Column(nullable=false) private double startWeightKg=90,targetWeightKg=87; @Column(nullable=false) private LocalDate startDate=LocalDate.now(),targetDate=LocalDate.now().plusDays(30);
 @Column(name="original_deadline") private LocalDate originalDeadline; @Column(name="revised_deadline") private LocalDate revisedDeadline;
 @Column(nullable=false) private int maintenanceCalories=1800,dailyCalorieBudget=1500;
 protected FatLossMission(){} public FatLossMission(Long userId,NutritionModuleDtos.MissionInput i){this.userId=userId;update(i);}
 public void update(NutritionModuleDtos.MissionInput i){startWeightKg=i.startWeightKg()==null?90:i.startWeightKg();targetWeightKg=i.targetWeightKg()==null?87:i.targetWeightKg();startDate=i.startDate()==null?LocalDate.now():i.startDate();targetDate=i.targetDate()==null?startDate.plusDays(30):i.targetDate();if(originalDeadline==null)originalDeadline=targetDate;if(revisedDeadline==null)revisedDeadline=targetDate;maintenanceCalories=i.maintenanceCalories()==null?1800:i.maintenanceCalories();dailyCalorieBudget=i.dailyCalorieBudget()==null?Math.max(1200,maintenanceCalories-300):i.dailyCalorieBudget();}
 public void reviseDeadline(LocalDate date){if(originalDeadline==null)originalDeadline=targetDate;if(revisedDeadline==null)revisedDeadline=targetDate;revisedDeadline=date;targetDate=date;}
 public Long getId(){return id;} public Long getUserId(){return userId;} public double getStartWeightKg(){return startWeightKg;} public double getTargetWeightKg(){return targetWeightKg;} public LocalDate getStartDate(){return startDate;} public LocalDate getTargetDate(){return targetDate;} public LocalDate getOriginalDeadline(){return originalDeadline==null?targetDate:originalDeadline;} public LocalDate getRevisedDeadline(){return revisedDeadline==null?targetDate:revisedDeadline;} public int getMaintenanceCalories(){return maintenanceCalories;} public int getDailyCalorieBudget(){return dailyCalorieBudget;}
}
