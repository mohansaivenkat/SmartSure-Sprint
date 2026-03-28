package com.group2.admin_service.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.group2.admin_service.dto.ClaimDTO;
import com.group2.admin_service.dto.ClaimStatusDTO;
import com.group2.admin_service.dto.PolicyDTO;
import com.group2.admin_service.dto.PolicyRequestDTO;
import com.group2.admin_service.dto.ReportResponse;
import com.group2.admin_service.dto.ReviewRequest;
import com.group2.admin_service.dto.UserDTO;
import com.group2.admin_service.service.IAdminService;

@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final IAdminService adminService;
    
    public AdminController(IAdminService adminService) {
		this.adminService = adminService;
	}

    // ==================== CLAIM APIs ====================

    // Claim Review API (Approve / Reject)
    @PutMapping("/claims/{id}/review")
    public ResponseEntity<String> reviewClaim(
            @PathVariable Long id,
            @RequestBody ReviewRequest request) {

        adminService.reviewClaim(id, request);
        return ResponseEntity.ok("Claim reviewed successfully");
    }

    // Get Claim Status (via AdminService → Feign → Claims Service)
    @GetMapping("/claims/status/{id}")
    public ResponseEntity<ClaimDTO> getStatus(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getClaimStatus(id));
    }

    // Get all claims for a specific user
    @GetMapping("/claims/user/{userId}")
    public ResponseEntity<List<ClaimDTO>> getClaimsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(adminService.getClaimsByUserId(userId));
    }

    // Download a claim's uploaded document
    @GetMapping("/claims/{id}/document")
    public ResponseEntity<byte[]> downloadDocument(@PathVariable Long id) {
        return adminService.downloadClaimDocument(id);
    }

    // Get all claims across all users
    @GetMapping("/claims")
    public ResponseEntity<List<ClaimDTO>> getAllClaims() {
        return ResponseEntity.ok(adminService.getAllClaims());
    }

    // ==================== POLICY PRODUCT MANAGEMENT ====================

    // Create a new policy product
    @PostMapping("/policies")
    public ResponseEntity<PolicyDTO> createPolicy(@RequestBody PolicyRequestDTO dto) {
        return ResponseEntity.ok(adminService.createPolicy(dto));
    }

    // Update an existing policy product
    @PutMapping("/policies/{id}")
    public ResponseEntity<PolicyDTO> updatePolicy(
            @PathVariable Long id,
            @RequestBody PolicyRequestDTO dto) {
        return ResponseEntity.ok(adminService.updatePolicy(id, dto));
    }

    // Delete (soft-delete) a policy product
    @DeleteMapping("/policies/{id}")
    public ResponseEntity<String> deletePolicy(@PathVariable Long id) {
        adminService.deletePolicy(id);
        return ResponseEntity.ok("Policy deleted successfully");
    }

    // ==================== REPORTS ====================

    // Reports API
    @GetMapping("/reports")
    public ResponseEntity<ReportResponse> getReports() {
        return ResponseEntity.ok(adminService.getReports());
    }

    // Get all users
    @GetMapping("/users")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }
}