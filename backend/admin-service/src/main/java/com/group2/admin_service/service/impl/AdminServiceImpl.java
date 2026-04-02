package com.group2.admin_service.service.impl;

import com.group2.admin_service.service.IAdminService;

import java.util.Collections;
import java.util.List;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;

import com.group2.admin_service.dto.ClaimDTO;
import com.group2.admin_service.dto.ClaimStatusDTO;
import com.group2.admin_service.dto.ClaimStatusUpdateDTO;
import com.group2.admin_service.dto.PolicyDTO;
import com.group2.admin_service.dto.PolicyRequestDTO;
import com.group2.admin_service.dto.PolicyStatsDTO;
import com.group2.admin_service.dto.UserPolicyDTO;
import com.group2.admin_service.dto.NotificationEvent;
import com.group2.admin_service.dto.ReportResponse;
import com.group2.admin_service.dto.ReviewRequest;
import com.group2.admin_service.feign.AuthFeignClient;
import com.group2.admin_service.feign.ClaimsFeignClient;
import com.group2.admin_service.feign.PolicyFeignClient;
import com.group2.admin_service.feign.NotificationFeignClient; 
import com.group2.admin_service.dto.EmailRequest; 
import com.group2.admin_service.dto.UserDTO;
import com.group2.admin_service.util.AdminMapper;

@Service
public class AdminServiceImpl implements IAdminService {

    private final ClaimsFeignClient claimsFeignClient;
    private final PolicyFeignClient policyFeignClient;
    private final AuthFeignClient authFeignClient;
    private final NotificationFeignClient notificationFeignClient; 
    private final RabbitTemplate rabbitTemplate;
    private final AdminMapper adminMapper;
    
    public AdminServiceImpl(ClaimsFeignClient claimsFeignClient, 
                            PolicyFeignClient policyFeignClient, 
                            AuthFeignClient authFeignClient,
                            NotificationFeignClient notificationFeignClient, 
                            RabbitTemplate rabbitTemplate,
                            AdminMapper adminMapper) {
		this.claimsFeignClient = claimsFeignClient;
		this.policyFeignClient = policyFeignClient;
		this.authFeignClient = authFeignClient;
        this.notificationFeignClient = notificationFeignClient; 
        this.rabbitTemplate = rabbitTemplate;
        this.adminMapper = adminMapper;
	}
    
    // ==================== CLAIM OPERATIONS ====================

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AdminServiceImpl.class);

	@Retryable(
	    retryFor = Exception.class,
	    maxAttempts = 3,
	    backoff = @Backoff(delay = 2000)
	)
	public void reviewClaim(Long claimId, ReviewRequest request) {
        // Prepare DTO for direct Feign call
        ClaimStatusUpdateDTO updateDTO = new ClaimStatusUpdateDTO();
        updateDTO.setStatus(request.getStatus());
        updateDTO.setRemark(request.getRemark());

        // 1. Direct synchronous update via Feign (Reliable for STS users)
        claimsFeignClient.updateClaimStatus(claimId, updateDTO);
        log.info("✅ Claim status updated via Feign for claimId: {}", claimId);

        // 2. Optional: Still try to send async event for other services (listeners)
        // 3. Send direct email notification via Feign (STS user fix)
        String subject = "Claim Update";
        String htmlBody = "";
        UserDTO user = null;
        try {
            ClaimDTO claim = claimsFeignClient.getClaimById(claimId);
            user = authFeignClient.getUserById(claim.getUserId());
            
            String policyName = "Your Policy";
            try {
                UserPolicyDTO up = policyFeignClient.getUserPolicyById(claim.getPolicyId());
                if (up != null && up.getPolicyName() != null) {
                    policyName = up.getPolicyName();
                }
            } catch (Exception e) {
                log.warn("Could not fetch policy name for claim notification: {}", e.getMessage());
            }

            subject = "SmartSure: Claim Review Update - " + request.getStatus();
            String statusColor = request.getStatus().equalsIgnoreCase("APPROVED") ? "#27ae60" : "#c0392b";
            String statusIcon = request.getStatus().equalsIgnoreCase("APPROVED") ? "✅" : "❌";

            htmlBody = String.format(
                "<html><body style='font-family: Arial, sans-serif; color: #333;'>" +
                "<div style='max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;'>" +
                "<div style='background: %s; color: white; padding: 20px; text-align: center;'>" +
                "<h1 style='margin: 0;'>%s Claim %s</h1>" +
                "</div>" +
                "<div style='padding: 20px;'>" +
                "<p>Hello %s,</p>" +
                "<p>Your claim for policy: <strong>%s</strong> has been reviewed.</p>" +
                "<div style='background: #f4f7f6; padding: 15px; border-radius: 5px; border-left: 5px solid %s;'>" +
                "<strong>Status:</strong> %s<br/>" +
                "<strong>Admin Remark:</strong> %s" +
                "</div>" +
                "<p style='margin-top: 20px;'>You can view more details in your account dashboard.</p>" +
                "</div>" +
                "<div style='background: #f9f9f9; padding: 10px; text-align: center; font-size: 12px; color: #777;'>" +
                "&copy; 2026 SmartSure Insurance Management System" +
                "</div></div></body></html>",
                statusColor, statusIcon, request.getStatus(), user.getName(), policyName, statusColor, request.getStatus(), request.getRemark()
            );
            
            notificationFeignClient.sendEmail(new EmailRequest(user.getEmail(), subject, htmlBody));
            log.info("📧 Claim status notification sent via Feign to: {}", user.getEmail());
        } catch (Exception e) {
            log.warn("⚠️ Email notification via Feign failed: {}", e.getMessage());
            
            // 4. Try RabbitMQ if Feign fails (redundancy)
            try {
                if (user != null) {
                    NotificationEvent event = new NotificationEvent();
                    event.setEmail(user.getEmail());
                    event.setSubject(subject);
                    event.setMessage(htmlBody.isEmpty() ? "Status update: " + request.getStatus() : htmlBody);
                    
                    rabbitTemplate.convertAndSend("notification.exchange", "notification.send", event);
                    log.info("🔥 Notification event sent to RabbitMQ for claimId: {}", claimId);
                }
            } catch (Exception mqEx) {
                log.warn("⚠️ RabbitMQ event failed: {}", mqEx.getMessage());
            }
        }
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