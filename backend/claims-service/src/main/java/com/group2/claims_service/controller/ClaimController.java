package com.group2.claims_service.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.prepost.PreAuthorize;

import com.group2.claims_service.dto.ClaimRequestDTO;
import com.group2.claims_service.dto.ClaimResponseDTO;
import com.group2.claims_service.dto.ClaimStatsDTO;
import com.group2.claims_service.dto.ClaimStatusUpdateDTO;
import com.group2.claims_service.service.IClaimService;

@RestController
@RequestMapping("/api/claims")
public class ClaimController {
	
	private final IClaimService claimService;

	public ClaimController(IClaimService claimService) {
		this.claimService = claimService;
	}
	
	
	@PostMapping("/initiate")
	@PreAuthorize("hasRole('ADMIN') or principal.equals(#requestDTO.userId)")
	public ResponseEntity<ClaimResponseDTO> initiateClaim(@RequestBody ClaimRequestDTO requestDTO){
		
		ClaimResponseDTO response=claimService.initateClaim(requestDTO);
		
		return ResponseEntity.ok(response);
	}
	
	
	@PostMapping(value = "/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<String> uploadDocument(@RequestParam Long claimId, @RequestParam("file") MultipartFile file){
		
		String response=claimService.uploadDocument(claimId, file);
		
		return ResponseEntity.ok(response);
	}
	
	@org.springframework.transaction.annotation.Transactional(readOnly = true)
	@GetMapping("/{claimId}/document")
	public ResponseEntity<byte[]> downloadDocument(@PathVariable Long claimId) {
	    com.group2.claims_service.entity.ClaimDocument document = claimService.getClaimDocument(claimId);

	    String contentType = document.getDocumentType() != null 
	            ? document.getDocumentType() 
	            : "application/octet-stream";

	    // Check if it's an image
	    boolean isImage = contentType.startsWith("image/");

	    String disposition = isImage ? "inline" : "attachment";

	    return ResponseEntity.ok()
	            .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
	                    disposition + "; filename=\"" + document.getFileUrl() + "\"")
	            .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, contentType)
	            .body(document.getFileData());
	}
	
	@GetMapping("/status/{claimId}")
	public ResponseEntity<ClaimResponseDTO> getClaimStatus(@PathVariable Long claimId){
		
		ClaimResponseDTO response=claimService.getClaimStatus(claimId);
		
		return ResponseEntity.ok(response);
	}
	
	@GetMapping("/{claimId}")
	public ResponseEntity<ClaimResponseDTO> getClaimById(@PathVariable Long claimId) {

	    ClaimResponseDTO response = claimService.getClaimById(claimId);

	    return ResponseEntity.ok(response);
	}
	
	// Update claim status (called by Admin Service via Feign)
	@PutMapping("/{claimId}/status")
	public ResponseEntity<String> updateClaimStatus(
			@PathVariable Long claimId,
			@RequestBody ClaimStatusUpdateDTO dto) {
		
		claimService.updateClaimStatus(claimId, dto.getStatus(), dto.getRemark());
		return ResponseEntity.ok("Claim status updated successfully");
	}
	
	@GetMapping("/user/{userId}")
	@PreAuthorize("hasRole('ADMIN') or principal.equals(#userId)")
	public ResponseEntity<List<ClaimResponseDTO>> getClaimsByUserId(@PathVariable Long userId) {
		return ResponseEntity.ok(claimService.getClaimsByUserId(userId));
	}

	@GetMapping
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<List<ClaimResponseDTO>> getAllClaims() {
		return ResponseEntity.ok(claimService.getAllClaims());
	}
	
	// Stats endpoint (matches Feign client path /api/claims/stats)
	@GetMapping("/stats")
	public ResponseEntity<ClaimStatsDTO> getStats() {
	    return ResponseEntity.ok(claimService.getClaimStats());
	}
}
