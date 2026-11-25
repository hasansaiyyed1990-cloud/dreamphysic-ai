package com.fitforge.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class RequestLoggingFilter extends OncePerRequestFilter {
    private static final Logger LOG = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        long startNs = System.nanoTime();
        try {
            chain.doFilter(request, response);
        } finally {
            long durationMs = (System.nanoTime() - startNs) / 1_000_000L;
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String userId = (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName()))
                    ? auth.getName() : "anonymous";
            int status = response.getStatus();
            String errorCode = MDC.get("errorCode");
            if (errorCode == null && status >= 400) errorCode = "HTTP_" + status;
            MDC.put("userId", userId);
            MDC.put("method", request.getMethod());
            MDC.put("path", request.getRequestURI());
            MDC.put("status", String.valueOf(status));
            MDC.put("durationMs", String.valueOf(durationMs));
            if (errorCode != null) MDC.put("errorCode", errorCode);
            try {
                LOG.info("request userId={} method={} path={} status={} durationMs={} errorCode={}",
                        userId, request.getMethod(), request.getRequestURI(), status, durationMs,
                        errorCode == null ? "-" : errorCode);
            } finally {
                MDC.clear();
            }
        }
    }
}
