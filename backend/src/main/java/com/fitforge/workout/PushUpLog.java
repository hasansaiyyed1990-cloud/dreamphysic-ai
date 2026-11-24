package com.fitforge.workout;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name="push_up_logs",indexes=@Index(name="idx_pushup_owner_date",columnList="user_email,performed_at"))
public class PushUpLog {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="user_email",nullable=false,length=190) private String userEmail;
    @Column(nullable=false) private int repetitions;
    @Column(length=60) private String variation;
    @Column(name="duration_seconds",nullable=false) private int durationSeconds;
    @Column(name="performed_at",nullable=false) private LocalDateTime performedAt;
    @Column(columnDefinition="text") private String notes;
    protected PushUpLog(){}
    public PushUpLog(String email,WorkoutDtos.PushUpInput i){userEmail=email;repetitions=i.repetitions();variation=i.variation();durationSeconds=i.durationSeconds();performedAt=i.performedAt()==null?LocalDateTime.now():i.performedAt();notes=i.notes();}
    public Long getId(){return id;}public int getRepetitions(){return repetitions;}public String getVariation(){return variation;}public int getDurationSeconds(){return durationSeconds;}public LocalDateTime getPerformedAt(){return performedAt;}public String getNotes(){return notes;}
}
