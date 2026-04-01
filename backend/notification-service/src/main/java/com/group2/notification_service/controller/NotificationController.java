package com.group2.notification_service.controller;

import org.slf4j.Logger;
import org.slf4j.*;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.group2.notification_service.dto.EmailRequest;
import com.group2.notification_service.service.INotificationService;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/notifications")
@Slf4j
public class NotificationController {

    private final INotificationService notificationService;
    
    private static final Logger log = LoggerFactory.getLogger(NotificationController.class);

    public NotificationController(INotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping("/send-otp")
    public ResponseEntity<String> sendOtp(@RequestParam String email) {
        log.info("REST request to send OTP to: {}", email);
        notificationService.sendOtp(email);
        return ResponseEntity.ok("OTP sent to email");
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<String> verifyOtp(@RequestParam String email, @RequestParam String otp) {
        log.info("REST request to verify OTP for: {}", email);
        notificationService.verifyOtp(email, otp);
        return ResponseEntity.ok("OTP verified successfully");
    }

    @PostMapping("/send-email")
    public ResponseEntity<String> sendEmail(@RequestBody EmailRequest request) {
        log.info("REST request to send general email to: {}", request.getTo());
        notificationService.sendGeneralEmail(request.getTo(), request.getSubject(), request.getBody());
        return ResponseEntity.ok("Email sent successfully");
    }

    @org.springframework.web.bind.annotation.GetMapping("/is-verified")
    public ResponseEntity<Boolean> isOtpVerified(@RequestParam String email) {
        log.info("REST request to check if OTP is verified for: {}", email);
        return ResponseEntity.ok(notificationService.isOtpVerified(email));
    }
    
    @PostMapping("/mark-used")
    public ResponseEntity<Void> markOtpAsUsed(@RequestParam String email) {
        log.info("REST request to mark OTP as used for: {}", email);
        notificationService.markOtpAsUsed(email);
        return ResponseEntity.ok().build();
    }
}
