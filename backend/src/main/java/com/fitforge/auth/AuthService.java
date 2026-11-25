package com.fitforge.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class AuthService {
    private static final Logger LOG = LoggerFactory.getLogger(AuthService.class);
    private static final SecureRandom RNG = new SecureRandom();
    private static final int MAX_OTP_ATTEMPTS = 5;

    private final AppUserRepository users;
    private final PasswordResetOtpRepository otps;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final AuthenticationManager auth;
    private final ObjectProvider<JavaMailSender> mailSender;
    private final String mailHost;
    private final String mailFrom;

    public AuthService(AppUserRepository users, PasswordResetOtpRepository otps, PasswordEncoder encoder,
                       JwtService jwt, AuthenticationManager auth, ObjectProvider<JavaMailSender> mailSender,
                       @Value("${spring.mail.host:}") String mailHost,
                       @Value("${app.mail.from:noreply@dreamphysic.ai}") String mailFrom) {
        this.users = users;
        this.otps = otps;
        this.encoder = encoder;
        this.jwt = jwt;
        this.auth = auth;
        this.mailSender = mailSender;
        this.mailHost = mailHost;
        this.mailFrom = mailFrom;
    }

    public AuthDtos.AuthResult register(AuthDtos.Credentials c) {
        String email = c.email().trim().toLowerCase();
        if (users.existsByEmail(email)) throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        AppUser u = users.save(new AppUser(c.name() == null || c.name().isBlank() ? email : c.name().trim(), email, encoder.encode(c.password())));
        return result(u);
    }

    public AuthDtos.AuthResult login(AuthDtos.Credentials c) {
        String email = c.email().trim().toLowerCase();
        auth.authenticate(new UsernamePasswordAuthenticationToken(email, c.password()));
        return result(users.findByEmail(email).orElseThrow());
    }

    @Transactional
    public void logoutAll(String email) {
        AppUser user = users.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.incrementTokenVersion();
        users.save(user);
    }

    @Transactional
    public void forgotPassword(AuthDtos.ForgotPasswordRequest req) {
        String email = req.email().trim().toLowerCase();
        if (users.findByEmail(email).isEmpty()) return;
        // Only the newest code may be valid: invalidate any earlier unused OTP.
        otps.invalidateActiveForEmail(email);
        String otp = String.format("%06d", RNG.nextInt(1_000_000));
        otps.save(new PasswordResetOtp(email, encoder.encode(otp), Instant.now().plus(10, ChronoUnit.MINUTES)));
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender != null && mailHost != null && !mailHost.isBlank()) {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(mailFrom);
            msg.setTo(email);
            msg.setSubject("DreamPhysic AI - Password Reset OTP");
            msg.setText("Your 6-digit password reset OTP is: " + otp + "\nThis code expires in 10 minutes.");
            sender.send(msg);
        } else {
            LOG.info("DEV fallback OTP generated for {} (expires in 10m): {}", email, otp);
        }
    }

    // Failed attempts must survive the returned error, otherwise the 5-try cap never persists.
    @Transactional(noRollbackFor = IllegalArgumentException.class)
    public void resetPassword(AuthDtos.ResetPasswordRequest req) {
        String email = req.email().trim().toLowerCase();
        PasswordResetOtp record = otps.findTopByEmailAndUsedFalseOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired OTP"));
        if (Instant.now().isAfter(record.getExpiresAt()) || record.getAttempts() >= MAX_OTP_ATTEMPTS) {
            record.markUsed();
            otps.save(record);
            throw new IllegalArgumentException("Invalid or expired OTP");
        }
        if (!encoder.matches(req.otp(), record.getOtpHash())) {
            record.incrementAttempts();
            if (record.getAttempts() >= MAX_OTP_ATTEMPTS) record.markUsed();
            otps.save(record);
            throw new IllegalArgumentException("Invalid or expired OTP");
        }
        record.markUsed();
        otps.save(record);
        AppUser user = users.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired OTP"));
        user.setPasswordHash(encoder.encode(req.newPassword()));
        user.incrementTokenVersion();
        users.save(user);
    }

    private AuthDtos.AuthResult result(AppUser u) {
        return new AuthDtos.AuthResult(jwt.issue(u), "Bearer", u.getId(), u.getUsername(), u.getName());
    }
}
