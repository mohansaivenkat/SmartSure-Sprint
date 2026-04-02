package com.group2.admin_service.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import com.group2.admin_service.dto.PolicyDTO;
import com.group2.admin_service.dto.PolicyRequestDTO;
import com.group2.admin_service.dto.PolicyStatsDTO;
import com.group2.admin_service.dto.UserPolicyDTO;
import com.group2.admin_service.config.FeignConfig;

@FeignClient(name = "policy-service", configuration = FeignConfig.class)
public interface PolicyFeignClient {

	@GetMapping("/api/admin/policies/stats")
    PolicyStatsDTO getPolicyStats();

	@PostMapping("/api/admin/policies")
	PolicyDTO createPolicy(@RequestBody PolicyRequestDTO dto);

	@PutMapping("/api/admin/policies/{id}")
	PolicyDTO updatePolicy(@PathVariable("id") Long id, @RequestBody PolicyRequestDTO dto);

	@DeleteMapping("/api/admin/policies/{id}")
	void deletePolicy(@PathVariable("id") Long id);

    @GetMapping("/api/user-policies/{id}")
    UserPolicyDTO getUserPolicyById(@PathVariable("id") Long id);
}

