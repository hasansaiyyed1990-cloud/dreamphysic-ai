package com.fitforge.workout;
import jakarta.persistence.*;
@Entity @Table(name="workout_section_exercises",indexes=@Index(name="idx_workout_section_exercise_section",columnList="section_id"))
public class WorkoutSectionExercise {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(optional=false) @JoinColumn(name="section_id",nullable=false) private WorkoutSection section;
 @Column(name="exercise_name",nullable=false,length=160) private String exerciseName;
 @Column(length=120) private String equipment;
 @Column(name="muscle_group",length=120) private String muscleGroup;
 @Column(name="sort_order",nullable=false) private int sortOrder;
 protected WorkoutSectionExercise(){}
 public WorkoutSectionExercise(WorkoutSection section,String exerciseName,String equipment,String muscleGroup,int sortOrder){this.section=section;this.exerciseName=exerciseName.trim();this.equipment=equipment;this.muscleGroup=muscleGroup;this.sortOrder=sortOrder;}
 public Long getId(){return id;} public WorkoutSection getSection(){return section;} public String getExerciseName(){return exerciseName;} public String getEquipment(){return equipment;} public String getMuscleGroup(){return muscleGroup;} public int getSortOrder(){return sortOrder;}
}
