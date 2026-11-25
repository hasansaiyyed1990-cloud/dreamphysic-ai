package com.fitforge.progress;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface WorkoutActivityReadRepository extends Repository<com.fitforge.workout.WorkoutSession,Long>{
    @Query(value="select count(distinct cast(session_date as date)) from workout_sessions where user_email=:email and session_date >= :fromDate and session_date < :toDate",nativeQuery=true)
    long trainingDays(@Param("email") String email,@Param("fromDate") LocalDateTime from,@Param("toDate") LocalDateTime to);

    /** Distinct IST calendar days with a logged workout session, newest first. */
    @Query(value="select distinct cast(session_date as date) as trained_on from workout_sessions where user_email=:email order by trained_on desc",nativeQuery=true)
    List<java.sql.Date> trainingDates(@Param("email") String email);
}
