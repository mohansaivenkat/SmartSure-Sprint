package com.group2.policy_service.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import com.group2.policy_service.dto.PageResponseDTO;
import com.group2.policy_service.dto.PolicyResponseDTO;
import com.group2.policy_service.dto.PolicyStatsDTO;
import com.group2.policy_service.dto.UserPolicyResponseDTO;
import com.group2.policy_service.entity.PolicyType;
import com.group2.policy_service.service.IPolicyQueryService;

@ExtendWith(MockitoExtension.class)
public class PolicyQueryControllerTest {

    @Mock
    private IPolicyQueryService queryService;

    @InjectMocks
    private PolicyQueryController controller;

    @Test
    void testGetAllPolicies() {
        when(queryService.getAllPolicies()).thenReturn(Collections.singletonList(new PolicyResponseDTO()));
        List<PolicyResponseDTO> res = controller.getAllPolicies();
        assertEquals(1, res.size());
    }

    @Test
    void testSearchPolicies() {
        PageResponseDTO<PolicyResponseDTO> page = new PageResponseDTO<>(Collections.emptyList(), 0, 10, 0L, 0, true);
        when(queryService.searchPolicies(anyString(), anyString(), anyInt(), anyInt())).thenReturn(page);
        
        ResponseEntity<PageResponseDTO<PolicyResponseDTO>> res = controller.searchPolicies("ALL", "", 0, 10);
        assertEquals(200, res.getStatusCode().value());
        assertEquals(page, res.getBody());
    }

    @Test
    void testGetPoliciesByUserId() {
        when(queryService.getPoliciesByUserId(1L)).thenReturn(Collections.singletonList(new UserPolicyResponseDTO()));
        
        List<UserPolicyResponseDTO> res = controller.getUserPolicies(1L);
        assertEquals(1, res.size());
    }

    @Test
    void testGetPoliciesByUserIdPaginated() {
        PageResponseDTO<UserPolicyResponseDTO> page = new PageResponseDTO<>(Collections.emptyList(), 0, 6, 0L, 0, true);
        when(queryService.getPoliciesByUserIdPaginated(1L, "ALL", 0, 6)).thenReturn(page);
        
        ResponseEntity<PageResponseDTO<UserPolicyResponseDTO>> res = controller.getUserPoliciesPaginated(1L, "ALL", 0, 6);
        assertEquals(200, res.getStatusCode().value());
        assertEquals(page, res.getBody());
    }

    @Test
    void testGetAllUserPolicies() {
        when(queryService.getAllUserPolicies()).thenReturn(Arrays.asList(new UserPolicyResponseDTO(), new UserPolicyResponseDTO()));
        List<UserPolicyResponseDTO> res = controller.getAllUserPolicies();
        assertEquals(2, res.size());
    }

    @Test
    void testGetUserPolicyById() {
        UserPolicyResponseDTO dto = new UserPolicyResponseDTO();
        when(queryService.getUserPolicyById(1L)).thenReturn(dto);
        ResponseEntity<UserPolicyResponseDTO> res = controller.getUserPolicyById(1L);
        assertEquals(200, res.getStatusCode().value());
        assertEquals(dto, res.getBody());
    }

    @Test
    void testGetPolicyTypes() {
        when(queryService.getAllPolicyTypes()).thenReturn(Collections.singletonList(new PolicyType()));
        List<PolicyType> res = controller.getAllPolicyTypes();
        assertEquals(1, res.size());
    }

    @Test
    void testGetPolicyById() {
        PolicyResponseDTO dto = new PolicyResponseDTO();
        when(queryService.getPolicyById(10L)).thenReturn(dto);
        PolicyResponseDTO res = controller.getPolicy(10L);
        assertEquals(dto, res);
    }

    @Test
    void testGetPolicyStats() {
        PolicyStatsDTO dto = new PolicyStatsDTO();
        when(queryService.getPolicyStats()).thenReturn(dto);
        ResponseEntity<PolicyStatsDTO> res = controller.getPolicyStats();
        assertEquals(200, res.getStatusCode().value());
        assertEquals(dto, res.getBody());
    }

    @Test
    void testGetAllUserPoliciesPaginated() {
        PageResponseDTO<UserPolicyResponseDTO> page = new PageResponseDTO<>(Collections.emptyList(), 0, 10, 0L, 0, true);
        when(queryService.getAllUserPoliciesPaginated(0, 10)).thenReturn(page);
        
        ResponseEntity<PageResponseDTO<UserPolicyResponseDTO>> res = controller.getAllUserPoliciesPaginated(0, 10);
        assertEquals(200, res.getStatusCode().value());
        assertEquals(page, res.getBody());
    }
}
