package com.fitforge.auth;

import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity @Table(name = "users", indexes = @Index(name = "idx_fitforge_user_email", columnList = "email", unique = true))
public class AppUser implements UserDetails {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 120) private String name;
    @Column(nullable = false, unique = true, length = 190) private String email;
    @Column(name = "password", nullable = false, length = 100) private String passwordHash;
    @Column(nullable = false) private int targetCalories = 1800;
    @Column(name = "token_version", nullable = false) private int tokenVersion = 0;
    @Column(nullable = false, updatable = false) private LocalDateTime createdAt = LocalDateTime.now();

    // Optional metabolic profile; all nullable so existing accounts stay valid.
    @Column(name = "height_cm") private Double heightCm;
    @Column(name = "age_years") private Integer ageYears;
    @Column(length = 20) private String gender;
    @Column(name = "activity_level", length = 30) private String activityLevel;
    @Column(name = "primary_goal", length = 40) private String primaryGoal;
    @Column(name = "secondary_goal", length = 40) private String secondaryGoal;

    protected AppUser() {}
    public AppUser(String name, String email, String passwordHash) { this.name=name; this.email=email.toLowerCase(); this.passwordHash=passwordHash; }
    public Long getId(){return id;} public String getName(){return name;} public int getTargetCalories(){return targetCalories;}
    public Double getHeightCm(){return heightCm;} public Integer getAgeYears(){return ageYears;} public String getGender(){return gender;}
    public String getActivityLevel(){return activityLevel;} public String getPrimaryGoal(){return primaryGoal;} public String getSecondaryGoal(){return secondaryGoal;}
    public void setMetabolicProfile(Double heightCm,Integer ageYears,String gender,String activityLevel){
        this.heightCm=heightCm; this.ageYears=ageYears; this.gender=gender; this.activityLevel=activityLevel;
    }
    public void setGoals(String primaryGoal,String secondaryGoal){this.primaryGoal=primaryGoal; this.secondaryGoal=secondaryGoal;}
    public int getTokenVersion(){return tokenVersion;}
    public void incrementTokenVersion(){this.tokenVersion++;}
    public void setPasswordHash(String passwordHash){this.passwordHash=passwordHash;}
    @Override public Collection<? extends GrantedAuthority> getAuthorities(){return List.of(new SimpleGrantedAuthority("ROLE_USER"));}
    @Override public String getPassword(){return passwordHash;} @Override public String getUsername(){return email;}
    @Override public boolean isAccountNonExpired(){return true;} @Override public boolean isAccountNonLocked(){return true;}
    @Override public boolean isCredentialsNonExpired(){return true;} @Override public boolean isEnabled(){return true;}
}
