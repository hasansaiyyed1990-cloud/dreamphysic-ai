package com.fitforge.progress;

import com.fitforge.workout.WorkoutDtos;
import com.fitforge.workout.WorkoutSetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;

@Service public class ProgressService {
    private final WeightRepository weights;private final PhysiqueRepository physique;private final WorkoutSetRepository sets;private final WorkoutActivityReadRepository activity;
    public ProgressService(WeightRepository weights,PhysiqueRepository physique,WorkoutSetRepository sets,WorkoutActivityReadRepository activity){this.weights=weights;this.physique=physique;this.sets=sets;this.activity=activity;}
    @Transactional public ProgressDtos.WeightEntry addWeight(String email,ProgressDtos.WeightInput i){var entry=weights.findByUserEmailAndDate(email,i.date()).orElseGet(()->new WeightEntry(email,i));entry.setWeightKg(i.weightKg());return dto(weights.save(entry));}
    public ProgressDtos.WeeklyWeight weekly(String email,LocalDate start){LocalDate monday=start.with(DayOfWeek.MONDAY);var list=weights.findByUserEmailAndDateBetweenOrderByDateAsc(email,monday,monday.plusDays(6));Double first=list.isEmpty()?null:list.get(0).getWeightKg(),last=list.isEmpty()?null:list.get(list.size()-1).getWeightKg();return new ProgressDtos.WeeklyWeight(monday,list.stream().map(this::dto).toList(),first,last,first==null?null:last-first);}
    public List<ProgressDtos.WeightEntry> weights(String email,LocalDate from,LocalDate to){return weights.findByUserEmailAndDateBetweenOrderByDateAsc(email,from,to).stream().map(this::dto).toList();}
    @Transactional public ProgressDtos.PhysiqueCheckIn addPhysique(String email,ProgressDtos.PhysiqueInput i){return dto(physique.save(new PhysiqueCheckIn(email,i)));}
    public List<ProgressDtos.PhysiqueCheckIn> physique(String email){return physique.findByUserEmailOrderByDateDesc(email).stream().map(this::dto).toList();}
    public List<WorkoutDtos.PersonalRecord> prs(String email){return sets.findByUserEmailOrderByExerciseNameAscWeightKgDescWorkoutDateDesc(email).stream().collect(java.util.stream.Collectors.toMap(s->s.getExerciseName().toLowerCase(java.util.Locale.ROOT),s->new WorkoutDtos.PersonalRecord(s.getExerciseName(),s.getWeightKg(),s.getReps(),s.getWorkoutDate()),(first,ignored)->first,java.util.LinkedHashMap::new)).values().stream().toList();}
    public List<ProgressDtos.Alert> alerts(String email){var alerts=new ArrayList<ProgressDtos.Alert>();LocalDate today=LocalDate.now();var recent=weights.findByUserEmailAndDateBetweenOrderByDateAsc(email,today.minusDays(13),today);if(recent.size()>=3){double min=recent.stream().mapToDouble(WeightEntry::getWeightKg).min().orElse(0),max=recent.stream().mapToDouble(WeightEntry::getWeightKg).max().orElse(0);if(max-min<0.3)alerts.add(new ProgressDtos.Alert("PLATEAU","Possible weight plateau","Weight has changed less than 0.3 kg across recent check-ins. Review adherence and trend before changing your plan.",true));}
        LocalDateTime now=LocalDateTime.now();long thisWeek=activity.trainingDays(email,now.minusDays(7),now.plusSeconds(1));long priorWeek=activity.trainingDays(email,now.minusDays(14),now.minusDays(7));if(thisWeek>=5&&priorWeek>=5)alerts.add(new ProgressDtos.Alert("DELOAD","Consider a deload","Training has been frequent for two consecutive weeks. Consider a lighter recovery week.",true));return alerts;}
    private ProgressDtos.WeightEntry dto(WeightEntry e){return new ProgressDtos.WeightEntry(e.getId(),e.getDate(),e.getWeightKg());}
    private ProgressDtos.PhysiqueCheckIn dto(PhysiqueCheckIn e){return new ProgressDtos.PhysiqueCheckIn(e.getId(),e.getDate(),e.getWeightKg(),e.getWaistCm(),e.getPhotoUrl(),e.getNotes());}
}
