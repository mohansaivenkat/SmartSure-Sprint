package com.group2.claims_service.service.impl;

import com.group2.claims_service.service.IClaimService;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.group2.claims_service.dto.NotificationEvent;
import com.group2.claims_service.dto.ClaimRequestDTO;
import com.group2.claims_service.dto.ClaimResponseDTO;
import com.group2.claims_service.dto.ClaimStatsDTO;
import com.group2.claims_service.dto.EmailRequest;
import com.group2.claims_service.entity.Claim;
import com.group2.claims_service.entity.ClaimDocument;
import com.group2.claims_service.entity.ClaimStatus;
import com.group2.claims_service.exception.ClaimNotFoundException;
import com.group2.claims_service.feign.AuthClient;
import com.group2.claims_service.feign.NotificationClient;
import com.group2.claims_service.feign.PolicyClient;
import com.group2.claims_service.feign.UserDTO;
import com.group2.claims_service.feign.UserPolicyDTO;
import com.group2.claims_service.repository.ClaimDocumentRepository;
import com.group2.claims_service.repository.ClaimRepository;
import com.group2.claims_service.util.ClaimMapper;
import org.slf4j.*;

@Service
public class ClaimServiceImpl implements IClaimService {
	
	private final ClaimRepository claimRepository;
	private final ClaimDocumentRepository documentRepository;
	private final AuthClient authClient;
	private final PolicyClient policyClient;
	private final NotificationClient notificationClient;
	private final RabbitTemplate rabbitTemplate;
	private final ClaimMapper claimMapper;
	
	private static final Logger log = LoggerFactory.getLogger(ClaimServiceImpl.class);
	
	public ClaimServiceImpl(ClaimRepository claimRepository, 
                            ClaimDocumentRepository documentRepository, 
                            AuthClient authClient,
                            PolicyClient policyClient,
                            NotificationClient notificationClient,
                            RabbitTemplate rabbitTemplate,
                            ClaimMapper claimMapper) {
		this.claimRepository = claimRepository;
		this.documentRepository = documentRepository;
		this.authClient = authClient;
		this.policyClient = policyClient;
		this.notificationClient = notificationClient;
		this.rabbitTemplate = rabbitTemplate;
		this.claimMapper = claimMapper;
	}
	
    @Override
    public ClaimResponseDTO initiateClaim(ClaimRequestDTO requestDTO) {
        // Strict Policy Verification: Verify status and ownership via policy-service
        try {
            UserPolicyDTO policy = policyClient.getUserPolicyById(requestDTO.getPolicyId());
            if (policy == null) {
                throw new RuntimeException("Invalid Policy ID provided.");
            }
            if (!"ACTIVE".equals(policy.getStatus())) {
                throw new RuntimeException("Claim initiation failed: Policy status is " + policy.getStatus() + ". Claims can only be filed for ACTIVE policies.");
            }
            if (!policy.getUserId().equals(requestDTO.getUserId())) {
                log.warn("Ownership mismatch: Policy owner userId is {}, but request userId is {}", policy.getUserId(), requestDTO.getUserId());
                throw new RuntimeException("Fraud detected: You do not own this policy.");
            }
        } catch (RuntimeException re) {
            log.error("Business validation failed for claim: {}", re.getMessage());
            throw re; 
        } catch (Exception e) {
            log.error("Policy verification failed for claim: {}", e.getMessage());
            // Improved error reporting: if it's a Feign error, try to provide more detail
            if (e.getMessage().contains("404")) {
                throw new RuntimeException("Policy verification failed: Policy ID not found in system.");
            }
            if (e.getMessage().contains("401") || e.getMessage().contains("403")) {
                throw new RuntimeException("Policy verification failed: Authorization error when checking policy ownership.");
            }
            throw new RuntimeException("Policy verification system is currently unavailable (" + e.getClass().getSimpleName() + "). Please try again later.");
        }

	    Claim claim = claimMapper.mapToEntity(requestDTO);
        claim.setClaimStatus(ClaimStatus.SUBMITTED);
        claim.setCreatedAt(LocalDateTime.now());

	    Claim savedClaim = claimRepository.save(claim);

        // 3. Direct synchronous email notification via Feign (STS user fix)
        String subject = "Claim Submitted";
        String htmlBody = "";
        UserDTO user = null;
        try {
            user = authClient.getUserById(savedClaim.getUserId());
            if (user != null && user.getEmail() != null) {
                subject = "SmartSure: Claim Submitted Successfully";
                String policyName = "Your Policy";
                try {
                    UserPolicyDTO up = policyClient.getUserPolicyById(savedClaim.getPolicyId());
                    if (up != null && up.getPolicyName() != null) {
                        policyName = up.getPolicyName();
                    }
                } catch (Exception e) {
                    log.warn("Could not fetch policy name for claim notification: {}", e.getMessage());
                }

                htmlBody = String.format(
                    "<html><body style='font-family: Arial, sans-serif; color: #333;'>" +
                    "<div style='max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;'>" +
                    "<div style='background: #2980b9; color: white; padding: 20px; text-align: center;'>" +
                    "<h1 style='margin: 0;'>🛡️ Claim Received</h1>" +
                    "</div>" +
                    "<div style='padding: 20px;'>" +
                    "<p>Hello %s,</p>" +
                    "<p>We have successfully received your claim request for: <strong>%s</strong>.</p>" +
                    "<div style='background: #f4f7f6; padding: 15px; border-radius: 5px; border-left: 5px solid #2980b9;'>" +
                    "<strong>Claim Amount:</strong> ₹%.2f<br/>" +
                    "<strong>Status:</strong> Under Review" +
                    "</div>" +
                    "<p style='margin-top: 20px;'>Our claims department will review your submission and provide an update within 2-3 business days. You can track this in your dashboard.</p>" +
                    "</div>" +
                    "<div style='background: #f9f9f9; padding: 10px; text-align: center; font-size: 12px; color: #777;'>" +
                    "&copy; 2026 SmartSure Insurance Management System" +
                    "</div></div></body></html>",
                    user.getName(), policyName, savedClaim.getClaimAmount()
                );
                
                try {
                    notificationClient.sendEmail(new EmailRequest(user.getEmail(), subject, htmlBody));
                    log.info("📧 Claim submission notification sent via Feign to: {}", user.getEmail());
                } catch (Exception feignEx) {
                    log.warn("⚠️ Feign email failed, falling back to RabbitMQ...");
                    NotificationEvent event = new NotificationEvent();
                    event.setEmail(user.getEmail());
                    event.setSubject(subject);
                    event.setMessage(htmlBody);
                    rabbitTemplate.convertAndSend("notification.exchange", "notification.send", event);
                }
            }
        } catch (Exception e) {
            log.error("Failed to process claim notification: {}", e.getMessage());
            // Last resort fallback if user fetch failed but we have data
            if (user == null && savedClaim != null) {
                 log.warn("Could not even fetch user for claim notification.");
            }
        }

        return claimMapper.mapToResponse(savedClaim);
    }
	
