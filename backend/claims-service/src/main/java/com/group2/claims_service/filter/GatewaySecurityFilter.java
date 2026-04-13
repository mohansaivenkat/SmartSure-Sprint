package com.group2.claims_service.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.io.PrintWriter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class GatewaySecurityFilter extends OncePerRequestFilter {

    private static final String GATEWAY_SECRET_HEADER = "X-Gateway-Secret";
    private static final String GATEWAY_SECRET_VALUE = "SmartSureSecretKey2026";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String requestURI = request.getRequestURI();
        
        // Exclude actuator health checks and eureka endpoints if any
        if (requestURI.startsWith("/actuator") || requestURI.startsWith("/eureka")) {
            filterChain.doFilter(request, response);
            return;
        }

        String secret = request.getHeader(GATEWAY_SECRET_HEADER);
        if (secret != null && GATEWAY_SECRET_VALUE.equals(secret.trim())) {
            filterChain.doFilter(request, response);
        } else if (secret != null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            PrintWriter writer = response.getWriter();
            writer.print("{\"error\": \"Unauthorized\", \"message\": \"Invalid gateway secret.\"}");
            writer.flush();
        } else {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            PrintWriter writer = response.getWriter();
            writer.print("{\"error\": \"Unauthorized\", \"message\": \"Direct access not allowed. Please use API Gateway.\"}");
            writer.flush();
        }
    }
}
