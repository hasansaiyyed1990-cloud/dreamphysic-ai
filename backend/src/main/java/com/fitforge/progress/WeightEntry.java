package com.fitforge.progress;

import jakarta.persistence.*;
import java.time.LocalDate;
@Entity @Table(name="weight_entries",uniqueConstraints=@UniqueConstraint(name="uk_weight_owner_date",columnNames={"user_email","entry_date"}),indexes=@Index(name="idx_weight_owner_date",columnList="user_email,entry_date"))
public class WeightEntry {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="user_email",nullable=false,length=190) private String userEmail;
    @Column(name="entry_date",nullable=false) private LocalDate date;
    @Column(name="weight_kg",nullable=false) private double weightKg;
    protected WeightEntry(){}
    public WeightEntry(String email,ProgressDtos.WeightInput i){userEmail=email;date=i.date();weightKg=i.weightKg();}
    public void setWeightKg(double value){weightKg=value;}
    public Long getId(){return id;}public LocalDate getDate(){return date;}public double getWeightKg(){return weightKg;}
}
