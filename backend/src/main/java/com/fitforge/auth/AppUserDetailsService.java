package com.fitforge.auth;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AppUserDetailsService implements UserDetailsService {
    private final AppUserRepository users;
    public AppUserDetailsService(AppUserRepository users){this.users=users;}
    @Override public UserDetails loadUserByUsername(String email){return users.findByEmail(email).orElseThrow(()->new UsernameNotFoundException("User not found"));}
}
