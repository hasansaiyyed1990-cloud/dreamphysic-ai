package com.fitforge.auth;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
    private final AppUserRepository users; private final PasswordEncoder encoder; private final JwtService jwt; private final AuthenticationManager auth;
    public AuthService(AppUserRepository users,PasswordEncoder encoder,JwtService jwt,AuthenticationManager auth){this.users=users;this.encoder=encoder;this.jwt=jwt;this.auth=auth;}
    public AuthDtos.AuthResult register(AuthDtos.Credentials c){String email=c.email().trim().toLowerCase();if(users.existsByEmail(email))throw new ResponseStatusException(HttpStatus.CONFLICT,"Email already registered");
        AppUser u=users.save(new AppUser(c.name()==null||c.name().isBlank()?email:c.name().trim(),email,encoder.encode(c.password())));return result(u);}
    public AuthDtos.AuthResult login(AuthDtos.Credentials c){String email=c.email().trim().toLowerCase();auth.authenticate(new UsernamePasswordAuthenticationToken(email,c.password()));return result(users.findByEmail(email).orElseThrow());}
    private AuthDtos.AuthResult result(AppUser u){return new AuthDtos.AuthResult(jwt.issue(u),"Bearer",u.getId(),u.getUsername(),u.getName());}
}
