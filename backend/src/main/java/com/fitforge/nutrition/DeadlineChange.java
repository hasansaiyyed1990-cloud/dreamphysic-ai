package com.fitforge.nutrition;
import jakarta.persistence.*; import java.time.*;
@Entity @Table(name="mission_deadline_changes",indexes=@Index(name="idx_deadline_user_changed",columnList="user_id,changed_at"))
public class DeadlineChange {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id; @Column(name="user_id",nullable=false) private Long userId; @Column(name="original_deadline",nullable=false) private LocalDate originalDeadline; @Column(name="revised_deadline",nullable=false) private LocalDate revisedDeadline; @Column(name="changed_at",nullable=false) private LocalDateTime changedAt; @Column(nullable=false,length=500) private String notification; @Column(nullable=false) private double dailyDeficitTarget,weeklyDeficitTarget;
 protected DeadlineChange(){} public DeadlineChange(Long uid,LocalDate original,LocalDate revised,String notification,double daily,double weekly){userId=uid;originalDeadline=original;revisedDeadline=revised;changedAt=LocalDateTime.now();this.notification=notification;dailyDeficitTarget=daily;weeklyDeficitTarget=weekly;}
 public Long getId(){return id;}public Long getUserId(){return userId;}public LocalDate getOriginalDeadline(){return originalDeadline;}public LocalDate getRevisedDeadline(){return revisedDeadline;}public LocalDateTime getChangedAt(){return changedAt;}public String getNotification(){return notification;}public double getDailyDeficitTarget(){return dailyDeficitTarget;}public double getWeeklyDeficitTarget(){return weeklyDeficitTarget;}
}
