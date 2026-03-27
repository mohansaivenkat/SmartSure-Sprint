package com.group2.auth_service.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "NOTIFICATION-SERVICE", path = "/api/notifications")
public interface NotificationClient {

    @PostMapping("/send-otp")
    ResponseEntity<String> sendOtp(@RequestParam String email);

    @PostMapping("/verify-otp")
    ResponseEntity<String> verifyOtp(@RequestParam String email, @RequestParam String otp);

    @GetMapping("/is-verified")
    ResponseEntity<Boolean> isOtpVerified(@RequestParam String email);
    
    @PostMapping("/mark-used")
    ResponseEntity<Void> markOtpAsUsed(@RequestParam String email);
}
