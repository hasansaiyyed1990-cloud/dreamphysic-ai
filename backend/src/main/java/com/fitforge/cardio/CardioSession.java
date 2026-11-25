package com.fitforge.cardio;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Entity @Table(name="cardio_sessions",indexes={@Index(name="idx_cardio_owner_date",columnList="user_email,session_date"),@Index(name="idx_cardio_owner_type",columnList="user_email,activity")},uniqueConstraints=@UniqueConstraint(name="uk_cardio_external_source",columnNames={"user_email","source","external_activity_id"}))
public class CardioSession {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="user_email",nullable=false,length=190) private String userEmail;
    @Column(nullable=false,length=30) private String activity;
    @Column(nullable=false,precision=10,scale=2) private BigDecimal distanceKm;
    @Column(nullable=false) private int durationMinutes;
    @Column(nullable=false,precision=10,scale=2) private BigDecimal paceMinPerKm;
    private Integer caloriesBurned; private Boolean caloriesEstimated=false; private Integer staminaScore;
    @Column(name="session_date",nullable=false) private LocalDateTime sessionDate;
    @Column(columnDefinition="text") private String notes;
    @Column(length=30) private String source="MANUAL";
    @Column(name="external_activity_id",length=180) private String externalActivityId;
    @Column(name="average_heart_rate") private Integer averageHeartRate;
    @Column(name="maximum_heart_rate") private Integer maximumHeartRate;
    @Column(name="elevation_gain_m") private Double elevationGainM;
    private Integer cadence;
    @Column(name="route_polyline",columnDefinition="text") private String routePolyline;
    @Column(name="lap_splits_json",columnDefinition="text") private String lapSplitsJson;

    protected CardioSession(){}

    public CardioSession(String email,CardioDtos.Create c){
        userEmail=email;
        activity=c.activity()==null?"RUNNING":c.activity().trim().toUpperCase();
        distanceKm=decimal(c.distanceKm()==null?0:c.distanceKm());
        durationMinutes=c.durationMinutes()==null?0:c.durationMinutes();
        paceMinPerKm=safePace(distanceKm.doubleValue(),durationMinutes);
        caloriesBurned=c.caloriesBurned();
        staminaScore=c.staminaScore();
        sessionDate=c.sessionDate()==null?LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")):c.sessionDate();
        notes=c.notes();
        source=c.source()==null?"MANUAL":c.source().trim().toUpperCase();
        externalActivityId=c.externalActivityId();
        averageHeartRate=c.averageHeartRate();
        maximumHeartRate=c.maximumHeartRate();
        elevationGainM=c.elevationGainM();
        cadence=c.cadence();
        routePolyline=c.routePolyline();
        lapSplitsJson=c.lapSplitsJson();
    }

    private static BigDecimal decimal(double value){return BigDecimal.valueOf(value).setScale(2,RoundingMode.HALF_UP);}

    /** Pace is undefined for a zero-distance session; return 0 instead of dividing by zero. */
    public static BigDecimal safePace(double distanceKm,int durationMinutes){
        if(distanceKm<=0||durationMinutes<=0)return BigDecimal.ZERO.setScale(2,RoundingMode.HALF_UP);
        return BigDecimal.valueOf(durationMinutes/distanceKm).setScale(2,RoundingMode.HALF_UP);
    }

    public void setCaloriesBurned(Integer value){caloriesBurned=value;} public void setCaloriesEstimated(boolean value){caloriesEstimated=value;}
    public Long getId(){return id;} public String getUserEmail(){return userEmail;} public String getActivity(){return activity;} public double getDistanceKm(){return distanceKm==null?0:distanceKm.doubleValue();} public int getDurationMinutes(){return durationMinutes;} public double getPaceMinPerKm(){return paceMinPerKm==null?0:paceMinPerKm.doubleValue();} public Integer getCaloriesBurned(){return caloriesBurned;} public Boolean getCaloriesEstimated(){return caloriesEstimated;} public Integer getStaminaScore(){return staminaScore;} public LocalDateTime getSessionDate(){return sessionDate;} public String getNotes(){return notes;} public String getSource(){return source;} public String getExternalActivityId(){return externalActivityId;} public Integer getAverageHeartRate(){return averageHeartRate;} public Integer getMaximumHeartRate(){return maximumHeartRate;} public Double getElevationGainM(){return elevationGainM;} public Integer getCadence(){return cadence;} public String getRoutePolyline(){return routePolyline;} public String getLapSplitsJson(){return lapSplitsJson;}
}
