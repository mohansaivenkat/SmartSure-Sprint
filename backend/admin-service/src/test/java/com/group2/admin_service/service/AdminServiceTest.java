package com.group2.admin_service.service;

import com.group2.admin_service.service.impl.AdminServiceImpl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import com.group2.admin_service.dto.ClaimDTO;
import com.group2.admin_service.dto.ClaimReviewEvent;
import com.group2.admin_service.dto.ClaimStatusDTO;
import com.group2.admin_service.dto.PolicyDTO;
import com.group2.admin_service.dto.PolicyRequestDTO;
import com.group2.admin_service.dto.PolicyStatsDTO;
import com.group2.admin_service.dto.ReportResponse;
import com.group2.admin_service.dto.ReviewRequest;
import com.group2.admin_service.feign.ClaimsFeignClient;
import com.group2.admin_service.feign.PolicyFeignClient;
import com.group2.admin_service.feign.AuthFeignClient;
import com.group2.admin_service.util.AdminMapper;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
public class AdminServiceTest {

    @Mock
    private ClaimsFeignClient claimsFeignClient;

    @Mock
    private PolicyFeignClient policyFeignClient;

    @Mock
    private AuthFeignClient authFeignClient;

    @Mock
    private AdminMapper adminMapper;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @InjectMocks
    private AdminServiceImpl adminService;

    @BeforeEach
    void setUp() {
    }

    /**
     * Given: claimId and ReviewRequest
     * When: reviewClaim is called
     * Then: rabbitTemplate sends the ClaimReviewEvent
     */
    @Test
    void testReviewClaim() {
        ReviewRequest request = new ReviewRequest();
        request.setStatus("APPROVED");

        doNothing().when(rabbitTemplate).convertAndSend(eq("claim.exchange"), eq("claim.review"), any(ClaimReviewEvent.class));
        
        adminService.reviewClaim(1L, request);

        verify(rabbitTemplate, times(1)).convertAndSend(eq("claim.exchange"), eq("claim.review"), any(ClaimReviewEvent.class));
    }

    /**
     * Given: Exception during reviewClaim
     * When: recoverReviewClaim is called
     * Then: RuntimeException is thrown showing fallback
     */
    @Test
    void testRecoverReviewClaim() {
        assertThrows(RuntimeException.class, () -> 
            adminService.recoverReviewClaim(new Exception("Network Error"), 1L, new ReviewRequest())
        );
    }

    /**
     * Given: valid claimId
     * When: getClaimStatus is called
     * Then: Feign client fetches status
     */
    @Test
    void testGetClaimStatus() {
        ClaimDTO status = new ClaimDTO();
        when(claimsFeignClient.getClaimStatus(1L)).thenReturn(status);

        ClaimDTO result = adminService.getClaimStatus(1L);
        assertNotNull(result);
        verify(claimsFeignClient, times(1)).getClaimStatus(1L);
    }
    
    /**
     * Given: Exception while getting claim status
     * When: recoverGetClaimStatus is called
     * Then: returns an empty ClaimStatusDTO
     */
    @Test
    void testRecoverGetClaimStatus() {
        ClaimDTO result = adminService.recoverGetClaimStatus(new Exception("Fail"), 1L);
        assertNotNull(result);
    }

    /**
     * Given: valid userId
     * When: getClaimsByUserId is called
     * Then: Feign client returns claim list
     */
    @Test
    void testGetClaimsByUserId() {
        when(claimsFeignClient.getClaimsByUserId(1L)).thenReturn(Arrays.asList(new ClaimDTO(), new ClaimDTO()));
        List<ClaimDTO> result = adminService.getClaimsByUserId(1L);
        assertEquals(2, result.size());
    }

