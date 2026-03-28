package com.group2.admin_service.service;

import java.util.List;
import org.springframework.http.ResponseEntity;
import com.group2.admin_service.dto.ClaimDTO;
import com.group2.admin_service.dto.PolicyDTO;
import com.group2.admin_service.dto.PolicyRequestDTO;
import com.group2.admin_service.dto.ReportResponse;
import com.group2.admin_service.dto.ReviewRequest;
import com.group2.admin_service.dto.UserDTO;

public interface IAdminService {
    void reviewClaim(Long claimId, ReviewRequest request);
    ClaimDTO getClaimStatus(Long claimId);
    List<ClaimDTO> getClaimsByUserId(Long userId);
    ResponseEntity<byte[]> downloadClaimDocument(Long claimId);
    List<ClaimDTO> getAllClaims();
    List<UserDTO> getAllUsers();
    PolicyDTO createPolicy(PolicyRequestDTO dto);
    PolicyDTO updatePolicy(Long id, PolicyRequestDTO dto);
    void deletePolicy(Long id);
    ReportResponse getReports();
}
