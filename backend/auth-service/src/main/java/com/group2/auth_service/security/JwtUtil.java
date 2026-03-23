package com.group2.auth_service.security;

import java.security.Key;
import java.util.Date;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;


@Component
public class JwtUtil {
	
	 @Value("${jwt.secret}")
	 private String secret;

	 public String generateToken(String email, Long userId, String role) {
	    return Jwts.builder()
	            	.setSubject(email)
	            		.claim("userId", userId) 
	                .claim("role", role)
	                .setIssuedAt(new Date(System.currentTimeMillis()))
	                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 24))
	                .signWith(getSignKey(), SignatureAlgorithm.HS256)
	                .compact();
	 }
	    
	 private Key getSignKey() {
	     byte[] keyBytes = Decoders.BASE64.decode(secret);
	     return Keys.hmacShaKeyFor(keyBytes);
	 }
	

}
