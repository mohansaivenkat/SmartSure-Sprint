package com.group2.claims_service.service.impl;

import com.group2.claims_service.service.IClaimService;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import lombok.extern.slf4j.Slf4j;

import com.group2.claims_service.dto.ClaimCreatedEvent;
import com.group2.claims_service.dto.ClaimRequestDTO;
import com.group2.claims_service.dto.ClaimResponseDTO;
import com.group2.claims_service.dto.ClaimStatsDTO;
import com.group2.claims_service.entity.Claim;
import com.group2.claims_service.entity.ClaimDocument;
import com.group2.claims_service.entity.ClaimStatus;
import com.group2.claims_service.exception.ClaimNotFoundException;
import com.group2.claims_service.repository.ClaimDocumentRepository;
import com.group2.claims_service.repository.ClaimRepository;
import com.group2.claims_service.util.ClaimMapper;


@Service
@Slf4j
public class ClaimServiceImpl implements IClaimService {
	
	private final ClaimRepository claimRepository;
	private final ClaimDocumentRepository documentRepository;
	private final com.group2.claims_service.feign.AuthClient authClient;
	private final RabbitTemplate rabbitTemplate;
	private final ClaimMapper claimMapper;
	
	public ClaimServiceImpl(ClaimRepository claimRepository, 
                            ClaimDocumentRepository documentRepository, 
                            com.group2.claims_service.feign.AuthClient authClient,
                            RabbitTemplate rabbitTemplate,
                            ClaimMapper claimMapper) {
		this.claimRepository = claimRepository;
		this.documentRepository = documentRepository;
		this.authClient = authClient;
		this.rabbitTemplate = rabbitTemplate;
		this.claimMapper = claimMapper;
	}
	
	public ClaimResponseDTO initateClaim(ClaimRequestDTO requestDTO) {

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
		response.setMessage("Claim Status fetched Successfully");
		
		return response;
	}
	
	public ClaimResponseDTO getClaimById(Long claimId) {

	    Claim claim = claimRepository.findById(claimId)
	            .orElseThrow(() ->
	                    new ClaimNotFoundException("Claim not found with id: " + claimId));

	    ClaimResponseDTO response = claimMapper.mapToResponse(claim);
	    response.setMessage("Claim fetched successfully");

	    return response;
	}
	
	public void updateClaimStatus(Long claimId, String newStatus) {

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
		claimRepository.save(claim);

		if (targetStatus == ClaimStatus.APPROVED || targetStatus == ClaimStatus.REJECTED) {
			log.info("Status transition to {}, publishing notification event for claimId: {}", targetStatus, claimId);
			try {
				com.group2.claims_service.feign.UserDTO user = authClient.getUserById(claim.getUserId());
				if (user != null && user.getEmail() != null) {
					String subject = "Claim " + targetStatus;
					String body = "Your claim with ID " + claim.getId() + " has been " + targetStatus + ".";
					com.group2.claims_service.dto.NotificationEvent evt = new com.group2.claims_service.dto.NotificationEvent(user.getEmail(), subject, body);
					rabbitTemplate.convertAndSend("notification.exchange", "notification.email", evt);
					log.info("Published notification event for claimId: {} to RabbitMQ", claimId);
				} else {
					log.warn("Could not find user email for userId: {}, claim notification skipped", claim.getUserId());
				}
			} catch(Exception e) {
				log.error("Failed to send notification event for claimId {}: {}", claimId, e.getMessage());
			}
		}
	}
	
	public List<ClaimResponseDTO> getClaimsByUserId(Long userId) {
		return claimRepository.findByUserId(userId)
				.stream()
				.map(claimMapper::mapToResponse)
				.peek(dto -> dto.setMessage("Claim fetched successfully"))
				.toList();
	}

	public List<ClaimResponseDTO> getAllClaims() {
		return claimRepository.findAll()
				.stream()
				.map(claimMapper::mapToResponse)
				.peek(dto -> dto.setMessage("Claim fetched successfully"))
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
