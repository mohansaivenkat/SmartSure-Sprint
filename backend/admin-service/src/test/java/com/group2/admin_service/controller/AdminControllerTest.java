package com.group2.admin_service.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.times;

import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import com.group2.admin_service.dto.ClaimDTO;
import com.group2.admin_service.dto.PolicyDTO;
import com.group2.admin_service.dto.PolicyRequestDTO;
import com.group2.admin_service.dto.ReportResponse;
import com.group2.admin_service.dto.ReviewRequest;
import com.group2.admin_service.dto.UserDTO;
import com.group2.admin_service.service.IAdminService;

@ExtendWith(MockitoExtension.class)
public class AdminControllerTest {

    @Mock
    private IAdminService adminService;

    @InjectMocks
    private AdminController adminController;

    private ReviewRequest reviewRequest;
    private ClaimDTO claimDTO;
    private List<ClaimDTO> claimList;
    private PolicyDTO policyDTO;
    private PolicyRequestDTO policyRequestDTO;
    private ReportResponse reportResponse;

    @BeforeEach
    void setUp() {
        reviewRequest = new ReviewRequest();
        reviewRequest.setStatus("APPROVED");

        claimDTO = new ClaimDTO();
        claimDTO.setClaimId(1L);
        claimDTO.setStatus("APPROVED");

        claimList = Arrays.asList(new ClaimDTO(), new ClaimDTO());

        policyDTO = new PolicyDTO();
        policyDTO.setId(1L);
        policyDTO.setPolicyName("Test Policy");

        policyRequestDTO = new PolicyRequestDTO();
        policyRequestDTO.setPolicyName("Test Policy Update");

        reportResponse = new ReportResponse();
        reportResponse.setTotalClaims(10);
    }

    /**
     * Given: claimId and reviewRequest
     * When: reviewClaim is called
     * Then: Returns successfully
     */
    @Test
    void testReviewClaim() {
        doNothing().when(adminService).reviewClaim(eq(1L), any(ReviewRequest.class));

        ResponseEntity<String> response = adminController.reviewClaim(1L, reviewRequest);

        assertEquals("Claim reviewed successfully", response.getBody());
        assertEquals(200, response.getStatusCode().value());
    }

    /**
     * Given: claimId
     * When: getStatus is called
     * Then: returns ClaimStatusDTO
     */
    @Test
    void testGetStatus() {
        when(adminService.getClaimStatus(1L)).thenReturn(claimDTO);

        ResponseEntity<ClaimDTO> response = adminController.getStatus(1L);

        assertEquals(claimDTO, response.getBody());
        assertEquals(200, response.getStatusCode().value());
    }

    /**
     * Given: userId
     * When: getClaimsByUser is called
     * Then: returns list of claims
     */
    @Test
    void testGetClaimsByUser() {
        when(adminService.getClaimsByUserId(1L)).thenReturn(claimList);

        ResponseEntity<List<ClaimDTO>> response = adminController.getClaimsByUser(1L);

        assertNotNull(response.getBody());
        assertEquals(2, response.getBody().size());
        assertEquals(200, response.getStatusCode().value());
    }

    /**
     * Given: policyRequestDTO
     * When: createPolicy is called
     * Then: returns created policy
     */
    @Test
    void testCreatePolicy() {
        when(adminService.createPolicy(any(PolicyRequestDTO.class))).thenReturn(policyDTO);

        ResponseEntity<PolicyDTO> response = adminController.createPolicy(policyRequestDTO);

        assertEquals(policyDTO, response.getBody());
        assertEquals(200, response.getStatusCode().value());
    }

    /**
     * Given: policyId and policyRequestDTO
     * When: updatePolicy is called
     * Then: returns updated policy
     */
    @Test
    void testUpdatePolicy() {
        when(adminService.updatePolicy(eq(1L), any(PolicyRequestDTO.class))).thenReturn(policyDTO);

        ResponseEntity<PolicyDTO> response = adminController.updatePolicy(1L, policyRequestDTO);

        assertEquals(policyDTO, response.getBody());
        assertEquals(200, response.getStatusCode().value());
    }

    /**
     * Given: policyId
     * When: deletePolicy is called
     * Then: Returns successfully
     */
    @Test
    void testDeletePolicy() {
        doNothing().when(adminService).deletePolicy(1L);

        ResponseEntity<String> response = adminController.deletePolicy(1L);

        assertEquals("Policy deleted successfully", response.getBody());
        verify(adminService, times(1)).deletePolicy(1L);
        assertEquals(200, response.getStatusCode().value());
    }

    /**
     * Given: valid request
     * When: getReports is called
     * Then: returns full reports
     */
    @Test
    void testGetReports() {
        when(adminService.getReports()).thenReturn(reportResponse);

        ResponseEntity<ReportResponse> response = adminController.getReports();

        assertEquals(reportResponse, response.getBody());
        assertEquals(200, response.getStatusCode().value());
    }
    
    @Test
    void testDownloadDocument() {
        when(adminService.downloadClaimDocument(1L)).thenReturn(ResponseEntity.ok(new byte[0]));
        ResponseEntity<byte[]> response = adminController.downloadDocument(1L);
        assertNotNull(response.getBody());
    }

    @Test
    void testGetAllClaims() {
        when(adminService.getAllClaims()).thenReturn(Arrays.asList(new ClaimDTO()));
        ResponseEntity<List<ClaimDTO>> response = adminController.getAllClaims();
        assertEquals(1, response.getBody().size());
    }

    @Test
    void testGetAllUsers() {
        when(adminService.getAllUsers()).thenReturn(Arrays.asList(new UserDTO()));
        ResponseEntity<List<UserDTO>> response = adminController.getAllUsers();
        assertEquals(1, response.getBody().size());
    }

    @Test
    void testGetFilteredUsers() {
        java.util.Map<String, Object> map = new java.util.HashMap<>();
        map.put("totalElements", 1);
        when(adminService.getFilteredUsers(0, 5, "", null, null)).thenReturn(map);
        ResponseEntity<java.util.Map<String, Object>> response = adminController.getFilteredUsers(0, 5, "", null, null);
        assertEquals(1, response.getBody().get("totalElements"));
    }
}
