package com.group2.claims_service.service;

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
import com.group2.claims_service.repository.ClaimDocumentRepository;
import com.group2.claims_service.repository.ClaimRepository;

@Service
public class ClaimService {
	
	private final ClaimRepository claimRepository;
	private final ClaimDocumentRepository documentRepository;
	
	@Autowired
	private RabbitTemplate rabbitTemplate;
	
	
	public ClaimService(ClaimRepository claimRepository, ClaimDocumentRepository documentRepository) {
		this.claimRepository = claimRepository;
		this.documentRepository = documentRepository;
	}
	
	public ClaimResponseDTO initateClaim(ClaimRequestDTO requestDTO) {

	    // 1. Create Claim Entity
	    Claim claim = new Claim();
	    claim.setPolicyId(requestDTO.getPolicyId());
	    claim.setUserId(requestDTO.getUserId());
	    claim.setClaimAmount(requestDTO.getClaimAmount());
	    claim.setDescription(requestDTO.getDescription());
	    claim.setClaimStatus(ClaimStatus.SUBMITTED);
	    claim.setCreatedAt(LocalDateTime.now());

	    // 2. Save to DB
	    Claim savedClaim = claimRepository.save(claim);

	    // 3. Create Event DTO (for RabbitMQ)
	    ClaimCreatedEvent event = new ClaimCreatedEvent();
	    event.setClaimId(savedClaim.getId());
	    event.setPolicyId(savedClaim.getPolicyId());
	    event.setUserId(savedClaim.getUserId());
	    event.setClaimAmount(savedClaim.getClaimAmount());

	    // 4. Send Event to RabbitMQ
	    rabbitTemplate.convertAndSend(
	            "claim.exchange",
	            "claim.created",
	            event
	    );

	    System.out.println("✅ Claim event sent to RabbitMQ for claimId: " + savedClaim.getId());

	    // 5. Prepare API Response
	    ClaimResponseDTO response = new ClaimResponseDTO();
	    response.setClaimId(savedClaim.getId());
	    response.setPolicyId(savedClaim.getPolicyId());
	    response.setUserId(savedClaim.getUserId());
	    response.setClaimAmount(savedClaim.getClaimAmount());
	    response.setDescription(savedClaim.getDescription());
	    response.setStatus(savedClaim.getClaimStatus().name());
	    response.setMessage("Claim submitted successfully");

	    // 6. Return response
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
		document.setUploadedDate(LocalDateTime.now());
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
		
		
		ClaimResponseDTO response=new ClaimResponseDTO();
		response.setClaimId(claim.getId());
		response.setStatus(claim.getClaimStatus().name());
		response.setMessage("Claim Status fetched Successfully");
		
		response.setPolicyId(claim.getPolicyId());
		response.setUserId(claim.getUserId());
		response.setClaimAmount(claim.getClaimAmount());
		response.setDescription(claim.getDescription());
		
		return response;
		
	}
	
	public ClaimResponseDTO getClaimById(Long claimId) {

	    Claim claim = claimRepository.findById(claimId)
	            .orElseThrow(() ->
	                    new ClaimNotFoundException("Claim not found with id: " + claimId));

	    ClaimResponseDTO response = new ClaimResponseDTO();

	    response.setClaimId(claim.getId());
	    response.setStatus(claim.getClaimStatus().name());
	    response.setMessage("Claim fetched successfully");

	    response.setPolicyId(claim.getPolicyId());
	    response.setUserId(claim.getUserId());
	    response.setClaimAmount(claim.getClaimAmount());
	    response.setDescription(claim.getDescription());

	    return response;
	}
	
	// Update claim status (called by Admin Service via Feign)
	public void updateClaimStatus(Long claimId, String newStatus) {

		Claim claim = claimRepository.findById(claimId)
				.orElseThrow(() -> new ClaimNotFoundException("Claim not found with id: " + claimId));

		ClaimStatus targetStatus;
		try {
			targetStatus = ClaimStatus.valueOf(newStatus.toUpperCase());
		} catch (IllegalArgumentException e) {
			throw new RuntimeException("Invalid claim status: " + newStatus);
		}

		// Validate lifecycle transitions
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
	}
	
	// Get all claims for a specific user
	public List<ClaimResponseDTO> getClaimsByUserId(Long userId) {

		return claimRepository.findByUserId(userId)
				.stream()
				.map(claim -> {
					ClaimResponseDTO dto = new ClaimResponseDTO();
					dto.setClaimId(claim.getId());
					dto.setPolicyId(claim.getPolicyId());
					dto.setUserId(claim.getUserId());
					dto.setClaimAmount(claim.getClaimAmount());
					dto.setDescription(claim.getDescription());
					dto.setStatus(claim.getClaimStatus().name());
					dto.setMessage("Claim fetched successfully");
					return dto;
				})
				.toList();
	}

	// Get all claims in the system
	public List<ClaimResponseDTO> getAllClaims() {
		return claimRepository.findAll()
				.stream()
				.map(claim -> {
					ClaimResponseDTO dto = new ClaimResponseDTO();
					dto.setClaimId(claim.getId());
					dto.setPolicyId(claim.getPolicyId());
					dto.setUserId(claim.getUserId());
					dto.setClaimAmount(claim.getClaimAmount());
					dto.setDescription(claim.getDescription());
					dto.setStatus(claim.getClaimStatus().name());
					dto.setMessage("Claim fetched successfully");
					return dto;
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

}

