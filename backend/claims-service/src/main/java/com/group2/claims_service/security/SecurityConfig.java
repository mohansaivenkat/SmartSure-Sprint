package com.group2.claims_service.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
            .csrf(csrf -> csrf.disable())

            .authorizeHttpRequests(auth -> auth

                    // Swagger
                    .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html", "/error").permitAll()

                    // Admin-only endpoints (called via Feign from admin-service)
                    .requestMatchers("/api/claims/stats").hasRole("ADMIN")
                    .requestMatchers("/api/claims/*/status").hasRole("ADMIN")

                    // Customer endpoints
                    .requestMatchers("/api/claims/initiate").hasRole("CUSTOMER")
                    .requestMatchers("/api/claims/upload").hasRole("CUSTOMER")
                    .requestMatchers("/api/claims/status/**").hasAnyRole("CUSTOMER", "ADMIN")
                    .requestMatchers("/api/claims/user/**").hasAnyRole("CUSTOMER", "ADMIN")
                    .requestMatchers("/api/claims/**").hasAnyRole("CUSTOMER", "ADMIN")

                    // fallback
                    .anyRequest().authenticated()
            )

            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
