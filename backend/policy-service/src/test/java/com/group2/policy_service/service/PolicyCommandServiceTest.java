package com.group2.policy_service.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import com.group2.policy_service.dto.PolicyRequestDTO;
import com.group2.policy_service.dto.PolicyResponseDTO;
import com.group2.policy_service.dto.UserPolicyResponseDTO;
import com.group2.policy_service.entity.Policy;
import com.group2.policy_service.entity.PolicyStatus;
import com.group2.policy_service.entity.PolicyType;
import com.group2.policy_service.entity.UserPolicy;
import com.group2.policy_service.repository.PolicyRepository;
import com.group2.policy_service.repository.PolicyTypeRepository;
import com.group2.policy_service.repository.UserPolicyRepository;
import com.group2.policy_service.util.PolicyMapper;

@ExtendWith(MockitoExtension.class)
public class PolicyCommandServiceTest {

    @Mock
    private PolicyRepository policyRepository;

    @Mock
    private UserPolicyRepository userPolicyRepository;

    @Mock
    private PolicyTypeRepository policyTypeRepository;

    @Mock
    private PolicyMapper mapper;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @InjectMocks
    private PolicyCommandService policyCommandService;

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

    @Test
    void testPurchasePolicy() {
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(100L);
        SecurityContext context = mock(SecurityContext.class);
        when(context.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(context);

        when(policyRepository.findById(10L)).thenReturn(Optional.of(mockPolicy));
        when(userPolicyRepository.save(any(UserPolicy.class))).thenReturn(mockUserPolicy);
        when(mapper.mapToUserPolicyResponse(any(UserPolicy.class))).thenReturn(new UserPolicyResponseDTO());

        UserPolicyResponseDTO response = policyCommandService.purchasePolicy(10L);

        assertNotNull(response);
        verify(userPolicyRepository, times(1)).save(any(UserPolicy.class));
    }

    @Test
    void testRequestCancellation() {
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(100L);
        SecurityContext context = mock(SecurityContext.class);
        when(context.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(context);

        when(userPolicyRepository.findById(5L)).thenReturn(Optional.of(mockUserPolicy));
        when(mapper.mapToUserPolicyResponse(any(UserPolicy.class))).thenReturn(new UserPolicyResponseDTO());

        UserPolicyResponseDTO response = policyCommandService.requestCancellation(5L);

        assertNotNull(response);
        assertEquals(PolicyStatus.PENDING_CANCELLATION, mockUserPolicy.getStatus());
        verify(rabbitTemplate, times(1)).convertAndSend(any(String.class), any(String.class), any(Object.class));
    }

    @Test
    void testCreatePolicy() {
        PolicyRequestDTO dto = new PolicyRequestDTO();
        dto.setPolicyTypeId(1L);
        dto.setPolicyName("New Plan");
        
        when(policyTypeRepository.findById(1L)).thenReturn(Optional.of(new PolicyType()));
        when(policyRepository.save(any(Policy.class))).thenReturn(mockPolicy);
        when(mapper.mapToPolicyResponse(any(Policy.class))).thenReturn(new PolicyResponseDTO());

        PolicyResponseDTO response = policyCommandService.createPolicy(dto);

        assertNotNull(response);
        verify(policyRepository, times(1)).save(any(Policy.class));
    }

    @Test
    void testDeletePolicy() {
        when(policyRepository.findById(10L)).thenReturn(Optional.of(mockPolicy));

        policyCommandService.deletePolicy(10L);

        verify(policyRepository, times(1)).save(mockPolicy);
        assertEquals(false, mockPolicy.isActive());
    }
}
