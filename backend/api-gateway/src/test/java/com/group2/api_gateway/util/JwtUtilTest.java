package com.group2.api_gateway.util;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class JwtUtilTest {

    private JwtUtil jwtUtil;
    private String secret = "U21hcnRTdXJlSW5zdXJhbmNlTWFuYWdlbWVudFN5c3RlbVNlY3JldEtleTIwMjZGb3JKV1RTZWN1cml0eQ==";
    private String validToken;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", secret);

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", 1L);
        claims.put("role", "ROLE_USER");

        byte[] keyBytes = Decoders.BASE64.decode(secret);
        Key key = Keys.hmacShaKeyFor(keyBytes);

        validToken = Jwts.builder()
                .setClaims(claims)
                .setSubject("test@test.com")
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 10))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    @Test
    void testValidateToken() {
        jwtUtil.validateToken(validToken); // Should not throw exception
    }

    @Test
    void testExtractEmail() {
        assertEquals("test@test.com", jwtUtil.extractEmail(validToken));
    }

    @Test
    void testExtractUserId() {
        assertEquals("1", jwtUtil.extractUserId(validToken));
    }

    @Test
    void testExtractRole() {
        assertEquals("ROLE_USER", jwtUtil.extractRole(validToken));
    }
}
