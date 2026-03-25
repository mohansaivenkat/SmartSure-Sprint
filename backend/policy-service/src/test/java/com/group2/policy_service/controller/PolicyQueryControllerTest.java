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
import com.group2.policy_service.service.PolicyQueryService;

@ExtendWith(MockitoExtension.class)
public class PolicyQueryControllerTest {

    @Mock
    private PolicyQueryService queryService;

    @InjectMocks
    private PolicyQueryController queryController;

    @Test
    void testGetAllPolicies() {
        when(queryService.getAllPolicies()).thenReturn(Collections.singletonList(new PolicyResponseDTO()));

        List<PolicyResponseDTO> result = queryController.getAllPolicies();
        assertEquals(1, result.size());
    }

    @Test
    void testGetAllPolicyTypes() {
        when(queryService.getAllPolicyTypes()).thenReturn(Collections.singletonList(new PolicyType()));

        List<PolicyType> result = queryController.getAllPolicyTypes();
        assertEquals(1, result.size());
    }

    @Test
    void testGetPolicy() {
        PolicyResponseDTO response = new PolicyResponseDTO();
        when(queryService.getPolicyById(1L)).thenReturn(response);

        PolicyResponseDTO result = queryController.getPolicy(1L);
        assertEquals(response, result);
    }

    @Test
    void testGetUserPolicies() {
        when(queryService.getPoliciesByUserId(1L)).thenReturn(Collections.singletonList(new UserPolicyResponseDTO()));

        List<UserPolicyResponseDTO> result = queryController.getUserPolicies(1L);
        assertEquals(1, result.size());
    }

    @Test
    void testGetAllUserPolicies() {
        when(queryService.getAllUserPolicies()).thenReturn(Collections.singletonList(new UserPolicyResponseDTO()));

        List<UserPolicyResponseDTO> result = queryController.getAllUserPolicies();
        assertEquals(1, result.size());
    }

    @Test
    void testGetPolicyStats() {
        PolicyStatsDTO stats = new PolicyStatsDTO();
        when(queryService.getPolicyStats()).thenReturn(stats);

        ResponseEntity<PolicyStatsDTO> result = queryController.getPolicyStats();
        assertEquals(200, result.getStatusCode().value());
        assertEquals(stats, result.getBody());
    }
}
