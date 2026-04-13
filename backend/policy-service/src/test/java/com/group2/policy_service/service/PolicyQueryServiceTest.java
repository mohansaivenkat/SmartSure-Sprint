package com.group2.policy_service.service;

import com.group2.policy_service.service.impl.PolicyQueryServiceImpl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.group2.policy_service.dto.PolicyResponseDTO;
import com.group2.policy_service.dto.PolicyStatsDTO;
import com.group2.policy_service.dto.UserPolicyResponseDTO;
import com.group2.policy_service.dto.PageResponseDTO;
import com.group2.policy_service.entity.Policy;
import com.group2.policy_service.entity.PolicyType;
import com.group2.policy_service.entity.UserPolicy;
import com.group2.policy_service.repository.PolicyRepository;
import com.group2.policy_service.repository.PolicyTypeRepository;
import com.group2.policy_service.repository.UserPolicyRepository;
import com.group2.policy_service.util.PolicyMapper;

@ExtendWith(MockitoExtension.class)
public class PolicyQueryServiceTest {

    @Mock private PolicyRepository policyRepository;
    @Mock private UserPolicyRepository userPolicyRepository;
    @Mock private PolicyTypeRepository policyTypeRepository;
    @Mock private PolicyMapper mapper;

    @InjectMocks
    private PolicyQueryServiceImpl policyQueryService;

    private Policy mockPolicy;
    private UserPolicy mockUserPolicy;

    @BeforeEach
    void setUp() {
        mockPolicy = new Policy();
        mockPolicy.setId(10L);
        mockPolicy.setPolicyName("Health Plan");

        mockUserPolicy = new UserPolicy();
        mockUserPolicy.setId(5L);
        mockUserPolicy.setPolicy(mockPolicy);
        mockUserPolicy.setUserId(100L);
    }

    @Test
    void testGetPoliciesByUserId() {
        when(userPolicyRepository.findByUserId(100L)).thenReturn(Collections.singletonList(mockUserPolicy));
        when(mapper.mapToUserPolicyResponse(any())).thenReturn(new UserPolicyResponseDTO());
        List<UserPolicyResponseDTO> result = policyQueryService.getPoliciesByUserId(100L);
        assertEquals(1, result.size());
    }

    @Test
    void testSearchPolicies() {
        org.springframework.data.domain.Page<Policy> page = new org.springframework.data.domain.PageImpl<>(Collections.singletonList(mockPolicy));
        when(policyRepository.searchPolicies(any(), any(), any())).thenReturn(page);
        when(mapper.mapToPolicyResponse(any())).thenReturn(new PolicyResponseDTO());
        assertNotNull(policyQueryService.searchPolicies("cat", "q", 0, 10));
    }

    @Test
    void testGetPoliciesByUserIdPaginated() {
        org.springframework.data.domain.Page<UserPolicy> page = new org.springframework.data.domain.PageImpl<>(Collections.singletonList(mockUserPolicy));
        when(userPolicyRepository.findByUserIdAndStatus(anyLong(), any(), any())).thenReturn(page);
        when(userPolicyRepository.findByUserId(anyLong(), any())).thenReturn(page);
        when(mapper.mapToUserPolicyResponse(any())).thenReturn(new UserPolicyResponseDTO());
        
        assertNotNull(policyQueryService.getPoliciesByUserIdPaginated(1L, "ACTIVE", 0, 10));
        assertNotNull(policyQueryService.getPoliciesByUserIdPaginated(1L, "ALL", 0, 10));
    }

    @Test
    void testGetAllPolicies() {
        when(policyRepository.findByActiveTrue()).thenReturn(Collections.singletonList(mockPolicy));
        when(mapper.mapToPolicyResponse(any())).thenReturn(new PolicyResponseDTO());
        assertEquals(1, policyQueryService.getAllPolicies().size());
    }

    @Test
    void testGetAllPolicyTypes() {
        when(policyTypeRepository.findAll()).thenReturn(Arrays.asList(new PolicyType()));
        assertEquals(1, policyQueryService.getAllPolicyTypes().size());
    }

    @Test
    void testGetPolicyStats() {
        when(policyRepository.count()).thenReturn(15L);
        when(userPolicyRepository.sumPremiumAmount()).thenReturn(null);
        PolicyStatsDTO stats = policyQueryService.getPolicyStats();
        assertEquals(15L, stats.getTotalPolicies());
        assertEquals(0.0, stats.getTotalRevenue());
        
        when(userPolicyRepository.sumPremiumAmount()).thenReturn(5000.0);
        assertEquals(5000.0, policyQueryService.getPolicyStats().getTotalRevenue());
    }

    @Test
    void testGetPolicyById() {
        when(policyRepository.findById(10L)).thenReturn(Optional.of(mockPolicy));
        when(mapper.mapToPolicyResponse(any())).thenReturn(new PolicyResponseDTO());
        assertNotNull(policyQueryService.getPolicyById(10L));
        
        when(policyRepository.findById(2L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> policyQueryService.getPolicyById(2L));
    }

    @Test
    void testGetUserPolicyById() {
        when(userPolicyRepository.findById(1L)).thenReturn(Optional.of(mockUserPolicy));
        when(mapper.mapToUserPolicyResponse(any())).thenReturn(new UserPolicyResponseDTO());
        assertNotNull(policyQueryService.getUserPolicyById(1L));
        
        when(userPolicyRepository.findById(2L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> policyQueryService.getUserPolicyById(2L));
    }

    @Test
    void testGetAllUserPolicies() {
        when(userPolicyRepository.findAll()).thenReturn(Collections.singletonList(mockUserPolicy));
        when(mapper.mapToUserPolicyResponse(any())).thenReturn(new UserPolicyResponseDTO());
        assertEquals(1, policyQueryService.getAllUserPolicies().size());
    }

    @Test
    void testGetPoliciesByUserIdPaginated_NullStatus() {
        org.springframework.data.domain.Page<UserPolicy> page = new org.springframework.data.domain.PageImpl<>(Collections.singletonList(mockUserPolicy));
        when(userPolicyRepository.findByUserId(anyLong(), any())).thenReturn(page);
        when(mapper.mapToUserPolicyResponse(any())).thenReturn(new UserPolicyResponseDTO());
        
        assertNotNull(policyQueryService.getPoliciesByUserIdPaginated(1L, null, 0, 10));
        assertNotNull(policyQueryService.getPoliciesByUserIdPaginated(1L, "", 0, 10));
    }

    @Test
    void testGetAllUserPoliciesPaginated() {
        org.springframework.data.domain.Page<UserPolicy> page = new org.springframework.data.domain.PageImpl<>(Collections.singletonList(mockUserPolicy));
        when(userPolicyRepository.findAll(any(org.springframework.data.domain.Pageable.class))).thenReturn(page);
        when(mapper.mapToUserPolicyResponse(any())).thenReturn(new UserPolicyResponseDTO());
        
        PageResponseDTO<UserPolicyResponseDTO> result = policyQueryService.getAllUserPoliciesPaginated(0, 10);
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
    }
}
