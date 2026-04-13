package com.group2.payment_service;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.context.request.WebRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.boot.SpringApplication;
import org.mockito.MockedStatic;
import java.util.Collections;
import java.time.LocalDateTime;

import com.group2.payment_service.dto.*;
import com.group2.payment_service.entity.*;
import com.group2.payment_service.exception.*;
import com.group2.payment_service.config.*;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class CoverageTest {

    @Test
    void testDtos() {
        PaymentRequest r = new PaymentRequest(1L, 2L, 100.0);
        r.setUserId(1L); r.setPolicyId(2L); r.setAmount(100.0);
        assertEquals(1L, r.getUserId());
        assertEquals(2L, r.getPolicyId());
        assertEquals(100.0, r.getAmount());

        PaymentVerifyRequest v = new PaymentVerifyRequest("o", "p", "s");
        v.setRazorpayOrderId("o"); v.setRazorpayPaymentId("p"); v.setRazorpaySignature("s");
        assertEquals("o", v.getRazorpayOrderId());
        assertEquals("p", v.getRazorpayPaymentId());
        assertEquals("s", v.getRazorpaySignature());

        PaymentResponse res = new PaymentResponse("o", "s", 10.0, "m");
        res.setOrderId("o2"); res.setStatus("s2"); res.setAmount(20.0); res.setMessage("m2");
        assertEquals("o2", res.getOrderId());
        assertEquals("s2", res.getStatus());
        assertEquals(20.0, res.getAmount());
        assertEquals("m2", res.getMessage());
        assertNotNull(new PaymentResponse());
    }

    @Test
    void testEntities() {
        Transaction t = new Transaction();
        t.setId(1L); t.setRazorpayOrderId("o"); t.setRazorpayPaymentId("p");
        t.setRazorpaySignature("s"); t.setUserId(2L); t.setPolicyId(3L);
        t.setAmount(10.0); t.setStatus("S"); 
        LocalDateTime now = LocalDateTime.now();
        t.setCreatedAt(now);
        assertEquals(1L, t.getId());
        assertEquals("o", t.getRazorpayOrderId());
        assertEquals("p", t.getRazorpayPaymentId());
        assertEquals("s", t.getRazorpaySignature());
        assertEquals(2L, t.getUserId());
        assertEquals(3L, t.getPolicyId());
        assertEquals(10.0, t.getAmount());
        assertEquals("S", t.getStatus());
        assertEquals(now, t.getCreatedAt());
        assertNotNull(t.toString());
        t.prePersist();

        User u = new User();
        u.setId(1L);
        assertEquals(1L, u.getId());

        Policy p = new Policy();
        p.setId(1L);
        assertEquals(1L, p.getId());
    }

    @Test
    void testExceptions() {
        assertNotNull(new PaymentException("e"));
        LocalDateTime now = LocalDateTime.now();
        ErrorDetails d = new ErrorDetails(now, "m", "d", "c");
        assertEquals("m", d.getMessage());
        assertEquals("d", d.getDetails());
        assertEquals("c", d.getErrorCode());
        assertEquals(now, d.getTimestamp());
        
        d.setTimestamp(now.plusDays(1));
        d.setMessage("m1");
        d.setDetails("d1");
        d.setErrorCode("c1");
        assertEquals("m1", d.getMessage());
        assertEquals("c1", d.getErrorCode());
        assertNotNull(d.getTimestamp());
        assertNotNull(new ErrorDetails());
        assertNotNull(d.toString());
    }

    @Test
    void testGlobalExceptionHandler() {
        GlobalExceptionHandler h = new GlobalExceptionHandler();
        WebRequest r = mock(WebRequest.class);
        when(r.getDescription(false)).thenReturn("desc");
        
        assertNotNull(h.handlePaymentException(new PaymentException("e"), r));
        assertNotNull(h.handleGlobalException(new Exception("e"), r));
        
        BindingResult br = mock(BindingResult.class);
        when(br.getAllErrors()).thenReturn(Collections.singletonList(new FieldError("o", "f", "m")));
        assertNotNull(ReflectionTestUtils.invokeMethod(h, "handleMethodArgumentNotValid", new MethodArgumentNotValidException(null, br), null, null, r));
    }

    @Test
    void testConfig() {
        assertNotNull(new SwaggerConfig().customOpenAPI());
        ReflectionTestUtils.invokeMethod(new SwaggerConfig(), "createAPIKeyScheme");
    }

    @Test
    void testApplication() {
        assertNotNull(new PaymentServiceApplication());
        try (MockedStatic<SpringApplication> s = mockStatic(SpringApplication.class)) {
            s.when(() -> SpringApplication.run(eq(PaymentServiceApplication.class), any(String[].class))).thenReturn(null);
            PaymentServiceApplication.main(new String[]{});
        }
    }
}
