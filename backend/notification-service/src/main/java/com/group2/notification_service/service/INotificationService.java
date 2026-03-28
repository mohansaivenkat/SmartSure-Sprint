package com.group2.notification_service.service;

public interface INotificationService {
    void sendOtp(String email);
    boolean verifyOtp(String email, String otp);
    void sendGeneralEmail(String to, String subject, String body);
    boolean isOtpVerified(String email);
    void markOtpAsUsed(String email);
}
