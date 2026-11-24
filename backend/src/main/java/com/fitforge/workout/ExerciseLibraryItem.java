package com.fitforge.workout;

import jakarta.persistence.*;

@Entity @Table(name="exercise_library",indexes={@Index(name="idx_exercise_name",columnList="name"),@Index(name="idx_exercise_muscle",columnList="muscle_group")})
public class ExerciseLibraryItem {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false,unique=true,length=160) private String name;
    @Column(name="muscle_group",nullable=false,length=80) private String muscleGroup;
    @Column(length=120) private String equipment;
    @Column(columnDefinition="text") private String setup;
    @Column(columnDefinition="text") private String brace;
    @Column(columnDefinition="text") private String execution;
    @Column(name="common_mistakes",columnDefinition="text") private String commonMistakes;
    @Column(name="primary_muscles_json",columnDefinition="text") private String primaryMusclesJson;
    @Column(name="secondary_muscles_json",columnDefinition="text") private String secondaryMusclesJson;
    @Column(length=40) private String level;
    @Column(name="instructions_json",columnDefinition="text") private String instructionsJson;
    @Column(name="image_urls_json",columnDefinition="text") private String imageUrlsJson;
    @Column(length=40) private String source;
    protected ExerciseLibraryItem(){}
    public ExerciseLibraryItem(WorkoutDtos.ExerciseGuideInput i){name=i.name();muscleGroup=i.muscleGroup();equipment=i.equipment();setup=i.setup();brace=i.brace();execution=i.execution();commonMistakes=i.commonMistakes();}
    public ExerciseLibraryItem(String name,String muscleGroup,String equipment,String setup,String brace,String execution,String mistakes,String primary,String secondary,String level,String instructions,String images,String source){this.name=name;this.muscleGroup=muscleGroup;this.equipment=equipment;this.setup=setup;this.brace=brace;this.execution=execution;this.commonMistakes=mistakes;this.primaryMusclesJson=primary;this.secondaryMusclesJson=secondary;this.level=level;this.instructionsJson=instructions;this.imageUrlsJson=images;this.source=source;}
    public void importFrom(String muscleGroup,String equipment,String setup,String brace,String execution,String mistakes,String primary,String secondary,String level,String instructions,String images,String source){this.muscleGroup=muscleGroup;this.equipment=equipment;this.setup=setup;this.brace=brace;this.execution=execution;this.commonMistakes=mistakes;this.primaryMusclesJson=primary;this.secondaryMusclesJson=secondary;this.level=level;this.instructionsJson=instructions;this.imageUrlsJson=images;this.source=source;}
    public Long getId(){return id;}public String getName(){return name;}public String getMuscleGroup(){return muscleGroup;}public String getEquipment(){return equipment;}public String getSetup(){return setup;}public String getBrace(){return brace;}public String getExecution(){return execution;}public String getCommonMistakes(){return commonMistakes;}public String getPrimaryMusclesJson(){return primaryMusclesJson;}public String getSecondaryMusclesJson(){return secondaryMusclesJson;}public String getLevel(){return level;}public String getInstructionsJson(){return instructionsJson;}public String getImageUrlsJson(){return imageUrlsJson;}public String getSource(){return source;}
}
