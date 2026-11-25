package com.fitforge.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Long> {
    Optional<PasswordResetOtp> findTopByEmailAndUsedFalseOrderByCreatedAtDesc(String email);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update PasswordResetOtp o set o.used = true where o.email = :email and o.used = false")
    int invalidateActiveForEmail(@Param("email") String email);
}
