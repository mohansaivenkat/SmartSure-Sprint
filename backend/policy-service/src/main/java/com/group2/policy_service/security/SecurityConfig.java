package com.group2.policy_service.security;

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
            	    .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html", "/actuator/**", "/error").permitAll()

            	    // Admin APIs
            	    .requestMatchers("/api/admin/**").hasRole("ADMIN")

            	    // COMMON APIs
            	    .requestMatchers("/api/policies/search").hasAnyRole("CUSTOMER", "ADMIN")
            	    .requestMatchers("/api/policies/user/**").hasAnyRole("CUSTOMER", "ADMIN")
            	    .requestMatchers("/api/policies").hasAnyRole("CUSTOMER", "ADMIN")
            	    .requestMatchers("/api/policy-types").hasAnyRole("CUSTOMER", "ADMIN")

            	    // CUSTOMER only APIs
            	    .requestMatchers("/api/policies/purchase").hasRole("CUSTOMER")
            	    .requestMatchers("/api/policies/{id}").hasAnyRole("CUSTOMER", "ADMIN")

            	    // fallback
            	    .anyRequest().authenticated()
            	)

            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
