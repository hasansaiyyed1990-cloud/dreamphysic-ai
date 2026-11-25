package com.fitforge.timetable;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

@Service
public class TimetableService {
    private final WeeklyPlanRepository plans; private final DailyCheckInRepository checkins;
    public TimetableService(WeeklyPlanRepository plans,DailyCheckInRepository checkins){this.plans=plans;this.checkins=checkins;}
    public List<TimetableDtos.PlanDay> weekly(String email){var existing=plans.findByUserEmailOrderByDayOfWeek(email).stream().collect(java.util.stream.Collectors.toMap(WeeklyPlanDay::getDayOfWeek,p->p));return java.util.Arrays.stream(DayOfWeek.values()).map(day->existing.containsKey(day)?dto(existing.get(day)):new TimetableDtos.PlanDay(day,"Rest","",false)).toList();}
    @Transactional public TimetableDtos.PlanDay savePlan(String email,DayOfWeek day,TimetableDtos.PlanUpdate u){var e=plans.findByUserEmailAndDayOfWeek(email,day).orElseGet(()->new WeeklyPlanDay(email,day,u.focus(),u.plan(),u.express20()));e.setFocus(u.focus());e.setPlan(u.plan());e.setExpress20(u.express20());return dto(plans.save(e));}
    @Transactional public TimetableDtos.PlanDay express(String email,DayOfWeek day,boolean enabled){var e=plans.findByUserEmailAndDayOfWeek(email,day).orElseGet(()->new WeeklyPlanDay(email,day,"Rest","",enabled));e.setExpress20(enabled);return dto(plans.save(e));}
    public TimetableDtos.DailyCheckIn daily(String email,LocalDate date){var e=checkins.findByUserEmailAndDate(email,date).orElseGet(()->new DailyCheckIn(email,date));return dto(e);}
    @Transactional public TimetableDtos.DailyCheckIn toggle(String email,LocalDate date,String field,boolean enabled){var e=checkins.findByUserEmailAndDate(email,date).orElseGet(()->new DailyCheckIn(email,date));switch(field){case "creatine"->e.setCreatineTaken(enabled);case "water"->e.setWaterGoalMet(enabled);case "complete"->e.setWorkoutCompleted(enabled);default->throw new IllegalArgumentException("Unknown daily toggle");}return dto(checkins.save(e));}
    @Transactional public TimetableDtos.DailyCheckIn water(String email,LocalDate date,int glasses){var e=checkins.findByUserEmailAndDate(email,date).orElseGet(()->new DailyCheckIn(email,date));e.setWaterGlasses(glasses);return dto(checkins.save(e));}
    public List<TimetableDtos.DailyCheckIn> heatmap(String email,LocalDate from,LocalDate to){if(from.isAfter(to))throw new IllegalArgumentException("from must be on or before to");return checkins.findByUserEmailAndDateBetweenOrderByDateAsc(email,from,to).stream().map(this::dto).toList();}
    public TimetableDtos.Streak streak(String email){var completed=checkins.findByUserEmailAndWorkoutCompletedTrueOrderByDateDesc(email).stream().map(DailyCheckIn::getDate).toList();int current=0;LocalDate d=LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"));if(!completed.contains(d))d=d.minusDays(1);while(completed.contains(d)){current++;d=d.minusDays(1);}int longest=0,run=0;LocalDate prev=null;for(var date:completed.stream().sorted().toList()){run=prev!=null&&prev.plusDays(1).equals(date)?run+1:1;longest=Math.max(longest,run);prev=date;}return new TimetableDtos.Streak(current,longest);}
    private TimetableDtos.PlanDay dto(WeeklyPlanDay e){return new TimetableDtos.PlanDay(e.getDayOfWeek(),e.getFocus(),e.getPlan(),e.isExpress20());}
    private TimetableDtos.DailyCheckIn dto(DailyCheckIn e){return new TimetableDtos.DailyCheckIn(e.getDate(),e.isCreatineTaken(),e.isWaterGoalMet(),e.getWaterGlasses(),e.isWorkoutCompleted());}
}
