package com.fitforge.auth;

import com.fitforge.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/auth")
public class AuthController {
    private final AuthService service;
    public AuthController(AuthService service){this.service=service;}
    @PostMapping("/register") public ApiResponse<AuthDtos.AuthResult> register(@Valid @RequestBody AuthDtos.Credentials c){return ApiResponse.ok("Registered",service.register(c));}
    @PostMapping("/login") public ApiResponse<AuthDtos.AuthResult> login(@Valid @RequestBody AuthDtos.Credentials c){return ApiResponse.ok("Authenticated",service.login(c));}
}
