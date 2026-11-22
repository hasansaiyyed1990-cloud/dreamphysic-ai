package com.fitforge.workout;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface PushUpRepository extends JpaRepository<PushUpLog,Long>{List<PushUpLog> findByUserEmailOrderByPerformedAtDesc(String email);}
