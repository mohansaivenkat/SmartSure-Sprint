package com.group2.admin_service.service.impl;

import com.group2.admin_service.service.IAdminService;

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
import com.group2.admin_service.util.AdminMapper;

@Service
public class AdminServiceImpl implements IAdminService {

    private final ClaimsFeignClient claimsFeignClient;
    private final PolicyFeignClient policyFeignClient;
    private final AuthFeignClient authFeignClient;
    private final RabbitTemplate rabbitTemplate;
    private final AdminMapper adminMapper;
    
    public AdminServiceImpl(ClaimsFeignClient claimsFeignClient, 
                            PolicyFeignClient policyFeignClient, 
                            AuthFeignClient authFeignClient,
                            RabbitTemplate rabbitTemplate,
                            AdminMapper adminMapper) {
		this.claimsFeignClient = claimsFeignClient;
		this.policyFeignClient = policyFeignClient;
		this.authFeignClient = authFeignClient;
        this.rabbitTemplate = rabbitTemplate;
        this.adminMapper = adminMapper;
	}
    
    // ==================== CLAIM OPERATIONS ====================

	@Retryable(
	    retryFor = Exception.class,
	    maxAttempts = 3,
	    backoff = @Backoff(delay = 2000)
	)
	public void reviewClaim(Long claimId, ReviewRequest request) {
	    ClaimReviewEvent event = new ClaimReviewEvent();
	    event.setClaimId(claimId);
	    event.setStatus(request.getStatus());
	    event.setRemark(request.getRemark());
	
	    rabbitTemplate.convertAndSend(
	            "claim.exchange",
	            "claim.review",
	            event
	    );
	
	    System.out.println("🔥 Claim review event sent for claimId: " + claimId);
	}

    @Recover
    public void recoverReviewClaim(Exception e, Long claimId, ReviewRequest request) {
        throw new RuntimeException("Fallback: Could not review claim. Service might be down. Reason: " + e.getMessage());
    }

    @Retryable(retryFor = Exception.class, maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public ClaimDTO getClaimStatus(Long claimId) {
        return claimsFeignClient.getClaimStatus(claimId);
    }

    @Recover
    public ClaimDTO recoverGetClaimStatus(Exception e, Long claimId) {
        return new ClaimDTO();
    }

    @Retryable(retryFor = Exception.class, maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public List<ClaimDTO> getClaimsByUserId(Long userId) {
        return claimsFeignClient.getClaimsByUserId(userId);
    }

    @Recover
    public List<ClaimDTO> recoverGetClaimsByUserId(Exception e, Long userId) {
        return Collections.emptyList();
    }

    @Retryable(retryFor = Exception.class, maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public org.springframework.http.ResponseEntity<byte[]> downloadClaimDocument(Long claimId) {
        return claimsFeignClient.downloadDocument(claimId);
    }
    
    @Recover
    public org.springframework.http.ResponseEntity<byte[]> recoverDownloadClaimDocument(Exception e, Long claimId) {
        throw new RuntimeException("Fallback: Could not download document. Service might be down. Reason: " + e.getMessage());
    }

    @Retryable(retryFor = Exception.class, maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public List<ClaimDTO> getAllClaims() {
        return claimsFeignClient.getAllClaims();
    }

    @Recover
    public List<ClaimDTO> recoverGetAllClaims(Exception e) {
        return Collections.emptyList();
    }

    @Retryable(retryFor = Exception.class, maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public List<UserDTO> getAllUsers() {
        return authFeignClient.getAllUsers();
    }

    @Recover
    public List<UserDTO> recoverGetAllUsers(Exception e) {
        return Collections.emptyList();
    }

    @Retryable(retryFor = Exception.class, maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public PolicyDTO createPolicy(PolicyRequestDTO dto) {
        return policyFeignClient.createPolicy(dto);
    }

    @Recover
    public PolicyDTO recoverCreatePolicy(Exception e, PolicyRequestDTO dto) {
        throw new RuntimeException("Fallback: Could not create policy. Service might be down. Reason: " + e.getMessage());
    }

    @Retryable(retryFor = Exception.class, maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public PolicyDTO updatePolicy(Long id, PolicyRequestDTO dto) {
        return policyFeignClient.updatePolicy(id, dto);
    }

    @Recover
    public PolicyDTO recoverUpdatePolicy(Exception e, Long id, PolicyRequestDTO dto) {
        throw new RuntimeException("Fallback: Could not update policy. Service might be down. Reason: " + e.getMessage());
    }

    @Retryable(retryFor = Exception.class, maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public void deletePolicy(Long id) {
        policyFeignClient.deletePolicy(id);
    }

    @Recover
    public void recoverDeletePolicy(Exception e, Long id) {
        throw new RuntimeException("Fallback: Could not delete policy. Service might be down. Reason: " + e.getMessage());
    }

    @Retryable(retryFor = Exception.class, maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public ReportResponse getReports() {
        ClaimStatusDTO claimStats = claimsFeignClient.getClaimStats();
        PolicyStatsDTO policyStats = policyFeignClient.getPolicyStats();
        return adminMapper.mapToReportResponse(claimStats, policyStats);
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