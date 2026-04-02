package com.group2.claims_service.service.impl;

import com.group2.claims_service.service.IClaimService;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.group2.claims_service.dto.ClaimCreatedEvent;
import com.group2.claims_service.dto.ClaimRequestDTO;
import com.group2.claims_service.dto.ClaimResponseDTO;
import com.group2.claims_service.dto.ClaimStatsDTO;
import com.group2.claims_service.entity.Claim;
import com.group2.claims_service.entity.ClaimDocument;
import com.group2.claims_service.entity.ClaimStatus;
import com.group2.claims_service.exception.ClaimNotFoundException;
import com.group2.claims_service.feign.UserPolicyDTO;
import com.group2.claims_service.repository.ClaimDocumentRepository;
import com.group2.claims_service.repository.ClaimRepository;
import com.group2.claims_service.util.ClaimMapper;
import org.slf4j.*;

@Service
public class ClaimServiceImpl implements IClaimService {
	
	private final ClaimRepository claimRepository;
	private final ClaimDocumentRepository documentRepository;
	private final com.group2.claims_service.feign.AuthClient authClient;
	private final com.group2.claims_service.feign.PolicyClient policyClient;
	private final RabbitTemplate rabbitTemplate;
	private final ClaimMapper claimMapper;
	
	private static final Logger log = LoggerFactory.getLogger(ClaimServiceImpl.class);
	
	public ClaimServiceImpl(ClaimRepository claimRepository, 
                            ClaimDocumentRepository documentRepository, 
                            com.group2.claims_service.feign.AuthClient authClient,
                            com.group2.claims_service.feign.PolicyClient policyClient,
                            RabbitTemplate rabbitTemplate,
                            ClaimMapper claimMapper) {
		this.claimRepository = claimRepository;
		this.documentRepository = documentRepository;
		this.authClient = authClient;
		this.policyClient = policyClient;
		this.rabbitTemplate = rabbitTemplate;
		this.claimMapper = claimMapper;
	}
	
	public ClaimResponseDTO initateClaim(ClaimRequestDTO requestDTO) {
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
                throw new RuntimeException("Fraud detected: You do not own this policy.");
            }
        } catch (RuntimeException re) {
            throw re; // Rethrow business exceptions
        } catch (Exception e) {
            log.error("Policy verification failed for claim: {}", e.getMessage());
            throw new RuntimeException("Policy verification system is currently unavailable. Please try again later.");
        }

	    Claim claim = claimMapper.mapToEntity(requestDTO);
        claim.setClaimStatus(ClaimStatus.SUBMITTED);
        claim.setCreatedAt(LocalDateTime.now());

	    Claim savedClaim = claimRepository.save(claim);

	    ClaimCreatedEvent event = new ClaimCreatedEvent();
	    event.setClaimId(savedClaim.getId());
	    event.setPolicyId(savedClaim.getPolicyId());
	    event.setUserId(savedClaim.getUserId());
	    event.setClaimAmount(savedClaim.getClaimAmount());

	    rabbitTemplate.convertAndSend(
	            "claim.exchange",
	            "claim.created",
	            event
	    );

	    log.info("✅ Claim event sent to RabbitMQ for claimId: {}", savedClaim.getId());

	    ClaimResponseDTO response = claimMapper.mapToResponse(savedClaim);
	    response.setMessage("Claim submitted successfully");

	    return response;
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
                    
                    com.group2.claims_service.dto.NotificationEvent evt = new com.group2.claims_service.dto.NotificationEvent(user.getEmail(), subject, body);
                    rabbitTemplate.convertAndSend("notification.exchange", "notification.email", evt);
                    log.info("Published notification event for claimId: {} to RabbitMQ", claimId);
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
