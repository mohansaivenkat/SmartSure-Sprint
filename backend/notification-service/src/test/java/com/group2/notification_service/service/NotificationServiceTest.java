package com.group2.notification_service.service;

import com.group2.notification_service.service.impl.NotificationServiceImpl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;

import com.group2.notification_service.entity.Otp;
import com.group2.notification_service.exception.OtpException;
import com.group2.notification_service.repository.OtpRepository;

import jakarta.mail.internet.MimeMessage;

@ExtendWith(MockitoExtension.class)
public class NotificationServiceTest {

    @Mock private OtpRepository otpRepository;
    @Mock private JavaMailSender javaMailSender;
    @Mock private RestTemplate restTemplate;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(notificationService, "apiKey", "test-api-key");
        ReflectionTestUtils.setField(notificationService, "senderEmail", "sender@test.com");
        ReflectionTestUtils.setField(notificationService, "smtpUsername", "smtp@test.com");
        ReflectionTestUtils.setField(notificationService, "restTemplate", restTemplate);
    }

    @Test
    void testSendOtp_Success() {
        when(restTemplate.postForObject(anyString(), any(), eq(String.class))).thenReturn("OK");
        
        notificationService.sendOtp("test@test.com");
        
        verify(otpRepository, times(1)).deleteByEmail("test@test.com");
        verify(otpRepository, times(1)).save(any(Otp.class));
        verify(restTemplate, times(1)).postForObject(anyString(), any(HttpEntity.class), eq(String.class));
    }

    @Test
    void testSendOtp_RestFailure() {
        when(restTemplate.postForObject(anyString(), any(), eq(String.class))).thenThrow(new RuntimeException("API Error"));
        assertThrows(RuntimeException.class, () -> notificationService.sendOtp("test@test.com"));
    }

    @Test
    void testVerifyOtp_Success() {
        Otp otp = new Otp();
        otp.setEmail("test@test.com");
        otp.setOtp("123456");
        otp.setExpiryTime(LocalDateTime.now().plusMinutes(10));
        
        when(otpRepository.findByEmail("test@test.com")).thenReturn(Optional.of(otp));

        boolean result = notificationService.verifyOtp("test@test.com", "123456");
        assertTrue(result);
        assertTrue(otp.isVerified());
        verify(otpRepository, times(1)).save(otp);
    }

    @Test
    void testVerifyOtp_NotFound() {
        when(otpRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        assertThrows(OtpException.class, () -> notificationService.verifyOtp("ghost@test.com", "123"));
    }

    @Test
    void testVerifyOtp_Expired() {
        Otp otp = new Otp();
        otp.setExpiryTime(LocalDateTime.now().minusMinutes(1));
        when(otpRepository.findByEmail(anyString())).thenReturn(Optional.of(otp));

        assertThrows(OtpException.class, () -> notificationService.verifyOtp("test@test.com", "123"));
    }

    @Test
    void testVerifyOtp_WrongOtp() {
        Otp otp = new Otp();
        otp.setOtp("123456");
        otp.setExpiryTime(LocalDateTime.now().plusMinutes(10));
        when(otpRepository.findByEmail(anyString())).thenReturn(Optional.of(otp));

        assertThrows(OtpException.class, () -> notificationService.verifyOtp("test@test.com", "wrong"));
    }

    @Test
    void testIsOtpVerified() {
        Otp otp = new Otp();
        otp.setVerified(true);
        when(otpRepository.findByEmail("test@test.com")).thenReturn(Optional.of(otp));
        assertTrue(notificationService.isOtpVerified("test@test.com"));

        when(otpRepository.findByEmail("other@test.com")).thenReturn(Optional.empty());
        assertFalse(notificationService.isOtpVerified("other@test.com"));
    }

    @Test
    void testMarkOtpAsUsed() {
        notificationService.markOtpAsUsed("test@test.com");
        verify(otpRepository, times(1)).deleteByEmail("test@test.com");
    }

    @Test
    void testSendGeneralEmail_Success() {
        MimeMessage mimeMessage = mock(MimeMessage.class);
        when(javaMailSender.createMimeMessage()).thenReturn(mimeMessage);

        notificationService.sendGeneralEmail("to@test.com", "Sub", "Body");

        verify(javaMailSender, times(1)).send(mimeMessage);
    }

    @Test
    void testSendGeneralEmail_Failure() {
        when(javaMailSender.createMimeMessage()).thenThrow(new RuntimeException("Mail server down"));
        assertThrows(RuntimeException.class, () -> notificationService.sendGeneralEmail("to@test.com", "S", "B"));
    }
}
