package com.fitforge.auth;

import com.fitforge.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/auth")
public class AuthController {
    private final AuthService service;
    public AuthController(AuthService service){this.service=service;}

    @PostMapping("/register") public ApiResponse<AuthDtos.AuthResult> register(@Valid @RequestBody AuthDtos.Credentials c){return ApiResponse.ok("Registered",service.register(c));}
    @PostMapping("/login") public ApiResponse<AuthDtos.AuthResult> login(@Valid @RequestBody AuthDtos.Credentials c){return ApiResponse.ok("Authenticated",service.login(c));}
    @PostMapping("/logout-all") public ApiResponse<Void> logoutAll(Authentication auth){service.logoutAll(auth.getName());return ApiResponse.ok("All sessions invalidated",null);}
    @PostMapping("/forgot-password") public ApiResponse<Void> forgotPassword(@Valid @RequestBody AuthDtos.ForgotPasswordRequest req){service.forgotPassword(req);return ApiResponse.ok("If the email is registered, a 6-digit OTP has been sent",null);}
    @PostMapping("/reset-password") public ApiResponse<Void> resetPassword(@Valid @RequestBody AuthDtos.ResetPasswordRequest req){service.resetPassword(req);return ApiResponse.ok("Password reset successful",null);}
}
