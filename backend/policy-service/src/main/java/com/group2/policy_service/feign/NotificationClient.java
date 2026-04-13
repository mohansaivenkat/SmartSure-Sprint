package com.group2.policy_service.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.group2.policy_service.dto.EmailRequest;

@FeignClient(name = "NOTIFICATION-SERVICE", path = "/api/notifications")
public interface NotificationClient {

    @PostMapping("/send-email")
    ResponseEntity<String> sendEmail(@RequestBody EmailRequest request);
}
