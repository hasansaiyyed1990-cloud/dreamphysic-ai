package com.fitforge.progress;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Entity @Table(name="weight_entries",uniqueConstraints=@UniqueConstraint(name="uk_weight_owner_date",columnNames={"user_email","entry_date"}),indexes=@Index(name="idx_weight_owner_date",columnList="user_email,entry_date"))
public class WeightEntry {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="user_email",nullable=false,length=190) private String userEmail;
    @Column(name="entry_date",nullable=false) private LocalDate date;
    @Column(name="weight_kg",nullable=false,precision=10,scale=2) private BigDecimal weightKg;

    protected WeightEntry(){}

    public WeightEntry(String email,ProgressDtos.WeightInput i){userEmail=email;date=i.date();weightKg=decimal(i.weightKg());}

    public void setWeightKg(double value){weightKg=decimal(value);}

    private static BigDecimal decimal(double value){return BigDecimal.valueOf(value).setScale(2,RoundingMode.HALF_UP);}

    public Long getId(){return id;}public LocalDate getDate(){return date;}public double getWeightKg(){return weightKg==null?0:weightKg.doubleValue();}
}
