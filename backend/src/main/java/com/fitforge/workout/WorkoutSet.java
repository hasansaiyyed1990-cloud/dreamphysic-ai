package com.fitforge.workout;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Entity @Table(name="workout_sets",indexes={@Index(name="idx_workout_set_owner_ex_date",columnList="user_email,exercise_name,workout_date"),@Index(name="idx_workout_set_session",columnList="session_id,set_number")})
public class WorkoutSet {
    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="session_id",nullable=false) private WorkoutSession session;
    @Column(name="user_email",nullable=false,length=190) private String userEmail;
    @Column(name="exercise_name",nullable=false,length=160) private String exerciseName;
    @Column(name="set_number",nullable=false) private int setNumber;
    @Column(nullable=false) private int reps;
    @Column(name="weight_kg",nullable=false,precision=10,scale=2) private BigDecimal weightKg;
    @Column(name="previous_weight_kg",precision=10,scale=2) private BigDecimal previousWeightKg;
    @Column(name="delta_kg",nullable=false,precision=10,scale=2) private BigDecimal deltaKg;
    @Column(name="rest_seconds",nullable=false) private int restSeconds;
    @Column(name="workout_date",nullable=false) private LocalDateTime workoutDate;
    @Column(name="tracking_type",length=24) private String trackingType;
    @Column(name="weight_mode",length=24) private String weightMode;
    @Column(name="muscle_group",length=80) private String muscleGroup;
    @Column(name="sub_muscle",length=100) private String subMuscle;
    @Column(length=120) private String equipment;
    @Column(name="set_type",length=24) private String setType;
    @Column(name="duration_seconds") private Integer durationSeconds;
    @Column(precision=4,scale=2) private BigDecimal rpe;
    private Integer rir;
    @Column(columnDefinition="text") private String notes;
    @Column(name="completed") private Boolean completed=Boolean.TRUE;

    protected WorkoutSet(){}

    public WorkoutSet(String email,WorkoutDtos.SetInput i,LocalDateTime date){
        userEmail=email;
        exerciseName=i.exerciseName();
        setNumber=i.setNumber();
        reps=i.reps();
        weightKg=decimal(i.weightKg());
        previousWeightKg=i.previousWeightKg()==null?null:decimal(i.previousWeightKg());
        deltaKg=previousWeightKg==null?ZERO:weightKg.subtract(previousWeightKg);
        restSeconds=i.restSeconds();
        workoutDate=date;
        trackingType=weightKg.signum()>0?"WEIGHT_REPS":(reps>0?"BODYWEIGHT_REPS":"OTHER");
        weightMode="TOTAL";
        muscleGroup=i.muscleGroup();subMuscle=i.subMuscle();equipment=i.equipment();
        setType=i.setType()==null||i.setType().isBlank()?"WORKING":i.setType();
        if(i.trackingType()!=null&&!i.trackingType().isBlank())trackingType=i.trackingType();
        if(i.weightMode()!=null&&!i.weightMode().isBlank())weightMode=i.weightMode();
        durationSeconds=i.durationSeconds();rpe=i.rpe()==null?null:decimal(i.rpe());rir=i.rir();notes=i.notes();completed=i.completed()==null||i.completed();
    }

    private static BigDecimal decimal(double value){
        return BigDecimal.valueOf(value).setScale(2,RoundingMode.HALF_UP);
    }

    public void setSession(WorkoutSession s){session=s;}
    public void update(WorkoutDtos.SetInput i){exerciseName=i.exerciseName();setNumber=i.setNumber();reps=i.reps();weightKg=decimal(i.weightKg());previousWeightKg=i.previousWeightKg()==null?null:decimal(i.previousWeightKg());deltaKg=previousWeightKg==null?ZERO:weightKg.subtract(previousWeightKg);restSeconds=i.restSeconds();muscleGroup=i.muscleGroup();subMuscle=i.subMuscle();equipment=i.equipment();setType=i.setType()==null||i.setType().isBlank()?setType:i.setType();if(i.trackingType()!=null)trackingType=i.trackingType();if(i.weightMode()!=null)weightMode=i.weightMode();durationSeconds=i.durationSeconds();rpe=i.rpe()==null?null:decimal(i.rpe());rir=i.rir();notes=i.notes();completed=i.completed()==null?completed:i.completed();}
    public Long getId(){return id;}
    public String getExerciseName(){return exerciseName;}
    public int getSetNumber(){return setNumber;}
    public int getReps(){return reps;}
    public double getWeightKg(){return weightKg==null?0:weightKg.doubleValue();}
    public Double getPreviousWeightKg(){return previousWeightKg==null?null:previousWeightKg.doubleValue();}
    public double getDeltaKg(){return deltaKg==null?0:deltaKg.doubleValue();}
    public int getRestSeconds(){return restSeconds;}
    public LocalDateTime getWorkoutDate(){return workoutDate;}
    public String getTrackingType(){return trackingType==null?"WEIGHT_REPS":trackingType;}
    public String getWeightMode(){return weightMode==null?"TOTAL":weightMode;}
    public String getMuscleGroup(){return muscleGroup;}public String getSubMuscle(){return subMuscle;}public String getEquipment(){return equipment;}public String getSetType(){return setType==null?"WORKING":setType;}public Integer getDurationSeconds(){return durationSeconds;}public Double getRpe(){return rpe==null?null:rpe.doubleValue();}public Integer getRir(){return rir;}public String getNotes(){return notes;}public boolean isCompleted(){return !Boolean.FALSE.equals(completed);}
}
