package com.fitforge.workout;

import jakarta.persistence.*;

@Entity @Table(name="exercise_library",indexes={@Index(name="idx_exercise_name",columnList="name"),@Index(name="idx_exercise_muscle",columnList="muscle_group")})
public class ExerciseLibraryItem {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false,unique=true,length=160) private String name;
    @Column(name="muscle_group",nullable=false,length=80) private String muscleGroup;
    @Column(length=120) private String equipment;
    @Column(length=1200) private String setup;
    @Column(length=1200) private String brace;
    @Column(length=2000) private String execution;
    @Column(name="common_mistakes",length=1600) private String commonMistakes;
    protected ExerciseLibraryItem(){}
    public ExerciseLibraryItem(WorkoutDtos.ExerciseGuideInput i){name=i.name();muscleGroup=i.muscleGroup();equipment=i.equipment();setup=i.setup();brace=i.brace();execution=i.execution();commonMistakes=i.commonMistakes();}
    public Long getId(){return id;}public String getName(){return name;}public String getMuscleGroup(){return muscleGroup;}public String getEquipment(){return equipment;}public String getSetup(){return setup;}public String getBrace(){return brace;}public String getExecution(){return execution;}public String getCommonMistakes(){return commonMistakes;}
}
