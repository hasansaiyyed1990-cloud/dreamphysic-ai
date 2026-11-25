package com.fitforge.progress;

import com.fitforge.auth.AppUser;
import com.fitforge.auth.AppUserRepository;
import com.fitforge.nutrition.FatLossMissionRepository;
import com.fitforge.workout.WorkoutDtos;
import com.fitforge.workout.WorkoutSetRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Service public class ProgressService {
    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    private final WeightRepository weights;
    private final PhysiqueRepository physique;
    private final WorkoutSetRepository sets;
    private final WorkoutActivityReadRepository activity;
    private final AppUserRepository users;
    private final FatLossMissionRepository missions;

    public ProgressService(WeightRepository weights,PhysiqueRepository physique,WorkoutSetRepository sets,
                           WorkoutActivityReadRepository activity,AppUserRepository users,FatLossMissionRepository missions){
        this.weights=weights;this.physique=physique;this.sets=sets;this.activity=activity;this.users=users;this.missions=missions;
    }

    @Transactional public ProgressDtos.WeightEntry addWeight(String email,ProgressDtos.WeightInput i){var entry=weights.findByUserEmailAndDate(email,i.date()).orElseGet(()->new WeightEntry(email,i));entry.setWeightKg(i.weightKg());return dto(weights.save(entry));}
    public ProgressDtos.WeeklyWeight weekly(String email,LocalDate start){LocalDate monday=start.with(DayOfWeek.MONDAY);var list=weights.findByUserEmailAndDateBetweenOrderByDateAsc(email,monday,monday.plusDays(6));Double first=list.isEmpty()?null:list.get(0).getWeightKg(),last=list.isEmpty()?null:list.get(list.size()-1).getWeightKg();return new ProgressDtos.WeeklyWeight(monday,list.stream().map(this::dto).toList(),first,last,first==null?null:last-first);}

    public List<ProgressDtos.WeightEntry> weights(String email,LocalDate from,LocalDate to){return weights.findByUserEmailAndDateBetweenOrderByDateAsc(email,from,to).stream().map(this::dto).toList();}

    /** Backwards compatible: paging applies only when page or size is supplied. */
    public List<ProgressDtos.WeightEntry> weights(String email,LocalDate from,LocalDate to,Integer page,Integer size){
        if(page==null&&size==null)return weights(email,from,to);
        int p=page==null||page<0?0:page;
        int s=size==null?20:Math.min(100,Math.max(1,size));
        return weights.findByUserEmailAndDateBetweenOrderByDateAsc(email,from,to,PageRequest.of(p,s)).stream().map(this::dto).toList();
    }

    @Transactional public ProgressDtos.PhysiqueCheckIn addPhysique(String email,ProgressDtos.PhysiqueInput i){return dto(physique.save(new PhysiqueCheckIn(email,i)));}
    public List<ProgressDtos.PhysiqueCheckIn> physique(String email){return physique.findByUserEmailOrderByDateDesc(email).stream().map(this::dto).toList();}
    public List<WorkoutDtos.PersonalRecord> prs(String email){return sets.findByUserEmailOrderByExerciseNameAscWeightKgDescWorkoutDateDesc(email).stream().collect(Collectors.toMap(s->s.getExerciseName().toLowerCase(Locale.ROOT),s->new WorkoutDtos.PersonalRecord(s.getExerciseName(),s.getWeightKg(),s.getReps(),s.getWorkoutDate()),(first,ignored)->first,LinkedHashMap::new)).values().stream().toList();}

    public List<ProgressDtos.Alert> alerts(String email){
        var alerts=new ArrayList<ProgressDtos.Alert>();LocalDate today=LocalDate.now(IST);var recent=weights.findByUserEmailAndDateBetweenOrderByDateAsc(email,today.minusDays(13),today);
        if(recent.size()>=3){double min=recent.stream().mapToDouble(WeightEntry::getWeightKg).min().orElse(0),max=recent.stream().mapToDouble(WeightEntry::getWeightKg).max().orElse(0);if(max-min<0.3)alerts.add(new ProgressDtos.Alert("PLATEAU","Possible weight plateau","Weight has changed less than 0.3 kg across recent check-ins. Review adherence and trend before changing your plan.",true));}
        LocalDateTime now=LocalDateTime.now(IST);long thisWeek=activity.trainingDays(email,now.minusDays(7),now.plusSeconds(1));long priorWeek=activity.trainingDays(email,now.minusDays(14),now.minusDays(7));if(thisWeek>=5&&priorWeek>=5)alerts.add(new ProgressDtos.Alert("DELOAD","Consider a deload","Training has been frequent for two consecutive weeks. Consider a lighter recovery week.",true));
        return alerts;
    }

    /** Mifflin-St Jeor BMR + activity TDEE from the stored profile and the latest weight. */
    public ProgressDtos.Metabolic metabolic(String email){
        AppUser user=users.findByEmail(email).orElseThrow(()->new IllegalArgumentException("Authenticated user not found"));
        Double weightKg=weights.findTopByUserEmailOrderByDateDesc(email).map(WeightEntry::getWeightKg).orElse(null);
        Double height=user.getHeightCm();Integer age=user.getAgeYears();
        Double bmi=null,bmr=null,tdee=null;
        String warning=null;
        if(weightKg!=null&&height!=null&&height>0)bmi=round(weightKg/Math.pow(height/100.0,2));
        if(weightKg!=null&&height!=null&&height>0&&age!=null&&age>0){
            double base=10*weightKg+6.25*height-5*age+(isMale(user.getGender())?5:-161);
            double factor=activityFactor(user.getActivityLevel());
            bmr=round(base);tdee=round(base*factor);
        }else{
            warning="Add height, age and gender to calculate BMR/TDEE; nothing is guessed.";
        }
        return new ProgressDtos.Metabolic(height,age,user.getGender(),user.getActivityLevel(),user.getPrimaryGoal(),user.getSecondaryGoal(),
                weightKg,bmi,bmr,tdee,activityFactor(user.getActivityLevel()),"Mifflin-St Jeor",warning,conflicts(user,weightKg));
    }

    @Transactional public ProgressDtos.Metabolic saveMetabolic(String email,ProgressDtos.MetabolicInput i){
        AppUser user=users.findByEmail(email).orElseThrow(()->new IllegalArgumentException("Authenticated user not found"));
        user.setMetabolicProfile(i.heightCm(),i.ageYears(),upper(i.gender()),upper(i.activityLevel()));
        user.setGoals(trimToNull(i.primaryGoal()),trimToNull(i.secondaryGoal()));
        users.save(user);
        return metabolic(email);
    }

    /** Consecutive IST calendar days with a logged workout, plus the longest run. */
    public ProgressDtos.Streak streak(String email){
        var trained=new TreeSet<LocalDate>();
        for(var d:activity.trainingDates(email))if(d!=null)trained.add(d.toLocalDate());
        LocalDate today=LocalDate.now(IST);
        LocalDate last=trained.isEmpty()?null:trained.last();
        int current=0;
        if(last!=null){
            LocalDate cursor=trained.contains(today)?today:today.minusDays(1);
            while(trained.contains(cursor)){current++;cursor=cursor.minusDays(1);}
        }
        int longest=0,run=0;LocalDate prev=null;
        for(var d:trained){run=prev!=null&&prev.plusDays(1).equals(d)?run+1:1;longest=Math.max(longest,run);prev=d;}
        return new ProgressDtos.Streak(current,longest,last);
    }

    private List<ProgressDtos.Alert> conflicts(AppUser user,Double weightKg){
        var out=new ArrayList<ProgressDtos.Alert>();
        if(weightKg==null)return out;
        var mission=missions.findByUserId(user.getId()).orElse(null);
        if(mission!=null&&mission.getTargetWeightKg()>=weightKg)
            out.add(new ProgressDtos.Alert("GOAL_CONFLICT","Fat-loss target above current weight",
                    "Your fat-loss mission targets "+round(mission.getTargetWeightKg())+" kg while the latest weight is "+round(weightKg)+" kg. Update the target weight so the deficit plan can reach it.",true));
        if(mission!=null&&mission.getTargetWeightKg()>0&&mission.getTargetWeightKg()<weightKg*0.85)
            out.add(new ProgressDtos.Alert("GOAL_CONFLICT","Aggressive weight target",
                    "A target more than 15% below current weight needs a staged plan. Avoid crash dieting and keep the deficit moderate.",true));
        if(user.getHeightCm()!=null&&user.getHeightCm()>0){
            double bmi=weightKg/Math.pow(user.getHeightCm()/100.0,2);
            if(bmi<18.5)out.add(new ProgressDtos.Alert("HEALTH_RANGE","BMI below healthy range",
                    "A deficit plan at this body weight risks under-fuelling. Review the target with a professional.",true));
        }
        return out;
    }

    private static boolean isMale(String gender){return gender!=null&&gender.toUpperCase(Locale.ROOT).startsWith("M");}

    private static double activityFactor(String level){
        if(level==null)return 1.375;
        return switch(level.toUpperCase(Locale.ROOT)){
            case "SEDENTARY" -> 1.2;
            case "MODERATE" -> 1.55;
            case "ACTIVE" -> 1.725;
            case "VERY_ACTIVE" -> 1.9;
            default -> 1.375;
        };
    }

    private static double round(double value){return Math.round(value*10.0)/10.0;}
    private static String upper(String value){return value==null?null:value.trim().toUpperCase(Locale.ROOT);}
    private static String trimToNull(String value){return value==null||value.isBlank()?null:value.trim();}
    private ProgressDtos.WeightEntry dto(WeightEntry e){return new ProgressDtos.WeightEntry(e.getId(),e.getDate(),e.getWeightKg());}
    private ProgressDtos.PhysiqueCheckIn dto(PhysiqueCheckIn e){return new ProgressDtos.PhysiqueCheckIn(e.getId(),e.getDate(),e.getWeightKg(),e.getWaistCm(),e.getPhotoUrl(),e.getNotes());}
}
