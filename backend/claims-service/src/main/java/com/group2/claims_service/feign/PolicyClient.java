package com.group2.claims_service.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "policy-service", path = "/api")
public interface PolicyClient {

    @GetMapping("/user-policies/{id}")
    UserPolicyDTO getUserPolicyById(@PathVariable("id") Long id);
}