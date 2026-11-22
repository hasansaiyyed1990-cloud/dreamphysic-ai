package com.fitforge.workout;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.LinkedHashMap;

@Service public class WorkoutService {
    private final WorkoutSessionRepository sessions;private final WorkoutSetRepository sets;private final ExerciseLibraryRepository library;private final PushUpRepository pushups;
    public WorkoutService(WorkoutSessionRepository sessions,WorkoutSetRepository sets,ExerciseLibraryRepository library,PushUpRepository pushups){this.sessions=sessions;this.sets=sets;this.library=library;this.pushups=pushups;}
    public List<WorkoutDtos.ExerciseGuide> library(){return library.findAllByOrderByMuscleGroupAscNameAsc().stream().map(this::guide).toList();}
    @Transactional public WorkoutDtos.ExerciseGuide addGuide(WorkoutDtos.ExerciseGuideInput i){return guide(library.save(new ExerciseLibraryItem(i)));}
    @Transactional(readOnly=true) public List<WorkoutDtos.Session> sessions(String email){return sessions.findByUserEmailOrderBySessionDateDesc(email).stream().map(this::session).toList();}
    @Transactional public WorkoutDtos.Session create(String email,WorkoutDtos.SessionInput i){return session(sessions.save(new WorkoutSession(email,i)));}
    @Transactional(readOnly=true) public WorkoutDtos.Session session(String email,Long id){return session(sessions.findByIdAndUserEmail(id,email).orElseThrow(()->new IllegalArgumentException("Workout not found")));}
    @Transactional public WorkoutDtos.SetEntry addSet(String email,Long id,WorkoutDtos.SetInput i){var s=sessions.findByIdAndUserEmail(id,email).orElseThrow(()->new IllegalArgumentException("Workout not found"));var row=new WorkoutSet(email,i,s.getSessionDate());s.addSet(row);sessions.save(s);return set(row);}
    public List<WorkoutDtos.SetEntry> lastSets(String email,String exercise){return sets.lastSets(email,exercise).stream().map(this::set).toList();}
    @Transactional public WorkoutDtos.RepeatResult repeat(String email,Long id,String exercise){var target=sessions.findByIdAndUserEmail(id,email).orElseThrow(()->new IllegalArgumentException("Workout not found"));var prior=sets.lastSets(email,exercise);if(prior.isEmpty())throw new IllegalArgumentException("No previous sets found for exercise");for(var old:prior){target.addSet(new WorkoutSet(email,new WorkoutDtos.SetInput(old.getExerciseName(),old.getSetNumber(),old.getReps(),old.getWeightKg(),old.getWeightKg(),old.getRestSeconds()),target.getSessionDate()));}sessions.save(target);return new WorkoutDtos.RepeatResult(exercise,prior.size(),target.getSets().stream().filter(s->s.getExerciseName().equalsIgnoreCase(exercise)).map(this::set).toList());}
    @Transactional public WorkoutDtos.PushUp addPushUp(String email,WorkoutDtos.PushUpInput i){return pushup(pushups.save(new PushUpLog(email,i)));}
    public List<WorkoutDtos.PushUp> pushups(String email){return pushups.findByUserEmailOrderByPerformedAtDesc(email).stream().map(this::pushup).toList();}
    public List<WorkoutDtos.PersonalRecord> prs(String email){var best=new LinkedHashMap<String,WorkoutSet>();for(var row:sets.findByUserEmailOrderByExerciseNameAscWeightKgDescWorkoutDateDesc(email))best.putIfAbsent(row.getExerciseName().toLowerCase(java.util.Locale.ROOT),row);return best.values().stream().map(s->new WorkoutDtos.PersonalRecord(s.getExerciseName(),s.getWeightKg(),s.getReps(),s.getWorkoutDate())).toList();}
    private WorkoutDtos.ExerciseGuide guide(ExerciseLibraryItem e){return new WorkoutDtos.ExerciseGuide(e.getId(),e.getName(),e.getMuscleGroup(),e.getEquipment(),e.getSetup(),e.getBrace(),e.getExecution(),e.getCommonMistakes());}
    private WorkoutDtos.Session session(WorkoutSession e){return new WorkoutDtos.Session(e.getId(),e.getName(),e.getSessionDate(),e.getSets().stream().map(this::set).toList());}
    private WorkoutDtos.SetEntry set(WorkoutSet e){return new WorkoutDtos.SetEntry(e.getId(),e.getExerciseName(),e.getSetNumber(),e.getReps(),e.getWeightKg(),e.getPreviousWeightKg(),e.getDeltaKg(),e.getRestSeconds(),e.getWorkoutDate());}
    private WorkoutDtos.PushUp pushup(PushUpLog e){return new WorkoutDtos.PushUp(e.getId(),e.getRepetitions(),e.getVariation(),e.getDurationSeconds(),e.getPerformedAt(),e.getNotes());}
}
