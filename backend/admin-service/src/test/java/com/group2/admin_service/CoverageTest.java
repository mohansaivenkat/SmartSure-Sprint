package com.group2.admin_service;

import java.lang.reflect.Method;
import java.time.LocalDateTime;

import jakarta.servlet.FilterChain;

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

import com.group2.admin_service.aspect.LoggingAspect;
import com.group2.admin_service.controller.AdminController;
import com.group2.admin_service.dto.ClaimStatusDTO;
import com.group2.admin_service.dto.PolicyRequestDTO;
import com.group2.admin_service.dto.PolicyStatsDTO;
import com.group2.admin_service.dto.ReportResponse;
import com.group2.admin_service.exception.AdminException;
import com.group2.admin_service.exception.ErrorDetails;
import com.group2.admin_service.exception.GlobalExceptionHandler;
import com.group2.admin_service.filter.GatewaySecurityFilter;
import com.group2.admin_service.filter.HeaderAuthenticationFilter;
import com.group2.admin_service.util.AdminMapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CoverageTest {

    @Test
    void testAdminMapper() {
        AdminMapper mapper = new AdminMapper();
        ClaimStatusDTO cs = new ClaimStatusDTO(); cs.setTotalClaims(10);
        PolicyStatsDTO ps = new PolicyStatsDTO(); ps.setTotalPolicies(5L);
        ReportResponse r = mapper.mapToReportResponse(cs, ps);
        assertEquals(10, r.getTotalClaims());
        assertEquals(5L, r.getTotalPolicies());
        
        assertNotNull(mapper.mapToReportResponse(null, null));
    }

    @Test
    void testLoggingAspect() throws Throwable {
        LoggingAspect aspect = new LoggingAspect();
        ProceedingJoinPoint pjp = mock(ProceedingJoinPoint.class);
        Signature sig = mock(Signature.class);
        when(pjp.getSignature()).thenReturn(sig);
        when(sig.getDeclaringTypeName()).thenReturn("Pkg.Class");
        when(sig.getName()).thenReturn("Method");
        when(pjp.proceed()).thenReturn("OK");
        aspect.profile(pjp);
        
        when(pjp.proceed()).thenThrow(new RuntimeException("err"));
        try { aspect.profile(pjp); } catch (Throwable e) {}
    }

    @Test
    void testFilters() throws Exception {
        GatewaySecurityFilter f1 = new GatewaySecurityFilter();
        MockHttpServletRequest req = new MockHttpServletRequest();
        MockHttpServletResponse res = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);
        
        req.setRequestURI("/actuator/health");
        ReflectionTestUtils.invokeMethod(f1, "doFilterInternal", req, res, chain);
        verify(chain).doFilter(req, res);

        req = new MockHttpServletRequest();
        req.setRequestURI("/eureka/apps");
        res = new MockHttpServletResponse();
        chain = mock(FilterChain.class);
        ReflectionTestUtils.invokeMethod(f1, "doFilterInternal", req, res, chain);
        verify(chain).doFilter(req, res);

        req = new MockHttpServletRequest();
        req.setRequestURI("/api/admin");
        res = new MockHttpServletResponse();
        chain = mock(FilterChain.class);
        ReflectionTestUtils.invokeMethod(f1, "doFilterInternal", req, res, chain);
        assertEquals(401, res.getStatus());
        assertTrue(res.getContentAsString().contains("Direct access not allowed"));

        req = new MockHttpServletRequest();
        req.setRequestURI("/api/admin");
        req.addHeader("X-Gateway-Secret", "Invalid");
        res = new MockHttpServletResponse();
        chain = mock(FilterChain.class);
        ReflectionTestUtils.invokeMethod(f1, "doFilterInternal", req, res, chain);
        assertEquals(401, res.getStatus());

        req = new MockHttpServletRequest();
        req.setRequestURI("/api/admin");
        req.addHeader("X-Gateway-Secret", "  SmartSureSecretKey2026  ");
        res = new MockHttpServletResponse();
        chain = mock(FilterChain.class);
        ReflectionTestUtils.invokeMethod(f1, "doFilterInternal", req, res, chain);
        verify(chain).doFilter(req, res);

        req = new MockHttpServletRequest();
        req.setRequestURI("/api/admin");
        req.addHeader("X-Gateway-Secret", "SmartSureSecretKey2026");
        res = new MockHttpServletResponse();
        chain = mock(FilterChain.class);
        ReflectionTestUtils.invokeMethod(f1, "doFilterInternal", req, res, chain);
        verify(chain).doFilter(req, res);

        HeaderAuthenticationFilter f2 = new HeaderAuthenticationFilter();
        req = new MockHttpServletRequest();
        req.addHeader("X-User-Id", "1");
        req.addHeader("X-User-Role", "ADMIN");
        res = new MockHttpServletResponse();
        chain = mock(FilterChain.class);
        ReflectionTestUtils.invokeMethod(f2, "doFilterInternal", req, res, chain);
        verify(chain).doFilter(req, res);

        req = new MockHttpServletRequest();
        req.addHeader("X-User-Id", "2");
        req.addHeader("X-User-Role", "ROLE_ADMIN");
        res = new MockHttpServletResponse();
        chain = mock(FilterChain.class);
        ReflectionTestUtils.invokeMethod(f2, "doFilterInternal", req, res, chain);
        verify(chain).doFilter(req, res);

        req = new MockHttpServletRequest();
        req.addHeader("X-User-Role", "role_admin");
        res = new MockHttpServletResponse();
        chain = mock(FilterChain.class);
        ReflectionTestUtils.invokeMethod(f2, "doFilterInternal", req, res, chain);
        verify(chain).doFilter(req, res);

        req = new MockHttpServletRequest();
        req.addHeader("X-User-Role", "USER");
        res = new MockHttpServletResponse();
        chain = mock(FilterChain.class);
        ReflectionTestUtils.invokeMethod(f2, "doFilterInternal", req, res, chain);
        verify(chain).doFilter(req, res);

        req = new MockHttpServletRequest();
        req.addHeader("X-User-Role", "ADMIN");
        req.addHeader("X-User-Id", "not-a-number");
        res = new MockHttpServletResponse();
        chain = mock(FilterChain.class);
        ReflectionTestUtils.invokeMethod(f2, "doFilterInternal", req, res, chain);
        verify(chain).doFilter(req, res);

        req = new MockHttpServletRequest();
        res = new MockHttpServletResponse();
        chain = mock(FilterChain.class);
        ReflectionTestUtils.invokeMethod(f2, "doFilterInternal", req, res, chain);
        verify(chain).doFilter(req, res);
    }

    @Test
    void testExceptions() throws Exception {
        GlobalExceptionHandler h = new GlobalExceptionHandler();
        WebRequest r = mock(WebRequest.class);
        when(r.getDescription(false)).thenReturn("desc");
        
        ResponseEntity<ErrorDetails> adminEx = h.handleAdminException(new AdminException("err"), r);
        assertEquals(HttpStatus.BAD_REQUEST, adminEx.getStatusCode());
        assertEquals("ADMIN_ERROR", adminEx.getBody().getErrorCode());

        ResponseEntity<ErrorDetails> globalEx = h.handleGlobalException(new RuntimeException("err"), r);
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, globalEx.getStatusCode());
        assertEquals("INTERNAL_SERVER_ERROR", globalEx.getBody().getErrorCode());

        Method m = AdminController.class.getMethod("createPolicy", PolicyRequestDTO.class);
        MethodParameter parameter = new MethodParameter(m, 0);
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(new PolicyRequestDTO(), "dto");
        bindingResult.addError(new FieldError("dto", "policyName", "must not be blank"));
        MethodArgumentNotValidException notValid = new MethodArgumentNotValidException(parameter, bindingResult);

        ResponseEntity<Object> validation = ReflectionTestUtils.invokeMethod(h,
                "handleMethodArgumentNotValid",
                notValid,
                new HttpHeaders(),
                HttpStatusCode.valueOf(400),
                r);
        assertEquals(HttpStatus.BAD_REQUEST, validation.getStatusCode());
        ErrorDetails body = (ErrorDetails) validation.getBody();
        assertEquals("BAD_REQUEST", body.getErrorCode());
        assertEquals("Validation Failed", body.getMessage());
    }

    @Test
    void testErrorDetailsBean() {
        ErrorDetails e = new ErrorDetails();
        LocalDateTime now = LocalDateTime.now();
        e.setTimestamp(now);
        e.setMessage("m");
        e.setDetails("d");
        e.setErrorCode("E");
        assertEquals(now, e.getTimestamp());
        assertEquals("m", e.getMessage());
        assertEquals("d", e.getDetails());
        assertEquals("E", e.getErrorCode());

        ErrorDetails e2 = new ErrorDetails(now, "m2", "d2", "E2");
        assertTrue(e2.toString().contains("m2"));
    }

    @Test
    void testAdminExceptionConstructor() {
        AdminException ex = new AdminException("msg");
        assertEquals("msg", ex.getMessage());
    }
}
