package com.fitforge.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Locale;
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
        if (c == null || c.email() == null || c.email().isBlank() || c.password() == null || c.password().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email and password are required");
        }
        String email = c.email().trim().toLowerCase(Locale.ROOT);
        if (users.existsByEmail(email)) throw emailConflict();
        AppUser u = new AppUser(resolveName(c, email), email, encoder.encode(c.password()));
        try {
            // saveAndFlush forces the unique-email check inside this try, so a
            // concurrent duplicate registration becomes a clean 409, never a 500.
            u = users.saveAndFlush(u);
        } catch (DataIntegrityViolationException ex) {
            throw emailConflict();
        }
        return result(u);
    }

    public AuthDtos.AuthResult login(AuthDtos.Credentials c) {
        if (c == null || c.email() == null || c.email().isBlank() || c.password() == null || c.password().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email and password are required");
        }
        String email = c.email().trim().toLowerCase(Locale.ROOT);
        try {
            auth.authenticate(new UsernamePasswordAuthenticationToken(email, c.password()));
        } catch (AuthenticationException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        return result(users.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password")));
    }

    private static ResponseStatusException emailConflict() {
        return new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered. Please sign in.");
    }

    /** First non-blank of name/fullName/username, else the email prefix (capped at the 120-char column). */
    private static String resolveName(AuthDtos.Credentials c, String email) {
        for (String candidate : new String[]{c.name(), c.fullName(), c.username()}) {
            if (candidate != null && !candidate.isBlank()) {
                String trimmed = candidate.trim();
                return trimmed.length() > 120 ? trimmed.substring(0, 120) : trimmed;
            }
        }
        int at = email.indexOf('@');
        String prefix = at > 0 ? email.substring(0, at) : email;
        return prefix.length() > 120 ? prefix.substring(0, 120) : prefix;
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
            try {
                sender.send(msg);
            } catch (RuntimeException mailFailure) {
                // A broken/unconfigured SMTP server must never fail the request with a 500.
                LOG.warn("Password reset OTP email could not be sent for {}: {}", email, mailFailure.getMessage());
            }
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
        return new AuthDtos.AuthResult(jwt.issue(u), "Bearer", u.getId(), u.getUsername(), u.getName(),
                new AuthDtos.UserSummary(u.getId(), u.getName(), u.getUsername()));
    }
}
