package com.fitforge.autopilot;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name="autopilot_settings",uniqueConstraints=@UniqueConstraint(name="uk_autopilot_settings_user",columnNames="user_email"),indexes=@Index(name="idx_autopilot_settings_user",columnList="user_email"))
public class AutopilotSettings {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="user_email",nullable=false,length=190) private String userEmail;
    @Column(name="auto_plan_enabled",nullable=false) private boolean autoPlanEnabled=true;
    @Column(name="briefing_time",nullable=false,length=5) private String briefingTime="06:00";
    @Column(name="defaults_json",columnDefinition="text") private String defaultsJson="{}";
    @Column(name="updated_at",nullable=false) private LocalDateTime updatedAt=LocalDateTime.now();
    protected AutopilotSettings(){}
    public AutopilotSettings(String email){userEmail=email;}
    public void update(Boolean enabled,String time,String defaults){if(enabled!=null)autoPlanEnabled=enabled;if(time!=null)briefingTime=time;if(defaults!=null)defaultsJson=defaults;updatedAt=LocalDateTime.now();}
    public Long getId(){return id;} public String getUserEmail(){return userEmail;} public boolean isAutoPlanEnabled(){return autoPlanEnabled;} public String getBriefingTime(){return briefingTime;} public String getDefaultsJson(){return defaultsJson;}
}
