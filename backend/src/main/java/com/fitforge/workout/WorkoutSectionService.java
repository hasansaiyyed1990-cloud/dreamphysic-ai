package com.fitforge.workout;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service public class WorkoutSectionService {
    private final WorkoutSectionRepository sections;
    private final WorkoutSectionExerciseRepository exercises;
    public WorkoutSectionService(WorkoutSectionRepository sections,WorkoutSectionExerciseRepository exercises){this.sections=sections;this.exercises=exercises;}

    @Transactional(readOnly=true) public List<WorkoutDtos.SectionView> list(String email){
        return sections.findByUserEmailOrderBySortOrderAscIdAsc(email).stream().map(this::view).toList();
    }
    @Transactional public WorkoutDtos.SectionView create(String email,WorkoutDtos.SectionInput i){
        String name=i.name().trim();
        var existing=sections.findFirstByUserEmailAndNameIgnoreCaseOrderByIdAsc(email,name);
        if(existing.isPresent()) return view(existing.get());
        int order=sections.findByUserEmailOrderBySortOrderAscIdAsc(email).size();
        return view(sections.save(new WorkoutSection(email,name,order)));
    }
    @Transactional public WorkoutDtos.SectionView rename(String email,Long id,WorkoutDtos.SectionInput i){
        var s=owned(email,id); s.rename(i.name()); return view(sections.save(s));
    }
    @Transactional public void delete(String email,Long id){
        var s=owned(email,id); exercises.deleteBySectionId(s.getId()); sections.delete(s);
    }
    @Transactional public WorkoutDtos.SectionView addExercise(String email,Long id,WorkoutDtos.SectionExerciseInput i){
        var s=owned(email,id);
        if(!exercises.existsBySectionIdAndExerciseNameIgnoreCase(id,i.exerciseName().trim())){
            int order=exercises.findBySectionIdOrderBySortOrderAscIdAsc(id).size();
            exercises.save(new WorkoutSectionExercise(s,i.exerciseName(),i.equipment(),i.muscleGroup(),order));
        }
        return view(s);
    }
    @Transactional public WorkoutDtos.SectionView removeExercise(String email,Long id,Long exerciseId){
        var s=owned(email,id);
        var row=exercises.findByIdAndSectionId(exerciseId,id).orElseThrow(()->new IllegalArgumentException("Section exercise not found"));
        exercises.delete(row); return view(s);
    }
    private WorkoutSection owned(String email,Long id){
        return sections.findByIdAndUserEmail(id,email).orElseThrow(()->new IllegalArgumentException("Workout section not found"));
    }
    private WorkoutDtos.SectionView view(WorkoutSection s){
        return new WorkoutDtos.SectionView(s.getId(),s.getName(),
            exercises.findBySectionIdOrderBySortOrderAscIdAsc(s.getId()).stream()
                .map(e->new WorkoutDtos.SectionExerciseView(e.getId(),e.getExerciseName(),e.getEquipment(),e.getMuscleGroup())).toList());
    }
}
