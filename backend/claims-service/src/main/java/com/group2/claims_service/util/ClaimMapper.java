package com.group2.claims_service.util;

import com.group2.claims_service.dto.ClaimRequestDTO;
import com.group2.claims_service.dto.ClaimResponseDTO;
import com.group2.claims_service.entity.Claim;
import com.group2.claims_service.entity.ClaimStatus;
import org.springframework.stereotype.Component;

@Component
public class ClaimMapper {

    public Claim mapToEntity(ClaimRequestDTO dto) {
        if (dto == null) return null;
        Claim claim = new Claim();
        claim.setUserId(dto.getUserId());
        claim.setPolicyId(dto.getPolicyId());
        claim.setClaimAmount(dto.getClaimAmount());
        claim.setDescription(dto.getDescription());
        claim.setClaimStatus(ClaimStatus.SUBMITTED);
        return claim;
    }

    public ClaimResponseDTO mapToResponse(Claim claim) {
        if (claim == null) return null;
        ClaimResponseDTO dto = new ClaimResponseDTO();
        dto.setClaimId(claim.getId());
        dto.setUserId(claim.getUserId());
        dto.setPolicyId(claim.getPolicyId());
        dto.setClaimAmount(claim.getClaimAmount());
        dto.setDescription(claim.getDescription());
        dto.setStatus(claim.getClaimStatus() != null ? claim.getClaimStatus().name() : null);
        return dto;
    }
}
