package com.fitforge.auth;

import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity @Table(name = "users", indexes = @Index(name = "idx_fitforge_user_email", columnList = "email", unique = true))
public class AppUser implements UserDetails {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 120) private String name;
    @Column(nullable = false, unique = true, length = 190) private String email;
    @Column(name = "password", nullable = false, length = 100) private String passwordHash;
    @Column(nullable = false) private int targetCalories = 1800;
    @Column(nullable = false, updatable = false) private LocalDateTime createdAt = LocalDateTime.now();
    protected AppUser() {}
    public AppUser(String name, String email, String passwordHash) { this.name=name; this.email=email.toLowerCase(); this.passwordHash=passwordHash; }
    public Long getId(){return id;} public String getName(){return name;} public int getTargetCalories(){return targetCalories;}
    @Override public Collection<? extends GrantedAuthority> getAuthorities(){return List.of(new SimpleGrantedAuthority("ROLE_USER"));}
    @Override public String getPassword(){return passwordHash;} @Override public String getUsername(){return email;}
    @Override public boolean isAccountNonExpired(){return true;} @Override public boolean isAccountNonLocked(){return true;}
    @Override public boolean isCredentialsNonExpired(){return true;} @Override public boolean isEnabled(){return true;}
}
