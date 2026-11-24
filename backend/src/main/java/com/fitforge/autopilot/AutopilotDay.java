package com.fitforge.autopilot;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name="autopilot_days", uniqueConstraints=@UniqueConstraint(name="uk_autopilot_user_date", columnNames={"user_email","plan_date"}), indexes=@Index(name="idx_autopilot_user_date", columnList="user_email,plan_date"))
public class AutopilotDay {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="user_email", nullable=false, length=190) private String userEmail;
    @Column(name="plan_date", nullable=false) private LocalDate planDate;
    @Column(name="plan_json", nullable=false, columnDefinition="text") private String planJson;
    protected AutopilotDay() {}
    public AutopilotDay(String email, LocalDate date, String json){userEmail=email;planDate=date;planJson=json;}
    public Long getId(){return id;} public String getUserEmail(){return userEmail;} public LocalDate getPlanDate(){return planDate;} public String getPlanJson(){return planJson;} public void setPlanJson(String json){planJson=json;}
}
