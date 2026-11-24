package com.fitforge.nutrition;
import org.springframework.data.jpa.repository.JpaRepository; import java.time.LocalDate; import java.util.Optional;
public interface HydrationFiberRepository extends JpaRepository<HydrationFiberLog,Long>{Optional<HydrationFiberLog> findByUserIdAndLogDate(Long userId,LocalDate date);}
