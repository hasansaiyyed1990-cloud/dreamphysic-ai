package com.fitforge.config;

import com.fitforge.auth.JwtAuthFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class SecurityConfig {
    @Value("${app.cors.allowed-origins:http://localhost:5173,capacitor://localhost,http://localhost,https://localhost}")
    private String allowedOrigins;
    private final JwtAuthFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter, UserDetailsService userDetailsService) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.userDetailsService = userDetailsService;
    }

    @Bean SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http.csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // Harden browser handling of API responses; HSTS stays on for HTTPS requests only.
                .headers(h -> h
                        .contentTypeOptions(Customizer.withDefaults())
                        .frameOptions(f -> f.deny())
                        .referrerPolicy(r -> r.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER)))
                .authorizeHttpRequests(a -> a.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/health", "/api/app-version", "/api/auth/register", "/api/auth/login",
                                "/api/auth/forgot-password", "/api/auth/reset-password", "/actuator/health").permitAll()
                        // Everything else under actuator (info, env, beans, heapdump, ...) stays closed.
                        .requestMatchers("/actuator/**").denyAll()
                        .anyRequest().authenticated())
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class).build();
    }

    @Bean CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration c = new CorsConfiguration();
        List<String> all = Arrays.stream(allowedOrigins.split(",")).map(String::trim).filter(x -> !x.isBlank()).map(x -> x.endsWith("/") ? x.substring(0, x.length() - 1) : x).toList();
        c.setAllowedOrigins(all.stream().filter(x -> !x.contains("*")).toList());
        c.setAllowedOriginPatterns(all.stream().filter(x -> x.contains("*")).toList());
        c.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        c.setAllowedHeaders(List.of("*"));
        c.setExposedHeaders(List.of("Authorization"));
        c.setMaxAge(3600L);
        // Auth is a bearer token header, not cookies, so credentials are not needed (and a wildcard origin with credentials would be unsafe).
        c.setAllowCredentials(false);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", c);
        return source;
    }

    @Bean AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider p = new DaoAuthenticationProvider();
        p.setUserDetailsService(userDetailsService);
        p.setPasswordEncoder(passwordEncoder());
        return p;
    }
    @Bean AuthenticationManager authenticationManager(AuthenticationConfiguration c) throws Exception { return c.getAuthenticationManager(); }
    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }
}
