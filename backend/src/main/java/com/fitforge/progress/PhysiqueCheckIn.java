package com.fitforge.progress;

import jakarta.persistence.*;
import java.time.LocalDate;
@Entity @Table(name="physique_check_ins",indexes=@Index(name="idx_physique_owner_date",columnList="user_email,checkin_date"))
public class PhysiqueCheckIn {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="user_email",nullable=false,length=190) private String userEmail;
    @Column(name="checkin_date",nullable=false) private LocalDate date;
    private Double weightKg;private Double waistCm;
    @Column(columnDefinition="text") private String photoUrl;
    @Column(columnDefinition="text") private String notes;
    protected PhysiqueCheckIn(){}
    public PhysiqueCheckIn(String email,ProgressDtos.PhysiqueInput i){userEmail=email;date=i.date();weightKg=i.weightKg();waistCm=i.waistCm();photoUrl=i.photoUrl();notes=i.notes();}
    public Long getId(){return id;}public LocalDate getDate(){return date;}public Double getWeightKg(){return weightKg;}public Double getWaistCm(){return waistCm;}public String getPhotoUrl(){return photoUrl;}public String getNotes(){return notes;}
}
