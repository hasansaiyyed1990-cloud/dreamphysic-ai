package com.fitforge.auth;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "password_reset_otps", indexes = @Index(name = "idx_otp_email_created", columnList = "email,created_at"))
public class PasswordResetOtp {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 190) private String email;
    @Column(name = "otp_hash", nullable = false, length = 100) private String otpHash;
    @Column(name = "expires_at", nullable = false) private Instant expiresAt;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();
    @Column(nullable = false) private boolean used = false;
    @Column(nullable = false) private int attempts = 0;

    protected PasswordResetOtp() {}
    public PasswordResetOtp(String email, String otpHash, Instant expiresAt) {
        this.email = email.toLowerCase();
        this.otpHash = otpHash;
        this.expiresAt = expiresAt;
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getOtpHash() { return otpHash; }
    public Instant getExpiresAt() { return expiresAt; }
    public boolean isUsed() { return used; }
    public int getAttempts() { return attempts; }
    public void incrementAttempts() { this.attempts++; }
    public void markUsed() { this.used = true; }
}
