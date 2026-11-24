package com.fitforge.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RequestBodySizeLimitFilter extends OncePerRequestFilter {
    private static final long MAX_REQUEST_BYTES = 15L * 1024 * 1024;
    private static final String ERROR_BODY = "{\"success\":false,\"message\":\"Request body exceeds the 15 MB limit\",\"data\":null}";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (request.getContentLengthLong() > MAX_REQUEST_BYTES) {
            response.setStatus(413);
            response.setCharacterEncoding("UTF-8");
            response.setContentType("application/json");
            response.getWriter().write(ERROR_BODY);
            return;
        }
        chain.doFilter(request, response);
    }
}
