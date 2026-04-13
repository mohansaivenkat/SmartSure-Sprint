package com.group2.claims_service.service;

import java.util.List;
import org.springframework.web.multipart.MultipartFile;
import com.group2.claims_service.dto.ClaimRequestDTO;
import com.group2.claims_service.dto.ClaimResponseDTO;
import com.group2.claims_service.dto.ClaimStatsDTO;
import com.group2.claims_service.entity.ClaimDocument;

import com.group2.claims_service.dto.PageResponseDTO;

public interface IClaimService {
    ClaimResponseDTO initiateClaim(ClaimRequestDTO requestDTO);
    String uploadDocument(Long claimId, MultipartFile file);
    ClaimDocument getClaimDocument(Long claimId);
    ClaimResponseDTO getClaimStatus(Long claimId);
    ClaimResponseDTO getClaimById(Long claimId);
    void updateClaimStatus(Long claimId, String newStatus, String remark);
    List<ClaimResponseDTO> getClaimsByUserId(Long userId);
    List<ClaimResponseDTO> getAllClaims();
    PageResponseDTO<ClaimResponseDTO> getAllClaimsPaginated(int page, int size, String query);
    PageResponseDTO<ClaimResponseDTO> getClaimsByUserIdPaginated(Long userId, int page, int size, String query);
    ClaimStatsDTO getClaimStats();
    void cancelClaimsByPolicy(Long policyId);
}
