package com.fitforge.cardio;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service public class CardioService {
    private final CardioRepository repo; public CardioService(CardioRepository repo){this.repo=repo;}
    public List<CardioDtos.Session> list(String email){return repo.findByUserEmailOrderBySessionDateDesc(email).stream().map(this::dto).toList();}
    @Transactional public CardioDtos.Session create(String email,CardioDtos.Create c){if(c.staminaScore()!=null&&c.staminaScore()>100)throw new IllegalArgumentException("staminaScore must be between 0 and 100");String activity=c.activity()==null?"RUNNING":c.activity().trim().toUpperCase(java.util.Locale.ROOT).replace(' ','_');if(activity.equals("JOGGING"))activity="INDOOR_JOGGING";if(!activity.equals("RUNNING")&&!activity.equals("INDOOR_JOGGING"))throw new IllegalArgumentException("activity must be RUNNING or INDOOR_JOGGING");return dto(repo.save(new CardioSession(email,new CardioDtos.Create(c.distanceKm(),c.durationMinutes(),c.caloriesBurned(),c.staminaScore(),c.sessionDate(),activity,c.notes()))));}
    @Transactional public void delete(String email,Long id){repo.delete(repo.findByIdAndUserEmail(id,email).orElseThrow(()->new IllegalArgumentException("Cardio session not found")));}
    private CardioDtos.Session dto(CardioSession e){return new CardioDtos.Session(e.getId(),e.getActivity(),e.getDistanceKm(),e.getDurationMinutes(),e.getPaceMinPerKm(),e.getCaloriesBurned(),e.getStaminaScore(),e.getSessionDate(),e.getNotes());}
}