	public String uploadDocument(Long claimId, MultipartFile file) {
		
		claimRepository.findById(claimId)
		.orElseThrow(()-> new ClaimNotFoundException("Claim not found with id: "+claimId));
		
		String contentType = file.getContentType();
		String filename = file.getOriginalFilename();
		boolean isValid = false;

		if (contentType != null && (contentType.equalsIgnoreCase("image/jpeg") || contentType.equalsIgnoreCase("image/jpg") || contentType.equalsIgnoreCase("application/pdf"))) {
			isValid = true;
		} else if (filename != null) {
			String lower = filename.toLowerCase();
			if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".pdf")) {
				isValid = true;
			}
		}

		if (!isValid) {
			throw new IllegalArgumentException("Invalid file format. Only JPG and PDF files are allowed.");
		}
		
		ClaimDocument document=new ClaimDocument();
		
		document.setClaimId(claimId);
		document.setFileUrl(file.getOriginalFilename());
		document.setDocumentType(file.getContentType());
		document.setCreatedAt(LocalDateTime.now());
		try {
			document.setFileData(file.getBytes());
		} catch (java.io.IOException e) {
			throw new RuntimeException("Failed to store file data", e);
		}
		
		documentRepository.save(document);
		
		return "Document uploaded Successfully";
	}
	
	@org.springframework.transaction.annotation.Transactional(readOnly = true)
	public ClaimDocument getClaimDocument(Long claimId) {
		return documentRepository.findByClaimId(claimId)
			.orElseThrow(() -> new ClaimNotFoundException("Document not found for claim id: " + claimId));
	}
	
	public ClaimResponseDTO getClaimStatus(Long claimId) {
		
		Claim claim=claimRepository.findById(claimId)
				.orElseThrow(()-> new ClaimNotFoundException("Claim not found with id: "+claimId));
		
		ClaimResponseDTO response = claimMapper.mapToResponse(claim);
		populateHasDocument(response);
		populateAdminRemark(response, claim);
		response.setMessage("Claim Status fetched Successfully");
		
		return response;
	}
	
	public ClaimResponseDTO getClaimById(Long claimId) {

	    Claim claim = claimRepository.findById(claimId)
	            .orElseThrow(() ->
	                    new ClaimNotFoundException("Claim not found with id: " + claimId));

	    ClaimResponseDTO response = claimMapper.mapToResponse(claim);
	    populateHasDocument(response);
	    populateAdminRemark(response, claim);
	    response.setMessage("Claim fetched successfully");

	    return response;
	}
    public void updateClaimStatus(Long claimId, String newStatus, String remark) {

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ClaimNotFoundException("Claim not found with id: " + claimId));

        ClaimStatus targetStatus;
        try {
            targetStatus = ClaimStatus.valueOf(newStatus.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid claim status: " + newStatus);
        }

        ClaimStatus currentStatus = claim.getClaimStatus();
        boolean validTransition = switch (targetStatus) {
            case UNDER_REVIEW -> currentStatus == ClaimStatus.SUBMITTED || currentStatus == ClaimStatus.CLOSED;
            case APPROVED, REJECTED -> currentStatus == ClaimStatus.UNDER_REVIEW;
            case CLOSED -> currentStatus == ClaimStatus.APPROVED || currentStatus == ClaimStatus.REJECTED;
            default -> false;
        };

        if (!validTransition) {
            throw new RuntimeException(
                    "Invalid status transition from " + currentStatus + " to " + targetStatus);
        }

        claim.setClaimStatus(targetStatus);
        if (remark != null) {
            claim.setAdminRemark(remark);
        }
        claimRepository.save(claim);

        if (targetStatus == ClaimStatus.APPROVED || targetStatus == ClaimStatus.REJECTED) {
            log.info("Status transition to {}, publishing notification event for claimId: {}", targetStatus, claimId);
            try {
                com.group2.claims_service.feign.UserDTO user = authClient.getUserById(claim.getUserId());
                if (user != null && user.getEmail() != null) {
                    String subject = "Insurance Claim Update: #" + claim.getId() + " — " + targetStatus;
                    String body = "Hello,\n\nYour claim tracking number #" + claim.getId() + " for Policy #" + claim.getPolicyId() + " has been officially " + targetStatus + ".\n\n" +
                                (remark != null ? "Admin Remark: " + remark + "\n\n" : "") +
                                "You can view the full details on your dashboard.\n\nBest regards,\nSmartSure Management Team";
                    
                    try {
                        notificationClient.sendEmail(new EmailRequest(user.getEmail(), subject, body));
                        log.info("📧 Claim status notification sent via Feign for claimId: {}", claimId);
                    } catch (Exception feignEx) {
                        log.warn("⚠️ Claim status notification via Feign failed, falling back to RabbitMQ: {}", feignEx.getMessage());
                        com.group2.claims_service.dto.NotificationEvent evt = new com.group2.claims_service.dto.NotificationEvent(user.getEmail(), subject, body);
                        rabbitTemplate.convertAndSend("notification.exchange", "notification.email", evt);
                        log.info("Published notification event for claimId: {} to RabbitMQ", claimId);
                    }
                }
            } catch(Exception e) {
                log.error("Failed to send notification for claimId {}: {}", claimId, e.getMessage());
            }
        }
    }

    private void populateHasDocument(ClaimResponseDTO dto) {
        if (dto != null && dto.getClaimId() != null) {
            dto.setHasDocument(documentRepository.existsByClaimId(dto.getClaimId()));
        }
    }

    private void populateAdminRemark(ClaimResponseDTO dto, Claim claim) {
        if (dto != null && claim != null) {
            dto.setAdminRemark(claim.getAdminRemark());
        }
    }

    public List<ClaimResponseDTO> getClaimsByUserId(Long userId) {
        return claimRepository.findByUserId(userId)
                .stream()
                .map(c -> {
                    ClaimResponseDTO r = claimMapper.mapToResponse(c);
                    populateHasDocument(r);
                    populateAdminRemark(r, c);
                    r.setMessage("Claim fetched successfully");
                    return r;
                })
                .toList();
    }

    public List<ClaimResponseDTO> getAllClaims() {
        return claimRepository.findAll()
                .stream()
                .map(c -> {
                    ClaimResponseDTO r = claimMapper.mapToResponse(c);
                    populateHasDocument(r);
                    populateAdminRemark(r, c);
                    r.setMessage("Claim fetched successfully");
                    return r;
                })
                .toList();
    }

	public ClaimStatsDTO getClaimStats() {

	    long total = claimRepository.count();
	    long submitted = claimRepository.countByClaimStatus(ClaimStatus.SUBMITTED);
	    long approved = claimRepository.countByClaimStatus(ClaimStatus.APPROVED);
	    long rejected = claimRepository.countByClaimStatus(ClaimStatus.REJECTED);

	    ClaimStatsDTO stats = new ClaimStatsDTO();
	    stats.setTotalClaims(total);
	    stats.setSubmittedClaims(submitted);
	    stats.setApprovedClaims(approved);
	    stats.setRejectedClaims(rejected);

	    return stats;
	}

    public void cancelClaimsByPolicy(Long policyId) {
        List<Claim> claims = claimRepository.findByPolicyId(policyId);
        for (Claim claim : claims) {
            if (claim.getClaimStatus() == ClaimStatus.SUBMITTED) {
                claim.setClaimStatus(ClaimStatus.REJECTED);
                claimRepository.save(claim);
                log.info("❌ Claim #{} rejected due to Policy Cancellation request.", claim.getId());
            }
        }
    }
}
