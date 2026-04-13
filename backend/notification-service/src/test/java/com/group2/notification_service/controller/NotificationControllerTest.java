package com.group2.notification_service.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import com.group2.notification_service.dto.EmailRequest;
import com.group2.notification_service.service.INotificationService;

@ExtendWith(MockitoExtension.class)
public class NotificationControllerTest {

    @Mock
    private INotificationService notificationService;

    @InjectMocks
    private NotificationController controller;

    @Test
    void testSendOtp() {
        doNothing().when(notificationService).sendOtp(anyString());
        ResponseEntity<String> res = controller.sendOtp("test@test.com");
        assertEquals(200, res.getStatusCode().value());
        assertEquals("OTP sent to email", res.getBody());
    }

    @Test
    void testVerifyOtp() {
        when(notificationService.verifyOtp("test@test.com", "123456")).thenReturn(true);
        ResponseEntity<String> res = controller.verifyOtp("test@test.com", "123456");
        assertEquals(200, res.getStatusCode().value());
        assertEquals("OTP verified successfully", res.getBody());
    }

    @Test
    void testIsOtpVerified() {
        when(notificationService.isOtpVerified("test@test.com")).thenReturn(true);
        ResponseEntity<Boolean> res = controller.isOtpVerified("test@test.com");
        assertEquals(200, res.getStatusCode().value());
        assertEquals(true, res.getBody());
    }

    @Test
    void testMarkOtpAsUsed() {
        doNothing().when(notificationService).markOtpAsUsed("test@test.com");
        ResponseEntity<Void> res = controller.markOtpAsUsed("test@test.com");
        assertEquals(200, res.getStatusCode().value());
    }

    @Test
    void testSendEmail() {
        doNothing().when(notificationService).sendGeneralEmail(anyString(), anyString(), anyString());
        EmailRequest req = new EmailRequest();
        req.setTo("test@test.com");
        req.setSubject("Test");
        req.setBody("Hello");
        ResponseEntity<String> res = controller.sendEmail(req);
        assertEquals(200, res.getStatusCode().value());
    }
}
