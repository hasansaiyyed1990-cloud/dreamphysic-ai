package com.fitforge.nutrition;
import org.springframework.data.jpa.repository.JpaRepository; import java.util.List;
public interface DeadlineChangeRepository extends JpaRepository<DeadlineChange,Long>{List<DeadlineChange> findByUserIdOrderByChangedAtDesc(Long userId);}
