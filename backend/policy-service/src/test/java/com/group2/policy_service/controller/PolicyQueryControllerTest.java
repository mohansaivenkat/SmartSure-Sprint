package com.group2.policy_service.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import com.group2.policy_service.dto.PolicyResponseDTO;
import com.group2.policy_service.dto.PolicyStatsDTO;
import com.group2.policy_service.dto.UserPolicyResponseDTO;
import com.group2.policy_service.entity.PolicyType;
import com.group2.policy_service.service.IPolicyQueryService;

@ExtendWith(MockitoExtension.class)
public class PolicyQueryControllerTest {

    @Mock
    private IPolicyQueryService policyQueryService;

    @InjectMocks
    private PolicyQueryController policyQueryController;

    @Test
    void testGetAllPolicies() {
        when(policyQueryService.getAllPolicies()).thenReturn(Collections.singletonList(new PolicyResponseDTO()));

        List<PolicyResponseDTO> result = policyQueryController.getAllPolicies();
        assertEquals(1, result.size());
    }

    @Test
    void testGetAllPolicyTypes() {
        when(policyQueryService.getAllPolicyTypes()).thenReturn(Collections.singletonList(new PolicyType()));

        List<PolicyType> result = policyQueryController.getAllPolicyTypes();
        assertEquals(1, result.size());
    }

    @Test
    void testGetPolicy() {
        PolicyResponseDTO response = new PolicyResponseDTO();
        when(policyQueryService.getPolicyById(1L)).thenReturn(response);

        PolicyResponseDTO result = policyQueryController.getPolicy(1L);
        assertEquals(response, result);
    }

    @Test
    void testGetUserPolicies() {
        when(policyQueryService.getPoliciesByUserId(1L)).thenReturn(Collections.singletonList(new UserPolicyResponseDTO()));

        List<UserPolicyResponseDTO> result = policyQueryController.getUserPolicies(1L);
        assertEquals(1, result.size());
    }

    @Test
    void testGetAllUserPolicies() {
        when(policyQueryService.getAllUserPolicies()).thenReturn(Collections.singletonList(new UserPolicyResponseDTO()));

        List<UserPolicyResponseDTO> result = policyQueryController.getAllUserPolicies();
        assertEquals(1, result.size());
    }

    @Test
    void testGetPolicyStats() {
        PolicyStatsDTO stats = new PolicyStatsDTO();
        when(policyQueryService.getPolicyStats()).thenReturn(stats);

        ResponseEntity<PolicyStatsDTO> result = policyQueryController.getPolicyStats();
        assertEquals(200, result.getStatusCode().value());
        assertEquals(stats, result.getBody());
    }
}
