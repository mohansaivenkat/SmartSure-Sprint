package com.group2.notification_service.service;

import org.springframework.scheduling.annotation.Async;

public interface INotificationService {
    @Async
    void sendOtp(String email);
    
    boolean verifyOtp(String email, String otp);
    
    @Async
    void sendGeneralEmail(String to, String subject, String body);
    
    boolean isOtpVerified(String email);
    
    void markOtpAsUsed(String email);
}
