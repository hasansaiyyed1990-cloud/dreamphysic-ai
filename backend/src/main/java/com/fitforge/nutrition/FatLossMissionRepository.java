package com.fitforge.nutrition;
import org.springframework.data.jpa.repository.JpaRepository; import java.util.Optional;
public interface FatLossMissionRepository extends JpaRepository<FatLossMission,Long>{Optional<FatLossMission> findByUserId(Long userId);}
