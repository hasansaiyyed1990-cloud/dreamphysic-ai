package com.fitforge.workout;
import jakarta.persistence.*;
@Entity @Table(name="workout_routines",indexes=@Index(name="idx_workout_routine_owner",columnList="user_email,is_deleted"))
public class WorkoutRoutine {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="user_email",nullable=false,length=190) private String userEmail;
    @Column(nullable=false,length=120) private String name;
    @Column(length=80) private String split;
    @Column(name="home_workout",nullable=false) private boolean homeWorkout;
    @Column(name="exercises_json",nullable=false,columnDefinition="text") private String exercisesJson;
    @Column(name="is_deleted",nullable=false) private boolean deleted;
    protected WorkoutRoutine(){}
    public WorkoutRoutine(String owner,WorkoutDtos.RoutineInput i,String json){userEmail=owner;update(i,json);}
    public void update(WorkoutDtos.RoutineInput i,String json){name=i.name().trim();split=i.split();homeWorkout=i.homeWorkout();exercisesJson=json;deleted=false;}
    public void softDelete(){deleted=true;}
    public Long getId(){return id;}public String getUserEmail(){return userEmail;}public String getName(){return name;}public String getSplit(){return split;}public boolean isHomeWorkout(){return homeWorkout;}public String getExercisesJson(){return exercisesJson;}public boolean isDeleted(){return deleted;}
}
