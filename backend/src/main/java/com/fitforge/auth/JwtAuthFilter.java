package com.fitforge.auth;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtService jwt; private final UserDetailsService users;
    public JwtAuthFilter(JwtService jwt, UserDetailsService users){this.jwt=jwt;this.users=users;}
    @Override protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain)throws ServletException,IOException{
        String header=req.getHeader("Authorization");
        if(header!=null&&header.startsWith("Bearer ")&&SecurityContextHolder.getContext().getAuthentication()==null){
            try{String token=header.substring(7); Claims claims=jwt.parse(token); UserDetails user=users.loadUserByUsername(claims.getSubject());
                if(jwt.valid(token,user)){var auth=new UsernamePasswordAuthenticationToken(user,null,user.getAuthorities());auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));SecurityContextHolder.getContext().setAuthentication(auth);}
            }catch(Exception ignored){ /* invalid tokens remain unauthenticated and are rejected by Spring Security */ }
        }
        chain.doFilter(req,res);
    }
}
