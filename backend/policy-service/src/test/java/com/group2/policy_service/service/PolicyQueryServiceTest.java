package com.group2.policy_service.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
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
import com.group2.policy_service.entity.Policy;
import com.group2.policy_service.entity.PolicyType;
import com.group2.policy_service.entity.UserPolicy;
import com.group2.policy_service.repository.PolicyRepository;
import com.group2.policy_service.repository.PolicyTypeRepository;
import com.group2.policy_service.repository.UserPolicyRepository;
import com.group2.policy_service.util.PolicyMapper;

@ExtendWith(MockitoExtension.class)
public class PolicyQueryServiceTest {

    @Mock
    private PolicyRepository policyRepository;

    @Mock
    private UserPolicyRepository userPolicyRepository;

    @Mock
    private PolicyTypeRepository policyTypeRepository;

    @Mock
    private PolicyMapper mapper;

    @InjectMocks
    private PolicyQueryService policyQueryService;

    private Policy mockPolicy;
    private UserPolicy mockUserPolicy;

    @BeforeEach
    void setUp() {
        mockPolicy = new Policy();
        mockPolicy.setId(10L);
        mockPolicy.setPolicyName("Health Plan");
        mockPolicy.setDurationInMonths(12);

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
    void testGetAllPolicies() {
        when(policyRepository.findByActiveTrue()).thenReturn(Collections.singletonList(mockPolicy));
        when(mapper.mapToPolicyResponse(any())).thenReturn(new PolicyResponseDTO());

        List<PolicyResponseDTO> result = policyQueryService.getAllPolicies();

        assertEquals(1, result.size());
    }

    @Test
    void testGetAllPolicyTypes() {
        when(policyTypeRepository.findAll()).thenReturn(Arrays.asList(new PolicyType(), new PolicyType()));

        List<PolicyType> types = policyQueryService.getAllPolicyTypes();

        assertEquals(2, types.size());
    }

    @Test
    void testGetPolicyStats() {
        when(policyRepository.count()).thenReturn(15L);
        when(userPolicyRepository.sumPremiumAmount()).thenReturn(5000.0);

        PolicyStatsDTO stats = policyQueryService.getPolicyStats();

        assertEquals(15L, stats.getTotalPolicies());
        assertEquals(5000.0, stats.getTotalRevenue());
    }

    @Test
    void testGetPolicyById() {
        when(policyRepository.findById(10L)).thenReturn(Optional.of(mockPolicy));
        when(mapper.mapToPolicyResponse(any())).thenReturn(new PolicyResponseDTO());

        PolicyResponseDTO result = policyQueryService.getPolicyById(10L);

        assertNotNull(result);
    }

    @Test
    void testGetAllUserPolicies1() {
        when(userPolicyRepository.findAll()).thenReturn(Collections.singletonList(mockUserPolicy));
        when(mapper.mapToUserPolicyResponse(any())).thenReturn(new UserPolicyResponseDTO());

        List<UserPolicyResponseDTO> result = policyQueryService.getAllUserPolicies();

        assertEquals(1, result.size());
    }

}