package com.group2.auth_service.security;

import java.security.Key;
import java.util.Date;
import java.util.function.Function;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;


@Component
public class JwtUtil {
	
	 @Value("${jwt.secret}")
	 private String secret;

	 private static final long ACCESS_TOKEN_EXPIRATION = 1000L * 60 * 1; // 15 minutes
	 private static final long REFRESH_TOKEN_EXPIRATION = 1000L * 60 * 60 * 24 * 7; // 7 days

	 public String generateToken(String email, Long userId, String role) {
	    return Jwts.builder()
	            	.setSubject(email)
	            		.claim("userId", userId) 
	                .claim("role", role)
	                .setIssuedAt(new Date(System.currentTimeMillis()))
	                .setExpiration(new Date(System.currentTimeMillis() + ACCESS_TOKEN_EXPIRATION))
	                .signWith(getSignKey(), SignatureAlgorithm.HS256)
	                .compact();
	 }

	 public String generateRefreshToken(String email, Long userId) {
	    return Jwts.builder()
	            .setSubject(email)
	            .claim("userId", userId)
	            .setIssuedAt(new Date(System.currentTimeMillis()))
	            .setExpiration(new Date(System.currentTimeMillis() + REFRESH_TOKEN_EXPIRATION))
	            .signWith(getSignKey(), SignatureAlgorithm.HS256)
	            .compact();
	 }
	    
	 private Key getSignKey() {
	     byte[] keyBytes = Decoders.BASE64.decode(secret);
	     return Keys.hmacShaKeyFor(keyBytes);
	 }

	 public String extractEmail(String token) {
	     return extractClaim(token, Claims::getSubject);
	 }

	 public Long extractUserId(String token) {
	     final Claims claims = extractAllClaims(token);
	     return claims.get("userId", Long.class);
	 }

	 public String extractRole(String token) {
	     final Claims claims = extractAllClaims(token);
	     return claims.get("role", String.class);
	 }

	 public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
	     final Claims claims = extractAllClaims(token);
	     return claimsResolver.apply(claims);
	 }

	 private Claims extractAllClaims(String token) {
	     return Jwts.parserBuilder()
	             .setSigningKey(getSignKey())
	             .build()
	             .parseClaimsJws(token)
	             .getBody();
	 }

	 public Boolean validateToken(String token) {
	     try {
	         Jwts.parserBuilder().setSigningKey(getSignKey()).build().parseClaimsJws(token);
	         return !isTokenExpired(token);
	     } catch (Exception e) {
	         return false;
	     }
	 }

	 private Boolean isTokenExpired(String token) {
	     return extractExpiration(token).before(new Date());
	 }

	 public Date extractExpiration(String token) {
	     return extractClaim(token, Claims::getExpiration);
	 }
}
