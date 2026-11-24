package com.fitforge.nutrition;
import jakarta.persistence.*; import java.time.LocalDate;
@Entity @Table(name="daily_calorie_balances",uniqueConstraints=@UniqueConstraint(name="uk_calorie_balance_user_date",columnNames={"user_id","entry_date"}),indexes=@Index(name="idx_calorie_balance_user_date",columnList="user_id,entry_date"))
public class DailyCalorieBalance {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id; @Column(name="user_id",nullable=false) private Long userId; @Column(name="entry_date",nullable=false) private LocalDate entryDate;
 @Column(nullable=false) private double estimatedTdee,consumedCalories,plannedDeficit,actualDeficit,pendingGapKcal;
 protected DailyCalorieBalance(){} public DailyCalorieBalance(Long userId,LocalDate date,double tdee,double consumed,double plan,double gap){this.userId=userId;this.entryDate=date;update(tdee,consumed,plan,gap);}
 public void update(double tdee,double consumed,double plan,double gap){estimatedTdee=tdee;consumedCalories=consumed;plannedDeficit=plan;actualDeficit=tdee-consumed;pendingGapKcal=gap;}
 public Long getId(){return id;} public Long getUserId(){return userId;} public LocalDate getEntryDate(){return entryDate;} public double getEstimatedTdee(){return estimatedTdee;} public double getConsumedCalories(){return consumedCalories;} public double getPlannedDeficit(){return plannedDeficit;} public double getActualDeficit(){return actualDeficit;} public double getPendingGapKcal(){return pendingGapKcal;}
}
