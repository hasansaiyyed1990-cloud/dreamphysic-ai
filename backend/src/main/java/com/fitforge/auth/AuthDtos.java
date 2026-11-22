package com.fitforge.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {
    private AuthDtos() {}
    public record Credentials(@NotBlank @Email String email, @NotBlank @Size(min=8,max=100) String password,
                              @Size(max=120) String name) {}
    public record AuthResult(String token, String type, Long userId, String email, String name) {}
}
