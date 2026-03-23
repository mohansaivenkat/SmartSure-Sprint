package com.group2.policy_service.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import com.group2.policy_service.dto.PolicyRequestDTO;
import com.group2.policy_service.dto.PolicyResponseDTO;
import com.group2.policy_service.dto.PolicyStatsDTO;
import com.group2.policy_service.dto.UserPolicyResponseDTO;
import com.group2.policy_service.entity.Policy;
import com.group2.policy_service.entity.PolicyStatus;
import com.group2.policy_service.entity.PolicyType;
import com.group2.policy_service.entity.UserPolicy;
import com.group2.policy_service.repository.PolicyRepository;
import com.group2.policy_service.repository.PolicyTypeRepository;
import com.group2.policy_service.repository.UserPolicyRepository;
import com.group2.policy_service.security.SecurityConfig;

@ExtendWith(MockitoExtension.class)
public class PolicyServiceTest {

    @Mock
    private PolicyRepository policyRepository;

    @Mock
    private UserPolicyRepository userPolicyRepository;

    @Mock
    private PolicyTypeRepository policyTypeRepository;

    @Mock
    private SecurityConfig securityConfig; // Needed to prevent NPE if constructor requires it

    @InjectMocks
    private PolicyService policyService;

    private Policy mockPolicy;
    private UserPolicy mockUserPolicy;

    @BeforeEach
    void setUp() {
        mockPolicy = new Policy();
        mockPolicy.setId(10L);
        mockPolicy.setPolicyName("Health Plan");
        mockPolicy.setDurationInMonths(12);
        mockPolicy.setPremiumAmount(100.0);

        mockUserPolicy = new UserPolicy();
        mockUserPolicy.setId(5L);
        mockUserPolicy.setPolicy(mockPolicy);
        mockUserPolicy.setUserId(100L);
        mockUserPolicy.setStatus(PolicyStatus.ACTIVE);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    /**
     * Given: Data in repository
     * When: getPoliciesByUserId is called
     * Then: Returns list of user policies
     */
    @Test
    void testGetPoliciesByUserId() {
        when(userPolicyRepository.findByUserId(100L)).thenReturn(Collections.singletonList(mockUserPolicy));

        List<UserPolicyResponseDTO> result = policyService.getPoliciesByUserId(100L);

        assertEquals(1, result.size());
        assertEquals(5L, result.get(0).getId());
    }

    /**
     * Given: Active Policies
     * When: getAllPolicies is called
     * Then: Returns active policies
     */
    @Test
    void testGetAllPolicies() {
        when(policyRepository.findByActiveTrue()).thenReturn(Collections.singletonList(mockPolicy));

        List<PolicyResponseDTO> result = policyService.getAllPolicies();

        assertEquals(1, result.size());
        assertEquals("Health Plan", result.get(0).getPolicyName());
    }

    /**
     * Given: PolicyTypes in DB
     * When: getAllPolicyTypes is called
     * Then: Returns all policy types
     */
    @Test
    void testGetAllPolicyTypes() {
        when(policyTypeRepository.findAll()).thenReturn(Arrays.asList(new PolicyType(), new PolicyType()));

        List<PolicyType> types = policyService.getAllPolicyTypes();

        assertEquals(2, types.size());
    }

    /**
     * Given: Valid policyId and logged-in user
     * When: purchasePolicy is called
     * Then: Saves user policy and returns DTO
     */
    @Test
    void testPurchasePolicy() {
        // Mock Security Context
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(200L); // Current user ID
        SecurityContext context = mock(SecurityContext.class);
        when(context.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(context);

        when(policyRepository.findById(10L)).thenReturn(Optional.of(mockPolicy));
        when(userPolicyRepository.save(any(UserPolicy.class))).thenReturn(new UserPolicy());

        UserPolicyResponseDTO response = policyService.purchasePolicy(10L);

        assertNotNull(response);
        assertEquals(200L, response.getUserId());
        assertEquals(PolicyStatus.ACTIVE, response.getStatus());
        verify(userPolicyRepository, times(1)).save(any(UserPolicy.class));
    }

    /**
     * Given: Valid policy Request
     * When: createPolicy is called
     * Then: creates policy and saves
     */
    @Test
    void testCreatePolicy() {
        PolicyRequestDTO dto = new PolicyRequestDTO();
        dto.setPolicyTypeId(1L);
        dto.setPolicyName("New Plan");
        
        when(policyTypeRepository.findById(1L)).thenReturn(Optional.of(new PolicyType()));
        when(policyRepository.save(any(Policy.class))).thenReturn(mockPolicy);

        PolicyResponseDTO response = policyService.createPolicy(dto);

        assertNotNull(response);
        assertEquals("New Plan", response.getPolicyName());
        verify(policyRepository, times(1)).save(any(Policy.class));
    }

    /**
     * Given: Missing PolicyType ID
     * When: createPolicy is called
     * Then: Exception thrown
     */
    @Test
    void testCreatePolicy_TypeNotFound() {
        PolicyRequestDTO dto = new PolicyRequestDTO();
        dto.setPolicyTypeId(99L);
        
        when(policyTypeRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> policyService.createPolicy(dto));
    }

    /**
     * Given: Valid policy ID and update info
     * When: updatePolicy is called
     * Then: updates policy in repo
     */
    @Test
    void testUpdatePolicy() {
        PolicyRequestDTO dto = new PolicyRequestDTO();
        dto.setPolicyName("Updated Plan");

        when(policyRepository.findById(10L)).thenReturn(Optional.of(mockPolicy));
        
        PolicyResponseDTO response = policyService.updatePolicy(10L, dto);

        assertEquals("Updated Plan", response.getPolicyName());
        verify(policyRepository, times(1)).save(mockPolicy);
    }

    /**
     * Given: Valid Policy ID
     * When: deletePolicy is called
     * Then: marks active=false
     */
    @Test
    void testDeletePolicy() {
        when(policyRepository.findById(10L)).thenReturn(Optional.of(mockPolicy));

        policyService.deletePolicy(10L);

        verify(policyRepository, times(1)).save(mockPolicy);
    }

    /**
     * Given: Revenue data
     * When: getPolicyStats is called
     * Then: returns StatsDTO
     */
    @Test
    void testGetPolicyStats() {
        when(userPolicyRepository.count()).thenReturn(15L);
        when(userPolicyRepository.sumPremiumAmount()).thenReturn(5000.0);

        PolicyStatsDTO stats = policyService.getPolicyStats();

        assertEquals(15L, stats.getTotalPolicies());
        assertEquals(5000.0, stats.getTotalRevenue());
    }

    /**
     * Given: Valid User Policy ID
     * When: cancelPolicy is called
     * Then: Policy is CANCELLED
     */
    @Test
    void testCancelPolicy() {
        when(userPolicyRepository.findById(5L)).thenReturn(Optional.of(mockUserPolicy));

        UserPolicyResponseDTO response = policyService.cancelPolicy(5L);

        assertEquals(PolicyStatus.CANCELLED, response.getStatus());
        verify(userPolicyRepository, times(1)).save(mockUserPolicy);
    }

    /**
     * Given: Non-active policy
     * When: cancelPolicy is called
     * Then: Throws Error
     */
    @Test
    void testCancelPolicy_NotActive() {
        mockUserPolicy.setStatus(PolicyStatus.CANCELLED);
        when(userPolicyRepository.findById(5L)).thenReturn(Optional.of(mockUserPolicy));

        assertThrows(RuntimeException.class, () -> policyService.cancelPolicy(5L));
    }
}
