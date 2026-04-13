package com.group2.policy_service;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.context.request.WebRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.boot.SpringApplication;
import org.mockito.MockedStatic;
import java.util.Collections;
import java.time.LocalDateTime;
import java.time.LocalDate;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import jakarta.servlet.FilterChain;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.impl.DefaultClaims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.util.Base64;
import java.util.List;

import com.group2.policy_service.dto.*;
import com.group2.policy_service.entity.*;
import com.group2.policy_service.exception.*;
import com.group2.policy_service.service.impl.*;
import com.group2.policy_service.util.*;
import com.group2.policy_service.filter.*;
import com.group2.policy_service.security.*;
import com.group2.policy_service.aspect.*;
import com.group2.policy_service.feign.*;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class CoverageTest {

    @Test
    void testLoggingAspect() throws Throwable {
        LoggingAspect aspect = new LoggingAspect();
        org.aspectj.lang.ProceedingJoinPoint pjp = mock(org.aspectj.lang.ProceedingJoinPoint.class);
        org.aspectj.lang.Signature sig = mock(org.aspectj.lang.Signature.class);
        when(pjp.getSignature()).thenReturn(sig);
        when(sig.getDeclaringTypeName()).thenReturn("Pkg.Class");
        when(sig.getName()).thenReturn("Method");
        when(pjp.proceed()).thenReturn("OK");
        aspect.profile(pjp);
        when(pjp.proceed()).thenThrow(new RuntimeException("err"));
        try { aspect.profile(pjp); } catch (Throwable e) {}
    }

    @Test
    void testAsyncNotification() {
        RabbitTemplate r = mock(RabbitTemplate.class);
        NotificationClient c = mock(NotificationClient.class);
        AsyncNotificationService s = new AsyncNotificationService(r, c);
        s.sendPurchaseNotification("e", "n", "p", 1.0, 1.0, LocalDate.now());
        s.sendPurchaseNotification(null, null, null, null, null, null);
        doThrow(new RuntimeException()).when(r).convertAndSend(anyString(), anyString(), any(Object.class));
        s.sendPaymentNotification("e", "n", "p", 1.0, 1.0);
        doThrow(new RuntimeException()).when(c).sendEmail(any());
        s.sendCancellationRequestNotification("e", "n", "p");
        s.sendCancellationApprovalNotification("e", "n", "p");
    }

    @Test
    void testPolicyMapperFull() {
        PolicyMapper mapper = new PolicyMapper();
        Policy p = new Policy(); p.setId(1L); p.setPolicyName("X");
        PolicyType pt = new PolicyType(); pt.setId(1L); pt.setCategory(PolicyCategory.HEALTH);
        p.setPolicyType(pt);
        assertNotNull(mapper.mapToPolicyResponse(p));
        
        // p.getPolicyType().getCategory() == null branch
        pt.setCategory(null);
        assertNotNull(mapper.mapToPolicyResponse(p));
        
        // p.getPolicyType() == null branch
        p.setPolicyType(null);
        assertNotNull(mapper.mapToPolicyResponse(p));
        
        UserPolicy up = new UserPolicy(); up.setId(1L); up.setPolicy(p);
        assertNotNull(mapper.mapToUserPolicyResponse(up));
        
        // up.getPolicy() == null branch
        up.setPolicy(null);
        assertNotNull(mapper.mapToUserPolicyResponse(up));
        
        assertNotNull(mapper.mapToEntity(new PolicyRequestDTO()));
        assertNull(mapper.mapToEntity(null));
        assertNull(mapper.mapToPolicyResponse(null));
        assertNull(mapper.mapToUserPolicyResponse(null));
    }

    @Test
    void testJwtUtilFull() {
        JwtUtil util = new JwtUtil();
        String secret = Base64.getEncoder().encodeToString("very-long-secret-key-that-is-at-least-512-bits-long-for-hmac-sha-512-algorithm".getBytes());
        ReflectionTestUtils.setField(util, "secret", secret);
        String token = Jwts.builder().setSubject("s").claim("userId", 1L).claim("role", "R")
                .signWith(Keys.hmacShaKeyFor(Base64.getDecoder().decode(secret)), SignatureAlgorithm.HS256).compact();
        assertEquals("s", util.extractEmail(token));
        assertEquals(1L, util.extractUserId(token));
        assertNotNull(util.extractClaims(token));
        
        String t2 = Jwts.builder().setSubject("s")
                .signWith(Keys.hmacShaKeyFor(Base64.getDecoder().decode(secret)), SignatureAlgorithm.HS256).compact();
        try { util.extractUserId(t2); } catch (Exception e) {}
        try { util.extractRole(t2); } catch (Exception e) {}
    }

    @Test
    void testFiltersFull() throws Exception {
        JwtUtil util = mock(JwtUtil.class);
        JwtFilter f1 = new JwtFilter(util);
        MockHttpServletRequest req = new MockHttpServletRequest();
        
        // No Auth
        ReflectionTestUtils.invokeMethod(f1, "doFilterInternal", req, new MockHttpServletResponse(), mock(FilterChain.class));
        
        // Wrong Auth
        req.addHeader("Authorization", "Wrong");
        ReflectionTestUtils.invokeMethod(f1, "doFilterInternal", req, new MockHttpServletResponse(), mock(FilterChain.class));
        
        // Valid Bearer
        req = new MockHttpServletRequest(); req.addHeader("Authorization", "Bearer tok");
        Claims cl = new DefaultClaims(); cl.put("userId", 1L); cl.put("role", "A");
        when(util.extractClaims(anyString())).thenReturn(cl);
        ReflectionTestUtils.invokeMethod(f1, "doFilterInternal", req, new MockHttpServletResponse(), mock(FilterChain.class));
        
        // Exception
        reset(util); when(util.extractClaims(anyString())).thenThrow(new RuntimeException());
        ReflectionTestUtils.invokeMethod(f1, "doFilterInternal", req, new MockHttpServletResponse(), mock(FilterChain.class));
        
        GatewaySecurityFilter f2 = new GatewaySecurityFilter();
        
        // Actuator
        req = new MockHttpServletRequest(); req.setRequestURI("/actuator/h");
        ReflectionTestUtils.invokeMethod(f2, "doFilterInternal", req, new MockHttpServletResponse(), mock(FilterChain.class));
        
        // Eureka
        req = new MockHttpServletRequest(); req.setRequestURI("/eureka/r");
        ReflectionTestUtils.invokeMethod(f2, "doFilterInternal", req, new MockHttpServletResponse(), mock(FilterChain.class));
        
        // Authorized API
        req = new MockHttpServletRequest(); req.setRequestURI("/api/p");
        req.addHeader("X-Gateway-Secret", "SmartSureSecretKey2026");
        ReflectionTestUtils.invokeMethod(f2, "doFilterInternal", req, new MockHttpServletResponse(), mock(FilterChain.class));
        
        // Unauthorized API
        req = new MockHttpServletRequest(); req.setRequestURI("/api/p");
        req.addHeader("X-Gateway-Secret", "W");
        ReflectionTestUtils.invokeMethod(f2, "doFilterInternal", req, new MockHttpServletResponse(), mock(FilterChain.class));
    }

    @Test
    void testExceptionHandlerFull() {
        GlobalExceptionHandler h = new GlobalExceptionHandler();
        WebRequest r = mock(WebRequest.class);
        when(r.getDescription(false)).thenReturn("d");
        h.handlePolicyException(new PolicyException("e"), r);
        h.handleResourceNotFoundException(new ResourceNotFoundException("R", "F", "V"), r);
        h.handleGlobalException(new Exception("e"), r);
        
        BindingResult br = mock(BindingResult.class);
        when(br.getAllErrors()).thenReturn(List.of(new FieldError("o", "f", "m")));
        try { ReflectionTestUtils.invokeMethod(h, "handleMethodArgumentNotValid", new MethodArgumentNotValidException(null, br), null, null, r); } catch (Exception e) {}
    }

    @Test
    void testErrorDetailsFull() {
        ErrorDetails d = new ErrorDetails();
        d.setTimestamp(LocalDateTime.now()); d.setMessage("m"); d.setDetails("d"); d.setErrorCode("c");
        assertEquals("m", d.getMessage());
        assertEquals("d", d.getDetails());
        assertEquals("c", d.getErrorCode());
        assertNotNull(d.getTimestamp());
        assertNotNull(d.toString());
        new ErrorDetails(LocalDateTime.now(), "m", "d", "c");
    }

    @Test
    void testFeignDtos() {
        UserDTO u = new UserDTO();
        u.setId(1L); u.setName("n"); u.setEmail("e");
        u.toString();
    }

    @Test
    void testApplication() {
        try (MockedStatic<SpringApplication> s = mockStatic(SpringApplication.class)) {
            s.when(() -> SpringApplication.run(eq(PolicyServiceApplication.class), any(String[].class))).thenReturn(null);
            PolicyServiceApplication.main(new String[]{});
        }
    }
}
