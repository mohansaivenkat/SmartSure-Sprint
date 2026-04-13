package com.group2.notification_service;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.http.ResponseEntity;
import java.util.Collections;
import java.util.Map;
import java.util.HashMap;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.boot.SpringApplication;
import org.mockito.MockedStatic;
import org.springframework.web.context.request.WebRequest;
import org.springframework.http.HttpStatus;

import com.group2.notification_service.aspect.LoggingAspect;
import com.group2.notification_service.controller.NotificationController;
import com.group2.notification_service.dto.NotificationEvent;
import com.group2.notification_service.dto.EmailRequest;
import com.group2.notification_service.exception.OtpException;
import com.group2.notification_service.exception.ErrorDetails;
import com.group2.notification_service.exception.GlobalExceptionHandler;
import com.group2.notification_service.listener.NotificationEventListener;
import com.group2.notification_service.service.INotificationService;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class CoverageTest {

    @Test
    void testNotificationEventListener() {
        INotificationService service = mock(INotificationService.class);
        NotificationEventListener listener = new NotificationEventListener(service);
        NotificationEvent event = new NotificationEvent("test@test.com", "Sub", "Msg");
        
        listener.handleNotificationEvent(event);
        verify(service).sendGeneralEmail("test@test.com", "Sub", "Msg");
        
        doThrow(new RuntimeException("err")).when(service).sendGeneralEmail(any(), any(), any());
        listener.handleNotificationEvent(event); // covers catch block
    }

    @Test
    void testLoggingAspect() throws Throwable {
        LoggingAspect aspect = new LoggingAspect();
        org.aspectj.lang.ProceedingJoinPoint pjp = mock(org.aspectj.lang.ProceedingJoinPoint.class);
        org.aspectj.lang.Signature sig = mock(org.aspectj.lang.Signature.class);
        when(pjp.getSignature()).thenReturn(sig);
        when(sig.getName()).thenReturn("m");
        when(pjp.proceed()).thenReturn("r");
        assertEquals("r", aspect.profile(pjp));
        
        when(pjp.proceed()).thenThrow(new RuntimeException());
        assertThrows(RuntimeException.class, () -> aspect.profile(pjp));
    }

    @Test
    void testNotificationController() {
        INotificationService service = mock(INotificationService.class);
        NotificationController controller = new NotificationController(service);
        
        assertNotNull(controller.sendOtp("t@t.com"));
        assertNotNull(controller.verifyOtp("t@t.com", "123"));
        assertNotNull(controller.sendEmail(new EmailRequest()));
        assertNotNull(controller.isOtpVerified("t@t.com"));
        assertNotNull(controller.markOtpAsUsed("t@t.com"));
    }

    @Test
    void testGlobalExceptionHandler() {
        GlobalExceptionHandler h = new GlobalExceptionHandler();
        WebRequest r = mock(WebRequest.class);
        when(r.getDescription(false)).thenReturn("desc");
        
        assertNotNull(h.handleOtpException(new OtpException("e"), r));
        assertNotNull(h.handleGlobalException(new Exception("e"), r));
        
        BindingResult br = mock(BindingResult.class);
        when(br.getAllErrors()).thenReturn(Collections.singletonList(new FieldError("o", "f", "m")));
        assertNotNull(ReflectionTestUtils.invokeMethod(h, "handleMethodArgumentNotValid", new MethodArgumentNotValidException(null, br), null, null, r));
    }

    @Test
    void testErrorDetails() {
        ErrorDetails d = new ErrorDetails(java.time.LocalDateTime.now(), "m", "d", "c");
        d.setTimestamp(java.time.LocalDateTime.now());
        d.setMessage("m");
        d.setDetails("d");
        d.setErrorCode("c");
        assertEquals("m", d.getMessage());
        assertNotNull(d.getTimestamp());
        assertNotNull(d.getDetails());
        assertNotNull(d.getErrorCode());
        assertNotNull(d.toString());
        assertNotNull(new ErrorDetails());
    }

    @Test
    void testApplication() {
        assertNotNull(new NotificationServiceApplication());
        try (MockedStatic<SpringApplication> s = mockStatic(SpringApplication.class)) {
            s.when(() -> SpringApplication.run(eq(NotificationServiceApplication.class), any(String[].class))).thenReturn(null);
            NotificationServiceApplication.main(new String[]{});
        }
    }
}
