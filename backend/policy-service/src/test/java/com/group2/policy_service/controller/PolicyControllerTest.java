package com.group2.policy_service.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import com.group2.policy_service.dto.PolicyRequestDTO;
import com.group2.policy_service.dto.PolicyResponseDTO;
import com.group2.policy_service.dto.PolicyStatsDTO;
import com.group2.policy_service.dto.UserPolicyResponseDTO;
import com.group2.policy_service.entity.PolicyType;
import com.group2.policy_service.service.PolicyService;

@ExtendWith(MockitoExtension.class)
public class PolicyControllerTest {

    @Mock
    private PolicyService policyService;

    @InjectMocks
    private PolicyController policyController;

    /**
     * Given: Request for all policies
     * When: getAllPolicies is called
     * Then: Returns list of PolicyResponseDTO
     */
    @Test
    void testGetAllPolicies() {
        when(policyService.getAllPolicies()).thenReturn(Collections.singletonList(new PolicyResponseDTO()));

        List<PolicyResponseDTO> result = policyController.getAllPolicies();
        assertEquals(1, result.size());
    }

    /**
     * Given: Request for policy types
     * When: getAllPolicyTypes is called
     * Then: Returns list of PolicyType
     */
    @Test
    void testGetAllPolicyTypes() {
        when(policyService.getAllPolicyTypes()).thenReturn(Collections.singletonList(new PolicyType()));

        List<PolicyType> result = policyController.getAllPolicyTypes();
        assertEquals(1, result.size());
    }

    /**
     * Given: Policy ID
     * When: purchasePolicy is called
     * Then: Returns UserPolicyResponseDTO
     */
    @Test
    void testPurchasePolicy() {
        UserPolicyResponseDTO response = new UserPolicyResponseDTO();
        when(policyService.purchasePolicy(1L)).thenReturn(response);

        UserPolicyResponseDTO result = policyController.purchasePolicy(1L);
        assertEquals(response, result);
    }

    /**
     * Given: Policy ID
     * When: getPolicy is called
     * Then: Returns PolicyResponseDTO
     */
    @Test
    void testGetPolicy() {
        PolicyResponseDTO response = new PolicyResponseDTO();
        when(policyService.getPolicyById(1L)).thenReturn(response);

        PolicyResponseDTO result = policyController.getPolicy(1L);
        assertEquals(response, result);
    }

    /**
     * Given: User ID
     * When: getUserPolicies is called
     * Then: Returns list of UserPolicyResponseDTO
     */
    @Test
    void testGetUserPolicies() {
        when(policyService.getPoliciesByUserId(1L)).thenReturn(Collections.singletonList(new UserPolicyResponseDTO()));

        List<UserPolicyResponseDTO> result = policyController.getUserPolicies(1L);
        assertEquals(1, result.size());
    }

    /**
     * Given: PolicyRequestDTO
     * When: createPolicy is called
     * Then: Returns PolicyResponseDTO
     */
    @Test
    void testCreatePolicy() {
        PolicyResponseDTO response = new PolicyResponseDTO();
        when(policyService.createPolicy(any(PolicyRequestDTO.class))).thenReturn(response);

        PolicyResponseDTO result = policyController.createPolicy(new PolicyRequestDTO());
        assertEquals(response, result);
    }

    /**
     * Given: Policy ID and Update DTO
     * When: updatePolicy is called
     * Then: Returns updated PolicyResponseDTO
     */
    @Test
    void testUpdatePolicy() {
        PolicyResponseDTO response = new PolicyResponseDTO();
        when(policyService.updatePolicy(eq(1L), any(PolicyRequestDTO.class))).thenReturn(response);

        PolicyResponseDTO result = policyController.updatePolicy(1L, new PolicyRequestDTO());
        assertEquals(response, result);
    }

    /**
     * Given: Policy ID
     * When: deletePolicy is called
     * Then: Completes successfully
     */
    @Test
    void testDeletePolicy() {
        doNothing().when(policyService).deletePolicy(1L);

        policyController.deletePolicy(1L);

        verify(policyService, times(1)).deletePolicy(1L);
    }

    /**
     * Given: Request for stats
     * When: getPolicyStats is called
     * Then: Returns stats object
     */
    @Test
    void testGetPolicyStats() {
        PolicyStatsDTO stats = new PolicyStatsDTO();
        when(policyService.getPolicyStats()).thenReturn(stats);

        ResponseEntity<PolicyStatsDTO> result = policyController.getPolicyStats();
        assertEquals(200, result.getStatusCode().value());
        assertEquals(stats, result.getBody());
    }

    /**
     * Given: UserPolicy ID
     * When: cancelPolicy is called
     * Then: Returns updated UserPolicyResponseDTO
     */
    @Test
    void testCancelPolicy() {
        UserPolicyResponseDTO response = new UserPolicyResponseDTO();
        when(policyService.cancelPolicy(1L)).thenReturn(response);

        ResponseEntity<UserPolicyResponseDTO> result = policyController.cancelPolicy(1L);
        assertEquals(200, result.getStatusCode().value());
        assertEquals(response, result.getBody());
    }
}
