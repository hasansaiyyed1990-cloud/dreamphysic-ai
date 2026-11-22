package com.fitforge.progress;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
public interface WeightRepository extends JpaRepository<WeightEntry,Long>{List<WeightEntry> findByUserEmailAndDateBetweenOrderByDateAsc(String email,LocalDate from,LocalDate to);List<WeightEntry> findTop16ByUserEmailAndDateBetweenOrderByDateDesc(String email,LocalDate from,LocalDate to);java.util.Optional<WeightEntry> findByUserEmailAndDate(String email,LocalDate date);java.util.Optional<WeightEntry> findTopByUserEmailOrderByDateDesc(String email);}
