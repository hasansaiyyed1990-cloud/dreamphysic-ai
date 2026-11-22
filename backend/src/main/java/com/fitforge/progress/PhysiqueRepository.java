package com.fitforge.progress;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface PhysiqueRepository extends JpaRepository<PhysiqueCheckIn,Long>{List<PhysiqueCheckIn> findByUserEmailOrderByDateDesc(String email);}
