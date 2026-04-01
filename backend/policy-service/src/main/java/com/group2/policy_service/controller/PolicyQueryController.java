package com.group2.policy_service.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.group2.policy_service.dto.PolicyResponseDTO;
import com.group2.policy_service.dto.PolicyStatsDTO;
import com.group2.policy_service.dto.UserPolicyResponseDTO;
import com.group2.policy_service.entity.PolicyType;
import com.group2.policy_service.service.IPolicyQueryService;

@RestController
@RequestMapping("/api")
public class PolicyQueryController {

    private final IPolicyQueryService queryService;

    public PolicyQueryController(IPolicyQueryService queryService) {
        this.queryService = queryService;
    }

    @GetMapping("/policies")
    public List<PolicyResponseDTO> getAllPolicies() {
        return queryService.getAllPolicies();
    }

    @GetMapping("/policy-types")
    public List<PolicyType> getAllPolicyTypes() {
        return queryService.getAllPolicyTypes();
    }

    @GetMapping("/policies/{policyId}")
    public PolicyResponseDTO getPolicy(@PathVariable Long policyId) {
        return queryService.getPolicyById(policyId);
    }

    @GetMapping({"/admin/user-policies/{userId}", "/policies/user/{userId}"})
    @PreAuthorize("hasRole('ADMIN') or principal.equals(#userId)")
    public List<UserPolicyResponseDTO> getUserPolicies(@PathVariable Long userId) {
        return queryService.getPoliciesByUserId(userId);
    }

    @GetMapping("/admin/user-policies")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserPolicyResponseDTO> getAllUserPolicies() {
        return queryService.getAllUserPolicies();
    }

    @GetMapping("/admin/policies/stats")
    public ResponseEntity<PolicyStatsDTO> getPolicyStats() {
        return ResponseEntity.ok(queryService.getPolicyStats());
    }

    @GetMapping("/user-policies/{id}")
    public ResponseEntity<UserPolicyResponseDTO> getUserPolicyById(@PathVariable Long id) {
        return ResponseEntity.ok(queryService.getUserPolicyById(id));
    }
}
