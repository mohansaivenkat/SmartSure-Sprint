package com.group2.admin_service.service;

import java.util.Collections;
import java.util.List;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;

import com.group2.admin_service.dto.ClaimDTO;
import com.group2.admin_service.dto.ClaimReviewEvent;
import com.group2.admin_service.dto.ClaimStatusDTO;
import com.group2.admin_service.dto.ClaimStatusUpdateDTO;
import com.group2.admin_service.dto.PolicyDTO;
import com.group2.admin_service.dto.PolicyRequestDTO;
import com.group2.admin_service.dto.PolicyStatsDTO;
import com.group2.admin_service.dto.ReportResponse;
import com.group2.admin_service.dto.ReviewRequest;
import com.group2.admin_service.feign.AuthFeignClient;
import com.group2.admin_service.feign.ClaimsFeignClient;
import com.group2.admin_service.feign.PolicyFeignClient;
import com.group2.admin_service.dto.UserDTO;

@Service
public class AdminService {

    private final ClaimsFeignClient claimsFeignClient;
    private final PolicyFeignClient policyFeignClient;
    private final AuthFeignClient authFeignClient;
    
    public AdminService(ClaimsFeignClient claimsFeignClient, PolicyFeignClient policyFeignClient, AuthFeignClient authFeignClient) {
		this.claimsFeignClient = claimsFeignClient;
		this.policyFeignClient = policyFeignClient;
		this.authFeignClient = authFeignClient;
	}
    
    @Autowired
    private RabbitTemplate rabbitTemplate;
    
    // ==================== CLAIM OPERATIONS ====================

	@Retryable(
	    retryFor = Exception.class,
	    maxAttempts = 3,
	    backoff = @Backoff(delay = 2000)
	)
	public void reviewClaim(Long claimId, ReviewRequest request) {
	
	    // 1. Create Event DTO (DO NOT send ReviewRequest directly)
	    ClaimReviewEvent event = new ClaimReviewEvent();
	    event.setClaimId(claimId);
	    event.setStatus(request.getStatus());
	
	    // 2. Send message to RabbitMQ
	    rabbitTemplate.convertAndSend(
	            "claim.exchange",
	            "claim.review",
	            event
	    );
	
	    // 3. Logging (very useful for debugging)
	    System.out.println("🔥 Claim review event sent for claimId: " + claimId);
	}

    @Recover
    public void recoverReviewClaim(Exception e, Long claimId, ReviewRequest request) {
        throw new RuntimeException("Fallback: Could not review claim. Service might be down. Reason: " + e.getMessage());
    }

    // Get claim status
    @Retryable(retryFor = Exception.class, maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public ClaimDTO getClaimStatus(Long claimId) {
        return claimsFeignClient.getClaimStatus(claimId);
    }

    @Recover
    public ClaimDTO recoverGetClaimStatus(Exception e, Long claimId) {
        return new ClaimDTO();
    }

    // Get claims by user ID
    @Retryable(retryFor = Exception.class, maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public List<ClaimDTO> getClaimsByUserId(Long userId) {
        return claimsFeignClient.getClaimsByUserId(userId);
    }

    @Recover
    public List<ClaimDTO> recoverGetClaimsByUserId(Exception e, Long userId) {
        return Collections.emptyList();
    }

    // Download Claim Document
    @Retryable(retryFor = Exception.class, maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public org.springframework.http.ResponseEntity<byte[]> downloadClaimDocument(Long claimId) {
        return claimsFeignClient.downloadDocument(claimId);
    }
    
    @Recover
    public org.springframework.http.ResponseEntity<byte[]> recoverDownloadClaimDocument(Exception e, Long claimId) {
        throw new RuntimeException("Fallback: Could not download document. Service might be down. Reason: " + e.getMessage());
    }

    // Get all claims across all users
    @Retryable(retryFor = Exception.class, maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public List<ClaimDTO> getAllClaims() {
        return claimsFeignClient.getAllClaims();
    }

    @Recover
    public List<ClaimDTO> recoverGetAllClaims(Exception e) {
        return Collections.emptyList();
    }

    // Get all users
    @Retryable(retryFor = Exception.class, maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public List<UserDTO> getAllUsers() {
        return authFeignClient.getAllUsers();
    }

    @Recover
    public List<UserDTO> recoverGetAllUsers(Exception e) {
        return Collections.emptyList();
    }
    // ==================== POLICY PRODUCT MANAGEMENT ====================

    // Create policy product
    @Retryable(retryFor = Exception.class, maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public PolicyDTO createPolicy(PolicyRequestDTO dto) {
        return policyFeignClient.createPolicy(dto);
    }

    @Recover
    public PolicyDTO recoverCreatePolicy(Exception e, PolicyRequestDTO dto) {
        throw new RuntimeException("Fallback: Could not create policy. Service might be down. Reason: " + e.getMessage());
    }

    // Update policy product
    @Retryable(retryFor = Exception.class, maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public PolicyDTO updatePolicy(Long id, PolicyRequestDTO dto) {
        return policyFeignClient.updatePolicy(id, dto);
    }

    @Recover
    public PolicyDTO recoverUpdatePolicy(Exception e, Long id, PolicyRequestDTO dto) {
        throw new RuntimeException("Fallback: Could not update policy. Service might be down. Reason: " + e.getMessage());
    }

    // Delete policy product
    @Retryable(retryFor = Exception.class, maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public void deletePolicy(Long id) {
        policyFeignClient.deletePolicy(id);
    }

    @Recover
    public void recoverDeletePolicy(Exception e, Long id) {
        throw new RuntimeException("Fallback: Could not delete policy. Service might be down. Reason: " + e.getMessage());
    }

    // ==================== REPORTS ====================

    //Reports (DYNAMIC FROM CLAIMS + POLICY SERVICES)
    @Retryable(retryFor = Exception.class, maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public ReportResponse getReports() {

        ReportResponse report = new ReportResponse();

        //Fetch data from Claims Service
        ClaimStatusDTO claimStats = claimsFeignClient.getClaimStats();

        report.setTotalClaims((int) claimStats.getTotalClaims());
        report.setApprovedClaims((int) claimStats.getApprovedClaims());
        report.setRejectedClaims((int) claimStats.getRejectedClaims());

        // Policy Service stats
         PolicyStatsDTO policyStats = policyFeignClient.getPolicyStats();
         report.setTotalPolicies((int) policyStats.getTotalPolicies());
         report.setTotalRevenue(policyStats.getTotalRevenue());

        return report;
    }

    @Recover
    public ReportResponse recoverGetReports(Exception e) {
        ReportResponse report = new ReportResponse();
        report.setTotalClaims(0);
        report.setApprovedClaims(0);
        report.setRejectedClaims(0);
        report.setTotalPolicies(0);
        report.setTotalRevenue(0.0);
        return report;
    }
}