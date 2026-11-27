package com.fitforge.workout;
import jakarta.persistence.*;
@Entity @Table(name="workout_sections",indexes=@Index(name="idx_workout_section_owner",columnList="user_email"))
public class WorkoutSection {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="user_email",nullable=false,length=190) private String userEmail;
 @Column(nullable=false,length=120) private String name;
 @Column(name="sort_order",nullable=false) private int sortOrder;
 protected WorkoutSection(){}
 public WorkoutSection(String email,String name,int sortOrder){userEmail=email;this.name=name.trim();this.sortOrder=sortOrder;}
 public void rename(String name){this.name=name.trim();}
 public Long getId(){return id;} public String getUserEmail(){return userEmail;} public String getName(){return name;} public int getSortOrder(){return sortOrder;}
}
