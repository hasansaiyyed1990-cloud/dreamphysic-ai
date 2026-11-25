package com.fitforge.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AuthDtos {
    private AuthDtos() {}
    public record Credentials(@NotBlank @Email @Size(max = 190) String email, @NotBlank @Size(min = 8, max = 72) String password,
                              @Size(max = 120) String name) {}
    public record AuthResult(String token, String type, Long userId, String email, String name) {}
    public record ForgotPasswordRequest(@NotBlank @Email @Size(max = 190) String email) {}
    public record ResetPasswordRequest(
            @NotBlank @Email @Size(max = 190) String email,
            @NotBlank @Pattern(regexp = "\\d{6}", message = "OTP must be 6 digits") String otp,
            @NotBlank @Size(min = 8, max = 72) String newPassword) {}
}
