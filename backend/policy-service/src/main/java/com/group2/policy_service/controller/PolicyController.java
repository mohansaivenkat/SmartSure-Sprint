package com.group2.policy_service.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;

import com.group2.policy_service.dto.PolicyRequestDTO;
import com.group2.policy_service.dto.PolicyResponseDTO;
import com.group2.policy_service.dto.PolicyStatsDTO;
import com.group2.policy_service.dto.UserPolicyResponseDTO;
import com.group2.policy_service.entity.PolicyType;
import com.group2.policy_service.service.PolicyService;

@RestController
@RequestMapping("/api")
public class PolicyController {

    private final PolicyService policyService;

    public PolicyController(PolicyService policyService) {
        this.policyService = policyService;
    }
    
    @GetMapping("/policies")
    public List<PolicyResponseDTO> getAllPolicies() {
        return policyService.getAllPolicies();
    }
    
    @GetMapping("/policy-types")
    public List<PolicyType> getAllPolicyTypes() {
        return policyService.getAllPolicyTypes();
    }

    @PostMapping("/policies/purchase")
    public UserPolicyResponseDTO purchasePolicy(@RequestParam Long policyId) {
        return policyService.purchasePolicy(policyId);
    }

    @GetMapping("/policies/{policyId}")
    public PolicyResponseDTO getPolicy(@PathVariable Long policyId) {
        return policyService.getPolicyById(policyId);
    }
    
    @GetMapping({"/admin/user-policies/{userId}", "/policies/user/{userId}"})
    @PreAuthorize("hasRole('ADMIN') or principal.equals(#userId)")
    public List<UserPolicyResponseDTO> getUserPolicies(@PathVariable Long userId) {
        return policyService.getPoliciesByUserId(userId);
    }

    @PostMapping("/admin/policies")
    public PolicyResponseDTO createPolicy(@RequestBody PolicyRequestDTO dto) {
        return policyService.createPolicy(dto);
    }

    @PutMapping("/admin/policies/{id}")
    public PolicyResponseDTO updatePolicy(@PathVariable Long id,
                                          @RequestBody PolicyRequestDTO dto) {
        return policyService.updatePolicy(id, dto);
    }

    @DeleteMapping("/admin/policies/{id}")
    public void deletePolicy(@PathVariable Long id) {
        policyService.deletePolicy(id);
    }

    // Policy stats endpoint (called by Admin Service via Feign for reports)
    @GetMapping("/admin/policies/stats")
    public ResponseEntity<PolicyStatsDTO> getPolicyStats() {
        return ResponseEntity.ok(policyService.getPolicyStats());
    }

    // Cancel a user's policy (Admin lifecycle: ACTIVE → CANCELLED)
    @PutMapping("/admin/policies/{id}/cancel")
    public ResponseEntity<UserPolicyResponseDTO> cancelPolicy(@PathVariable Long id) {
        return ResponseEntity.ok(policyService.cancelPolicy(id));
    }
}