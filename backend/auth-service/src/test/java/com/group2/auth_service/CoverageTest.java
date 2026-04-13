package com.group2.auth_service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.context.request.WebRequest;
import jakarta.servlet.FilterChain;
import java.security.Key;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.Signature;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import com.group2.auth_service.util.AuthMapper;
import com.group2.auth_service.filter.GatewaySecurityFilter;
import com.group2.auth_service.aspect.LoggingAspect;
import com.group2.auth_service.exception.OtpException;
import com.group2.auth_service.exception.UserAlreadyExistsException;
import com.group2.auth_service.exception.ErrorDetails;
import com.group2.auth_service.exception.GlobalExceptionHandler;
import com.group2.auth_service.dto.*;
import com.group2.auth_service.entity.*;
import com.group2.auth_service.security.*;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class CoverageTest {

    // A valid base64-encoded secret
    private static final String VALID_SECRET = "U21hcnRTdXJlSW5zdXJhbmNlTWFuYWdlbWVudFN5c3RlbVNlY3JldEtleTIwMjZGb3JKV1RTZWN1cml0eQ==";

    private String generateRealToken(boolean expired) {
        byte[] keyBytes = Decoders.BASE64.decode(VALID_SECRET);
        Key key = Keys.hmacShaKeyFor(keyBytes);
        long exp = expired ? -1000L : (1000L * 60 * 60);
        return Jwts.builder()
                .setSubject("test@test.com")
                .claim("userId", 1L)
                .claim("role", "CUSTOMER")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + exp))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // ---- AuthMapper ----
    @Test
    void testAuthMapper_allBranches() {
        AuthMapper mapper = new AuthMapper();

        assertNull(mapper.mapToUser(null));

        RegisterRequest req = new RegisterRequest();
        req.setEmail("  Test@Test.COM  ");
        req.setName("N"); req.setPhone("1"); req.setAddress("A");
        assertEquals("test@test.com", mapper.mapToUser(req).getEmail());

        // null email branch
        req.setEmail(null);
        assertNull(mapper.mapToUser(req).getEmail());

        // updateUserFromRequest - both null branches
        mapper.updateUserFromRequest(null, new User());
        mapper.updateUserFromRequest(new UserProfileRequest(), null);
        mapper.updateUserFromRequest(new UserProfileRequest(), new User());

        // mapToResponse - null + full
        assertNull(mapper.mapToResponse(null));
        User user = new User();
        user.setId(1L); user.setName("N"); user.setEmail("e"); user.setPhone("p"); user.setAddress("a"); user.setRole(Role.CUSTOMER);
        assertEquals(1L, mapper.mapToResponse(user).getId());
    }

    // ---- LoggingAspect ----
    @Test
    void testLoggingAspect() throws Throwable {
        LoggingAspect aspect = new LoggingAspect();
        ProceedingJoinPoint pjp = mock(ProceedingJoinPoint.class);
        Signature sig = mock(Signature.class);
        when(pjp.getSignature()).thenReturn(sig);
        when(sig.getDeclaringTypeName()).thenReturn("Pkg");
        when(sig.getName()).thenReturn("method");
        when(pjp.proceed()).thenReturn("OK");
        aspect.profile(pjp);
        when(pjp.proceed()).thenThrow(new RuntimeException("err"));
        try { aspect.profile(pjp); } catch (Throwable ignored) {}
    }

    // ---- GatewaySecurityFilter ----
    @Test
    void testGatewayFilter_allBranches() throws Exception {
        GatewaySecurityFilter filter = new GatewaySecurityFilter();
        MockHttpServletResponse res = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        // actuator bypass
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setRequestURI("/actuator/health");
        ReflectionTestUtils.invokeMethod(filter, "doFilterInternal", req, res, chain);

        // eureka bypass
        req = new MockHttpServletRequest(); req.setRequestURI("/eureka/apps");
        ReflectionTestUtils.invokeMethod(filter, "doFilterInternal", req, res, chain);

        // valid secret (with whitespace to hit trim() branch)
        req = new MockHttpServletRequest(); req.setRequestURI("/api/auth/login");
        req.addHeader("X-Gateway-Secret", "  SmartSureSecretKey2026  ");
        ReflectionTestUtils.invokeMethod(filter, "doFilterInternal", req, res, chain);
        verify(chain, times(3)).doFilter(any(), any());

        // wrong (non-null) secret → hits the else-if branch
        req = new MockHttpServletRequest(); req.setRequestURI("/api/auth/login");
        res = new MockHttpServletResponse();
        req.addHeader("X-Gateway-Secret", "WRONG_SECRET");
        ReflectionTestUtils.invokeMethod(filter, "doFilterInternal", req, res, chain);
        assertEquals(401, res.getStatus());

        // null secret → 401
        req = new MockHttpServletRequest(); req.setRequestURI("/api/auth/register");
        res = new MockHttpServletResponse();
        ReflectionTestUtils.invokeMethod(filter, "doFilterInternal", req, res, chain);
        assertEquals(401, res.getStatus());
    }

    // ---- JwtFilter ----
    @Test
    void testJwtFilter_allBranches() throws Exception {
        JwtUtil util = mock(JwtUtil.class);
        JwtFilter filter = new JwtFilter(util);
        MockHttpServletResponse res = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        // no Authorization header
        MockHttpServletRequest req = new MockHttpServletRequest();
        ReflectionTestUtils.invokeMethod(filter, "doFilterInternal", req, res, chain);

        // Bearer token – valid, role already has ROLE_ prefix
        req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Bearer valid.token");
        when(util.validateToken("valid.token")).thenReturn(true);
        when(util.extractUserId("valid.token")).thenReturn(1L);
        when(util.extractRole("valid.token")).thenReturn("ROLE_ADMIN");
        ReflectionTestUtils.invokeMethod(filter, "doFilterInternal", req, res, chain);

        // Bearer token – valid, role without ROLE_ prefix (hits the else branch)
        req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Bearer valid.token");
        when(util.extractRole("valid.token")).thenReturn("CUSTOMER");
        ReflectionTestUtils.invokeMethod(filter, "doFilterInternal", req, res, chain);

        // Bearer token – validate returns false
        req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Bearer bad.token");
        when(util.validateToken("bad.token")).thenReturn(false);
        ReflectionTestUtils.invokeMethod(filter, "doFilterInternal", req, res, chain);

        // Bearer token – exception during processing
        req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Bearer throws.token");
        when(util.validateToken("throws.token")).thenThrow(new RuntimeException("JWT error"));
        ReflectionTestUtils.invokeMethod(filter, "doFilterInternal", req, res, chain);

        // Non-bearer auth header (hits the startsWith check false branch)
        req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Basic dXNlcjpwYXNz");
        ReflectionTestUtils.invokeMethod(filter, "doFilterInternal", req, res, chain);

        // userId is non-null but role is null → inner if(role) fails
        req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Bearer has.userid.no.role");
        when(util.validateToken("has.userid.no.role")).thenReturn(true);
        when(util.extractUserId("has.userid.no.role")).thenReturn(1L);
        when(util.extractRole("has.userid.no.role")).thenReturn(null);
        ReflectionTestUtils.invokeMethod(filter, "doFilterInternal", req, res, chain);

        // userId or role is null → inner if(userId) fails
        req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Bearer null.ids");
        when(util.validateToken("null.ids")).thenReturn(true);
        when(util.extractUserId("null.ids")).thenReturn(null);
        when(util.extractRole("null.ids")).thenReturn(null);
        ReflectionTestUtils.invokeMethod(filter, "doFilterInternal", req, res, chain);
    }

    // ---- JwtUtil (with real token generation) ----
    @Test
    void testJwtUtil_realToken() {
        JwtUtil util = new JwtUtil();
        ReflectionTestUtils.setField(util, "secret", VALID_SECRET);

        // Generate and validate a real token
        String token = util.generateToken("test@test.com", 1L, "CUSTOMER");
        assertTrue(util.validateToken(token));
        assertEquals("test@test.com", util.extractEmail(token));
        assertEquals(1L, util.extractUserId(token));
        assertEquals("CUSTOMER", util.extractRole(token));
        assertNotNull(util.extractExpiration(token));

        // Refresh token
        String refresh = util.generateRefreshToken("test@test.com", 1L);
        assertTrue(util.validateToken(refresh));

        // Invalid token → validateToken returns false
        assertFalse(util.validateToken("invalid.token.xyz"));

        // Expired token (uses helper)
        String expired = generateRealToken(true);
        ReflectionTestUtils.setField(util, "secret", VALID_SECRET);
        assertFalse(util.validateToken(expired));
    }

    // ---- Exception classes ----
    @Test
    void testExceptions() {
        GlobalExceptionHandler h = new GlobalExceptionHandler();
        WebRequest wr = mock(WebRequest.class);
        when(wr.getDescription(false)).thenReturn("uri=/api/test");

        h.handleUserAlreadyExistsException(new UserAlreadyExistsException("EXISTS"), wr);
        h.handleOtpException(new OtpException("OTP_FAIL"), wr);
        h.handleGlobalException(new RuntimeException("BOOM"), wr);

        BindingResult br = mock(BindingResult.class);
        when(br.getAllErrors()).thenReturn(List.of(new FieldError("obj", "field", "msg")));
        try {
            ReflectionTestUtils.invokeMethod(h, "handleMethodArgumentNotValid",
                    new MethodArgumentNotValidException(null, br), null, null, wr);
        } catch (Exception ignored) {}

        ErrorDetails ed = new ErrorDetails(LocalDateTime.now(), "Message", "Details", "CODE");
        assertNotNull(ed.getTimestamp());
        assertNotNull(ed.getMessage());
        assertNotNull(ed.getDetails());
        assertEquals("CODE", ed.getErrorCode());
        ed.setTimestamp(LocalDateTime.now());
        ed.setMessage("New"); ed.setDetails("New"); ed.setErrorCode("NEW");
        assertEquals("NEW", ed.getErrorCode());
        assertNotNull(ed.toString());
        // default constructor
        ErrorDetails empty = new ErrorDetails();
        assertNull(empty.getMessage());
    }
}
