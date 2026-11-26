package com.fitforge.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AuthDtos {
    private AuthDtos() {}
    // name, fullName and username are all optional aliases for the display name;
    // AuthService resolves the first non-blank one so registration never sees a null name.
    public record Credentials(@NotBlank @Email @Size(max = 190) String email, @NotBlank @Size(min = 8, max = 72) String password,
                              @Size(max = 120) String name, @Size(max = 120) String fullName, @Size(max = 120) String username) {}
    public record AuthResult(String token, String type, Long userId, String email, String name, UserSummary user) {}
    public record UserSummary(Long id, String name, String email) {}
    public record ForgotPasswordRequest(@NotBlank @Email @Size(max = 190) String email) {}
    public record ResetPasswordRequest(
            @NotBlank @Email @Size(max = 190) String email,
            @NotBlank @Pattern(regexp = "\\d{6}", message = "OTP must be 6 digits") String otp,
            @NotBlank @Size(min = 8, max = 72) String newPassword) {}
}