    /**
     * Given: Valid policy dto
     * When: createPolicy is called
     * Then: Returns created Policy
     */
    @Test
    void testCreatePolicy() {
        PolicyDTO dto = new PolicyDTO();
        when(policyFeignClient.createPolicy(any(PolicyRequestDTO.class))).thenReturn(dto);

        PolicyDTO result = adminService.createPolicy(new PolicyRequestDTO());
        assertNotNull(result);
    }

    /**
     * Given: Exception while creating policy
     * When: recoverCreatePolicy is called
     * Then: Throws RuntimeException
     */
    @Test
    void testRecoverCreatePolicy() {
        assertThrows(RuntimeException.class, () -> adminService.recoverCreatePolicy(new Exception(), new PolicyRequestDTO()));
    }

    /**
     * Given: valid policy id and update dto
     * When: updatePolicy is called
     * Then: Returns updated Policy
     */
    @Test
    void testUpdatePolicy() {
        PolicyDTO dto = new PolicyDTO();
        when(policyFeignClient.updatePolicy(eq(1L), any(PolicyRequestDTO.class))).thenReturn(dto);

        PolicyDTO result = adminService.updatePolicy(1L, new PolicyRequestDTO());
        assertNotNull(result);
    }
    
    /**
     * Given: Exception while updating policy
     * When: recoverUpdatePolicy is called
     * Then: Throws RuntimeException
     */
    @Test
    void testRecoverUpdatePolicy() {
        assertThrows(RuntimeException.class, () -> adminService.recoverUpdatePolicy(new Exception(), 1L, new PolicyRequestDTO()));
    }

    /**
     * Given: Valid policy id
     * When: deletePolicy is called
     * Then: Feign client delete is invoked
     */
    @Test
    void testDeletePolicy() {
        doNothing().when(policyFeignClient).deletePolicy(1L);
        adminService.deletePolicy(1L);
        verify(policyFeignClient, times(1)).deletePolicy(1L);
    }

    /**
     * Given: Exception while deleting policy
     * When: recoverDeletePolicy is called
     * Then: Throws RuntimeException
     */
    @Test
    void testRecoverDeletePolicy() {
        assertThrows(RuntimeException.class, () -> adminService.recoverDeletePolicy(new Exception(), 1L));
    }

    /**
     * Given: Feign Clients working correctly
     * When: getReports is called
     * Then: Fetches from claims and policy services and aggregates
     */
    @Test
    void testGetReports() {
        ClaimStatusDTO claimStats = new ClaimStatusDTO();
        claimStats.setTotalClaims(10);
        claimStats.setApprovedClaims(5);
        claimStats.setRejectedClaims(5);

        PolicyStatsDTO policyStats = new PolicyStatsDTO();
        policyStats.setTotalPolicies(20);
        policyStats.setTotalRevenue(50000.0);

        when(claimsFeignClient.getClaimStats()).thenReturn(claimStats);
        when(policyFeignClient.getPolicyStats()).thenReturn(policyStats);
        
        ReportResponse expectedReport = new ReportResponse();
        expectedReport.setTotalClaims(10);
        expectedReport.setApprovedClaims(5);
        expectedReport.setRejectedClaims(5);
        expectedReport.setTotalPolicies(20);
        expectedReport.setTotalRevenue(50000.0);
        
        when(adminMapper.mapToReportResponse(any(), any())).thenReturn(expectedReport);

        ReportResponse report = adminService.getReports();

        assertNotNull(report);
        assertEquals(10, report.getTotalClaims());
        assertEquals(5, report.getApprovedClaims());
        assertEquals(5, report.getRejectedClaims());
        assertEquals(20, report.getTotalPolicies());
        assertEquals(50000.0, report.getTotalRevenue());
    }

    /**
     * Given: Exception getting reports
     * When: recoverGetReports is called
     * Then: returns empty report
     */
    @Test
    void testRecoverGetReports() {
        ReportResponse report = adminService.recoverGetReports(new Exception());
        assertNotNull(report);
        assertEquals(0, report.getTotalClaims());
    }
}
