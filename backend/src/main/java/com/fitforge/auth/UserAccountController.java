package com.fitforge.auth;

import com.fitforge.common.ApiResponse;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
public class UserAccountController {
    private final AccountDeletionService service;

    public UserAccountController(AccountDeletionService service) {
        this.service = service;
    }

    @DeleteMapping("/account")
    public ApiResponse<Void> deleteAccount(Authentication auth) {
        service.deleteAccount(auth.getName());
        return ApiResponse.ok("Account and all associated data deleted", null);
    }
}
