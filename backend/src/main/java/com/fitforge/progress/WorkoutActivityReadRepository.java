package com.fitforge.progress;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;

public interface WorkoutActivityReadRepository extends Repository<com.fitforge.workout.WorkoutSession,Long>{
    @Query(value="select count(distinct cast(session_date as date)) from workout_sessions where user_email=:email and session_date >= :fromDate and session_date < :toDate",nativeQuery=true)
    long trainingDays(@Param("email") String email,@Param("fromDate") LocalDateTime from,@Param("toDate") LocalDateTime to);
}
