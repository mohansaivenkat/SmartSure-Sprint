package com.group2.claims_service;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.List;

import jakarta.servlet.FilterChain;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.Signature;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.context.request.WebRequest;

import com.group2.claims_service.controller.ClaimController;
import com.group2.claims_service.dto.ClaimRequestDTO;
import com.group2.claims_service.entity.ClaimStatus;
import com.group2.claims_service.feign.UserDTO;
import com.group2.claims_service.feign.UserPolicyDTO;
import com.group2.claims_service.util.ClaimMapper;
import com.group2.claims_service.filter.GatewaySecurityFilter;
import com.group2.claims_service.aspect.LoggingAspect;
import com.group2.claims_service.exception.ClaimException;
import com.group2.claims_service.exception.ClaimNotFoundException;
import com.group2.claims_service.exception.ErrorDetails;
import com.group2.claims_service.exception.GlobalExceptionHandler;
import com.group2.claims_service.dto.*;
import com.group2.claims_service.entity.*;
import com.group2.claims_service.security.*;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class CoverageTest {

    private static final String VALID_SECRET = "U21hcnRTdXJlSW5zdXJhbmNlTWFuYWdlbWVudFN5c3RlbVNlY3JldEtleTIwMjZGb3JKV1RTZWN1cml0eQ==";

    // ---- ClaimMapper ----
    @Test
    void testClaimMapper() {
        ClaimMapper mapper = new ClaimMapper();
        assertNull(mapper.mapToResponse(null));
        assertNull(mapper.mapToEntity(null));
        Claim c = new Claim(); c.setId(1L); c.setClaimAmount(100.0);
        assertEquals(1L, mapper.mapToResponse(c).getClaimId());
        Claim noStatus = new Claim(); noStatus.setId(2L); noStatus.setClaimStatus(null);
        assertNull(mapper.mapToResponse(noStatus).getStatus());
        Claim withStatus = new Claim(); withStatus.setId(3L); withStatus.setClaimStatus(ClaimStatus.APPROVED);
        assertEquals("APPROVED", mapper.mapToResponse(withStatus).getStatus());
        ClaimRequestDTO req = new ClaimRequestDTO(); req.setClaimAmount(50.0);
        assertEquals(50.0, mapper.mapToEntity(req).getClaimAmount());
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

        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setRequestURI("/actuator/health");
        ReflectionTestUtils.invokeMethod(filter, "doFilterInternal", req, res, chain);

        req = new MockHttpServletRequest(); req.setRequestURI("/eureka/apps");
        ReflectionTestUtils.invokeMethod(filter, "doFilterInternal", req, res, chain);
        verify(chain, times(2)).doFilter(any(), any());

        req = new MockHttpServletRequest(); req.setRequestURI("/api/claims");
        req.addHeader("X-Gateway-Secret", "  SmartSureSecretKey2026  ");
        ReflectionTestUtils.invokeMethod(filter, "doFilterInternal", req, res, chain);
        verify(chain, times(3)).doFilter(any(), any());

        req = new MockHttpServletRequest(); req.setRequestURI("/api/claims");
        res = new MockHttpServletResponse();
        req.addHeader("X-Gateway-Secret", "WRONG");
        ReflectionTestUtils.invokeMethod(filter, "doFilterInternal", req, res, chain);
        assertEquals(401, res.getStatus());

        req = new MockHttpServletRequest(); req.setRequestURI("/api/claims");
        res = new MockHttpServletResponse();
        ReflectionTestUtils.invokeMethod(filter, "doFilterInternal", req, res, chain);
        assertEquals(401, res.getStatus());
    }

    // ---- JwtFilter (claims-service uses extractClaims, not validateToken) ----
    @Test
    void testJwtFilter_allBranches() throws Exception {
        JwtUtil util = mock(JwtUtil.class);
        JwtFilter filter = new JwtFilter(util);
        MockHttpServletResponse res = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        // no header
        MockHttpServletRequest req = new MockHttpServletRequest();
        ReflectionTestUtils.invokeMethod(filter, "doFilterInternal", req, res, chain);

        // non-Bearer
        req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Basic abc");
        ReflectionTestUtils.invokeMethod(filter, "doFilterInternal", req, res, chain);

        // valid token, userId and role present
        Claims mockClaims = mock(Claims.class);
        when(mockClaims.get("userId")).thenReturn("1");
        when(mockClaims.get("role")).thenReturn("ADMIN");
        req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Bearer valid.token");
        when(util.extractClaims("valid.token")).thenReturn(mockClaims);
        ReflectionTestUtils.invokeMethod(filter, "doFilterInternal", req, res, chain);

        // role null
        Claims nullRoleClaims = mock(Claims.class);
        when(nullRoleClaims.get("userId")).thenReturn("1");
        when(nullRoleClaims.get("role")).thenReturn(null);
        req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Bearer no.role.token");
        when(util.extractClaims("no.role.token")).thenReturn(nullRoleClaims);
        ReflectionTestUtils.invokeMethod(filter, "doFilterInternal", req, res, chain);

        // exception → 401
        req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Bearer bad.token");
        when(util.extractClaims("bad.token")).thenThrow(new RuntimeException("bad"));
        res = new MockHttpServletResponse();
        ReflectionTestUtils.invokeMethod(filter, "doFilterInternal", req, res, chain);
        assertEquals(401, res.getStatus());

        // userId claim null → parse path throws → 401
        Claims nullUserIdClaims = mock(Claims.class);
        when(nullUserIdClaims.get("userId")).thenReturn(null);
        req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Bearer null.uid");
        when(util.extractClaims("null.uid")).thenReturn(nullUserIdClaims);
        res = new MockHttpServletResponse();
        ReflectionTestUtils.invokeMethod(filter, "doFilterInternal", req, res, chain);
        assertEquals(401, res.getStatus());
    }

    // ---- JwtUtil ----
    @Test
    void testJwtUtil() {
        JwtUtil util = new JwtUtil();
        ReflectionTestUtils.setField(util, "secret", VALID_SECRET);
        try { util.extractEmail("invalid"); } catch (Exception ignored) {}
        try { util.extractUserId("invalid"); } catch (Exception ignored) {}
        try { util.extractRole("invalid"); } catch (Exception ignored) {}

        var key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(VALID_SECRET));
        String token = Jwts.builder()
                .setSubject("user@test.com")
                .claim("userId", 42L)
                .claim("role", "CUSTOMER")
                .signWith(key, io.jsonwebtoken.SignatureAlgorithm.HS256)
                .compact();
        assertEquals("user@test.com", util.extractEmail(token));
        assertEquals(42L, util.extractUserId(token));
        assertEquals("CUSTOMER", util.extractRole(token));
        assertNotNull(util.extractClaims(token));
    }

    @Test
    void feignDtos_roundTrip() {
        UserDTO u = new UserDTO();
        u.setId(1L); u.setEmail("a@b.com"); u.setName("N");
        assertEquals(1L, u.getId());
        assertEquals("a@b.com", u.getEmail());
        assertEquals("N", u.getName());
        UserDTO u2 = new UserDTO("x@y.com", "Z");
        assertEquals("x@y.com", u2.getEmail());

        UserPolicyDTO p = new UserPolicyDTO();
        p.setId(9L); p.setUserId(8L); p.setStatus("ACTIVE"); p.setPolicyName("Life");
        assertEquals(9L, p.getId());
        assertEquals(8L, p.getUserId());
        assertEquals("ACTIVE", p.getStatus());
        assertEquals("Life", p.getPolicyName());
    }

    // ---- Exception classes ----
    @Test
    void testExceptions() throws Exception {
        GlobalExceptionHandler h = new GlobalExceptionHandler();
        WebRequest r = mock(WebRequest.class);
        when(r.getDescription(false)).thenReturn("desc");

        h.handleClaimNotFoundException(new ClaimNotFoundException("NF"), r);
        h.handleClaimException(new ClaimException("ERR"), r);
        h.handleGlobalException(new Exception("ERR"), r);

        Method m = ClaimController.class.getMethod("initiateClaim", ClaimRequestDTO.class);
        MethodParameter parameter = new MethodParameter(m, 0);
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(new ClaimRequestDTO(), "dto");
        bindingResult.addError(new FieldError("dto", "userId", "required"));
        MethodArgumentNotValidException notValid = new MethodArgumentNotValidException(parameter, bindingResult);
        ResponseEntity<Object> validation = ReflectionTestUtils.invokeMethod(h,
                "handleMethodArgumentNotValid",
                notValid,
                new HttpHeaders(),
                HttpStatusCode.valueOf(400),
                r);
        assertEquals(HttpStatus.BAD_REQUEST, validation.getStatusCode());

        ErrorDetails ed = new ErrorDetails(LocalDateTime.now(), "m", "d", "c");
        assertNotNull(ed.getTimestamp()); assertNotNull(ed.getMessage());
        assertNotNull(ed.getDetails()); assertEquals("c", ed.getErrorCode());
        ed.setTimestamp(LocalDateTime.now()); ed.setMessage("x");
        ed.setDetails("x"); ed.setErrorCode("X");
        assertNotNull(ed.toString());
        ErrorDetails empty = new ErrorDetails();
        assertNull(empty.getMessage());
    }
}
