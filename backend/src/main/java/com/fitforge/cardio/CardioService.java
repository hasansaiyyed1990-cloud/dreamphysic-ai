package com.fitforge.cardio;

import com.fitforge.nutrition.NutritionModuleService;
import com.fitforge.progress.WeightRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service public class CardioService {
    private static final Set<String> ACTIVITIES = Set.of("RUNNING","INDOOR_JOGGING","WALKING","SWIMMING","CYCLING","HIIT","BODYWEIGHT","CUSTOM","TREADMILL","ROWING","ELLIPTICAL");
    private static final Set<String> SOURCES = Set.of("MANUAL","GPS_LIVE","SCREENSHOT_IMPORT","HEALTH_CONNECT","STRAVA");

    private final CardioRepository repo;
    private final CardioGoalRepository goals;
    private final WeightRepository weights;
    private final NutritionModuleService nutrition;

    public CardioService(CardioRepository repo,CardioGoalRepository goals,WeightRepository weights,NutritionModuleService nutrition){
        this.repo=repo;this.goals=goals;this.weights=weights;this.nutrition=nutrition;
    }

    public List<CardioDtos.Session> list(String email){return repo.findByUserEmailOrderBySessionDateDesc(email).stream().map(this::dto).toList();}

    /** Backwards compatible: paging applies only when page or size is supplied. */
    public List<CardioDtos.Session> list(String email,Integer page,Integer size){
        if(page==null&&size==null)return list(email);
        int p=page==null||page<0?0:page;
        int s=size==null?20:Math.min(100,Math.max(1,size));
        return repo.findByUserEmailOrderBySessionDateDesc(email,PageRequest.of(p,s)).stream().map(this::dto).toList();
    }

    @Transactional public CardioDtos.Session create(String email,CardioDtos.Create c){
        if(c.distanceKm()>1000||c.durationMinutes()>1440)throw new IllegalArgumentException("Distance or duration is outside the supported range");
        if(c.caloriesBurned()!=null&&c.caloriesBurned()>10000)throw new IllegalArgumentException("Calories must be a plausible estimate no greater than 10000");
        if(c.staminaScore()!=null&&c.staminaScore()>100)throw new IllegalArgumentException("staminaScore must be between 0 and 100");
        if(c.averageHeartRate()!=null&&(c.averageHeartRate()<20||c.averageHeartRate()>250)||c.maximumHeartRate()!=null&&(c.maximumHeartRate()<20||c.maximumHeartRate()>250))throw new IllegalArgumentException("Heart rate must be between 20 and 250 bpm");
        if(c.externalActivityId()!=null&&c.externalActivityId().length()>180)throw new IllegalArgumentException("externalActivityId is too long");
        if(c.routePolyline()!=null&&c.routePolyline().length()>2000000)throw new IllegalArgumentException("Route data is too large");
        if(c.lapSplitsJson()!=null&&c.lapSplitsJson().length()>20000)throw new IllegalArgumentException("Lap data is too large");
        if(c.notes()!=null&&c.notes().length()>1000)throw new IllegalArgumentException("Notes must be at most 1000 characters");
        String activity=c.activity()==null?"RUNNING":c.activity().trim().toUpperCase(Locale.ROOT).replace(' ','_');
        if(activity.equals("JOGGING"))activity="INDOOR_JOGGING";
        if(!ACTIVITIES.contains(activity))throw new IllegalArgumentException("Unsupported cardio activity type");
        String source=c.source()==null?"MANUAL":c.source().trim().toUpperCase(Locale.ROOT);
        if(!SOURCES.contains(source))throw new IllegalArgumentException("Unsupported cardio data source");
        if(c.externalActivityId()!=null&&!c.externalActivityId().isBlank()&&repo.existsByUserEmailAndSourceAndExternalActivityId(email,source,c.externalActivityId()))throw new IllegalArgumentException("This external activity has already been imported");
        CardioSession entity=new CardioSession(email,new CardioDtos.Create(c.distanceKm(),c.durationMinutes(),c.caloriesBurned(),c.staminaScore(),c.sessionDate(),activity,c.notes(),source,c.externalActivityId(),c.averageHeartRate(),c.maximumHeartRate(),c.elevationGainM(),c.cadence(),c.routePolyline(),c.lapSplitsJson()));
        if(c.caloriesBurned()==null){
            var weight=weights.findTopByUserEmailOrderByDateDesc(email);
            if(weight.isPresent()){
                entity.setCaloriesBurned(estimateCalories(activity,weight.get().getWeightKg(),c.durationMinutes()));
                entity.setCaloriesEstimated(true);
            }
        }
        var saved=repo.save(entity);
        nutrition.recalculateBalance(email,dateOf(saved));
        return dto(saved);
    }

    @Transactional public void delete(String email,Long id){
        var entity=repo.findByIdAndUserEmail(id,email).orElseThrow(()->new IllegalArgumentException("Cardio session not found"));
        LocalDate date=dateOf(entity);
        repo.delete(entity);
        nutrition.recalculateBalance(email,date);
    }

    @Transactional public CardioDtos.Goal putGoal(String email,CardioDtos.GoalInput i){
        if(i.targetDistanceKm()==null&&i.targetPaceMinPerKm()==null&&i.targetTimeSeconds()==null)throw new IllegalArgumentException("Provide a distance, pace, or time target");
        var g=goals.findByUserEmailAndGoalNameIgnoreCase(email,i.goalName()).orElseGet(()->new CardioGoal(email,i));
        g.update(i);
        return goalDto(g);
    }

    @Transactional public List<CardioDtos.Goal> goals(String email){return goals.findByUserEmailAndDeletedFalseOrderByGoalNameAsc(email).stream().map(this::goalDto).toList();}

    @Transactional public void deleteGoal(String email,String goalName){
        var g=goals.findByUserEmailAndGoalNameIgnoreCase(email,goalName).orElseThrow(()->new IllegalArgumentException("Cardio goal not found"));
        if(g.isDeleted())return;
        g.softDelete();
        goals.save(g);
    }

    private LocalDate dateOf(CardioSession s){return s.getSessionDate()==null?LocalDate.now(java.time.ZoneId.of("Asia/Kolkata")):s.getSessionDate().toLocalDate();}

    private CardioDtos.Goal goalDto(CardioGoal g){
        var history=repo.findByUserEmailOrderBySessionDateDesc(g.getUserEmail());
        double maxDistance=history.stream().mapToDouble(CardioSession::getDistanceKm).max().orElse(0);
        var qualifying=history.stream().filter(s->g.getTargetDistanceKm()==null||s.getDistanceKm()>=g.getTargetDistanceKm()).toList();
        double bestPace=qualifying.stream().mapToDouble(CardioSession::getPaceMinPerKm).min().orElse(history.stream().mapToDouble(CardioSession::getPaceMinPerKm).min().orElse(0));
        int bestTime=qualifying.stream().mapToInt(s->{
            double distance=g.getTargetDistanceKm()==null?s.getDistanceKm():g.getTargetDistanceKm();
            double pace=s.getPaceMinPerKm();
            return distance<=0||pace<=0?0:(int)Math.round(pace*distance*60);
        }).filter(t->t>0).min().orElse(0);
        boolean distanceMet=g.getTargetDistanceKm()==null||history.stream().anyMatch(s->s.getDistanceKm()>=g.getTargetDistanceKm());
        boolean paceMet=g.getTargetPaceMinPerKm()==null||bestPace>0&&bestPace<=g.getTargetPaceMinPerKm();
        boolean timeMet=g.getTargetTimeSeconds()==null||bestTime>0&&bestTime<=g.getTargetTimeSeconds();
        boolean met=distanceMet&&paceMet&&timeMet;
        LocalDate today=LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"));
        boolean missed=today.isAfter(g.getOriginalDeadline())&&!met;
        long late=missed?java.time.temporal.ChronoUnit.DAYS.between(g.getOriginalDeadline(),today):0;
        double nextDistance=g.getTargetDistanceKm()!=null&&maxDistance<g.getTargetDistanceKm()?Math.min(g.getTargetDistanceKm(),Math.max(.5,maxDistance+.5)):maxDistance;
        double nextPace=bestPace==0?0:Math.round(bestPace*.99*100.0)/100.0;
        if(missed&&!g.getRevisedDeadline().isAfter(today)){g.reviseDeadline(today.plusDays(distanceMet?21:42));goals.save(g);}
        String advice=missed?"Target deadline missed; a gradual deadline reforecast is set. Progress with easy sessions and avoid compensatory high-volume cardio.":"Build easy distance first; consider only a small pace improvement after recovery and comfortable completion.";
        return new CardioDtos.Goal(g.getId(),g.getGoalName(),g.getTargetDistanceKm(),g.getTargetPaceMinPerKm(),g.getTargetTimeSeconds(),g.getOriginalDeadline(),g.getRevisedDeadline(),maxDistance,bestPace,bestTime,met,missed,late,nextDistance,nextPace,advice,history.stream().limit(10).map(this::dto).toList());
    }

    private int estimateCalories(String activity,double weightKg,int minutes){
        if(weightKg<=0||minutes<=0)return 0;
        double met=switch(activity){
            case "RUNNING"->8.3;
            case "INDOOR_JOGGING","TREADMILL"->7.0;
            case "WALKING"->4.3;
            case "SWIMMING"->7.0;
            case "CYCLING"->6.8;
            case "HIIT"->7.8;
            case "BODYWEIGHT"->5.0;
            default->5.0;
        };
        return (int)Math.round(met*weightKg*(minutes/60.0));
    }

    private CardioDtos.Session dto(CardioSession e){return new CardioDtos.Session(e.getId(),e.getActivity(),e.getDistanceKm(),e.getDurationMinutes(),e.getPaceMinPerKm(),e.getCaloriesBurned(),e.getCaloriesEstimated(),e.getStaminaScore(),e.getSessionDate(),e.getNotes(),e.getSource(),e.getExternalActivityId(),e.getAverageHeartRate(),e.getMaximumHeartRate(),e.getElevationGainM(),e.getCadence(),e.getRoutePolyline(),e.getLapSplitsJson());}
}
