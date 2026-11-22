package com.fitforge.cardio;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Optional;

public interface CardioRepository extends JpaRepository<CardioSession,Long>{
    List<CardioSession> findByUserEmailOrderBySessionDateDesc(String email);
    List<CardioSession> findByUserEmailOrderBySessionDateDesc(String email, Pageable pageable);
    Optional<CardioSession> findByIdAndUserEmail(Long id,String email);
}
