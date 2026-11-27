package com.fitforge.workout;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity @Table(name="workout_sessions",indexes=@Index(name="idx_workout_owner_date",columnList="user_email,session_date"))
public class WorkoutSession {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="user_email",nullable=false,length=190) private String userEmail;
    @Column(nullable=false,length=120) private String name;
    @Column(name="session_date",nullable=false) private LocalDateTime sessionDate;
    @OneToMany(mappedBy="session",cascade=CascadeType.ALL,orphanRemoval=true) @OrderBy("setNumber ASC") private List<WorkoutSet> sets=new ArrayList<>();
    protected WorkoutSession(){}
    public WorkoutSession(String email,WorkoutDtos.SessionInput i){userEmail=email;name=i.name();sessionDate=i.sessionDate()==null?LocalDateTime.now():i.sessionDate();}
    public void addSet(WorkoutSet s){sets.add(s);s.setSession(this);}
    public void update(WorkoutDtos.SessionUpdate i){name=i.name().trim();if(i.sessionDate()!=null)sessionDate=i.sessionDate();}
    public Long getId(){return id;}public String getUserEmail(){return userEmail;}public String getName(){return name;}public LocalDateTime getSessionDate(){return sessionDate;}public List<WorkoutSet> getSets(){return sets;}
}
