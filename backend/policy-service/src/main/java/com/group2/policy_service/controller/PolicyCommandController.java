package com.group2.policy_service.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.group2.policy_service.dto.PolicyRequestDTO;
import com.group2.policy_service.dto.PolicyResponseDTO;
import com.group2.policy_service.dto.UserPolicyResponseDTO;
import com.group2.policy_service.service.IPolicyCommandService;

@RestController
@RequestMapping("/api")
public class PolicyCommandController {

    private final IPolicyCommandService commandService;

    public PolicyCommandController(IPolicyCommandService commandService) {
        this.commandService = commandService;
    }

    @PostMapping("/policies/purchase")
    public UserPolicyResponseDTO purchasePolicy(@RequestParam Long policyId) {
        return commandService.purchasePolicy(policyId);
    }

    @PostMapping("/admin/policies")
    @PreAuthorize("hasRole('ADMIN')")
    public PolicyResponseDTO createPolicy(@RequestBody PolicyRequestDTO dto) {
        return commandService.createPolicy(dto);
    }

    @PutMapping("/admin/policies/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public PolicyResponseDTO updatePolicy(@PathVariable Long id, @RequestBody PolicyRequestDTO dto) {
        return commandService.updatePolicy(id, dto);
    }

    @DeleteMapping("/admin/policies/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deletePolicy(@PathVariable Long id) {
        commandService.deletePolicy(id);
    }

    @PutMapping("/policies/user-policies/{id}/request-cancellation")
    public ResponseEntity<UserPolicyResponseDTO> requestCancellation(
            @PathVariable("id") Long id,
            @RequestBody(required = false) java.util.Map<String, String> body) {
        String reason = (body != null) ? body.get("reason") : null;
        return ResponseEntity.ok(commandService.requestCancellation(id, reason));
    }

    @PutMapping("/admin/policies/user-policies/{id}/approve-cancellation")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserPolicyResponseDTO> approveCancellation(@PathVariable("id") Long id) {
        return ResponseEntity.ok(commandService.approveCancellation(id));
    }

    @PutMapping("/policies/user-policies/{id}/pay-premium")
    public ResponseEntity<UserPolicyResponseDTO> payPremium(@PathVariable("id") Long id, @RequestParam("amount") Double amount) {
        return ResponseEntity.ok(commandService.payPremium(id, amount));
    }
}
