package com.group2.policy_service.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.Arrays;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import com.group2.policy_service.dto.*;
import com.group2.policy_service.entity.*;
import com.group2.policy_service.feign.*;
import com.group2.policy_service.repository.*;
import com.group2.policy_service.service.impl.*;
import com.group2.policy_service.util.PolicyMapper;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class PolicyCommandServiceTest {

    @Mock private PolicyRepository policyRepository;
    @Mock private UserPolicyRepository userPolicyRepository;
    @Mock private PolicyTypeRepository policyTypeRepository;
    @Mock private PolicyMapper mapper;
    @Mock private AuthClient authClient;
    @Mock private RabbitTemplate rabbitTemplate;
    @Mock private AsyncNotificationService asyncNotificationService;

    @InjectMocks
    private PolicyCommandServiceImpl service;

    private Policy mockP;
    private UserPolicy mockUP;
    private UserDTO mockU;

    @BeforeEach
    void setUp() {
        mockP = new Policy(); mockP.setId(1L); mockP.setPolicyName("P"); mockP.setDurationInMonths(12); mockP.setPremiumAmount(10.0); mockP.setCoverageAmount(10.0); mockP.setActive(true);
        mockUP = new UserPolicy(); mockUP.setId(1L); mockUP.setUserId(100L); mockUP.setPolicy(mockP); mockUP.setStatus(PolicyStatus.ACTIVE); mockUP.setOutstandingBalance(0.0);
        mockU = new UserDTO(); mockU.setId(100L); mockU.setName("U"); mockU.setEmail("e@e.com");
        
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(100L);
        SecurityContext ctx = mock(SecurityContext.class);
        when(ctx.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(ctx);
        
        lenient().when(policyRepository.findById(anyLong())).thenReturn(Optional.of(mockP));
        lenient().when(userPolicyRepository.findById(anyLong())).thenReturn(Optional.of(mockUP));
        lenient().when(mapper.mapToUserPolicyResponse(any())).thenReturn(new UserPolicyResponseDTO());
        lenient().when(authClient.getUserById(anyLong())).thenReturn(mockU);
    }

    @AfterEach
    void tearDown() { SecurityContextHolder.clearContext(); }

    @Test
    void testPurchase_1() {
        UserPolicy up = new UserPolicy(); up.setPolicy(mockP); up.setStatus(PolicyStatus.ACTIVE);
        when(userPolicyRepository.findByUserId(100L)).thenReturn(Arrays.asList(up));
        assertThrows(RuntimeException.class, () -> service.purchasePolicy(1L));
    }
    
    @Test
    void testPurchase_2() {
        UserPolicy up = new UserPolicy(); up.setPolicy(mockP); up.setStatus(PolicyStatus.PENDING_CANCELLATION);
        when(userPolicyRepository.findByUserId(100L)).thenReturn(Arrays.asList(up));
        assertThrows(RuntimeException.class, () -> service.purchasePolicy(1L));
    }

    @Test
    void testPurchase_3() {
        UserPolicy up = new UserPolicy(); up.setPolicy(mockP); up.setStatus(PolicyStatus.CANCELLED);
        when(userPolicyRepository.findByUserId(100L)).thenReturn(Arrays.asList(up));
        service.purchasePolicy(1L);
    }

    @Test
    void testPurchase_4() {
        Policy p2 = new Policy(); p2.setId(99L);
        UserPolicy up2 = new UserPolicy(); up2.setPolicy(p2);
        when(userPolicyRepository.findByUserId(100L)).thenReturn(Arrays.asList(up2));
        service.purchasePolicy(1L);
    }

    @Test
    void testNotifyBranches() {
        reset(authClient); when(authClient.getUserById(anyLong())).thenReturn(null);
        service.purchasePolicy(1L);
        
        UserDTO u = new UserDTO(); u.setEmail(null);
        when(authClient.getUserById(anyLong())).thenReturn(u);
        service.purchasePolicy(1L);
        
        when(authClient.getUserById(anyLong())).thenThrow(new RuntimeException());
        service.purchasePolicy(1L);
    }

    @Test
    void testCancel_1() {
        mockUP.setUserId(999L);
        assertThrows(RuntimeException.class, () -> service.requestCancellation(1L, "R"));
    }

    @Test
    void testCancel_2() {
        mockUP.setStatus(PolicyStatus.CANCELLED);
        assertThrows(RuntimeException.class, () -> service.requestCancellation(1L, "R"));
    }

    @Test
    void testCancel_3() {
        doThrow(new RuntimeException()).when(rabbitTemplate).convertAndSend(anyString(), anyString(), any(Object.class));
        service.requestCancellation(1L, "R");
    }

    @Test
    void testApprove_1() {
        mockUP.setOutstandingBalance(10.0);
        assertThrows(RuntimeException.class, () -> service.approveCancellation(1L));
    }

    @Test
    void testApprove_2() {
        mockUP.setOutstandingBalance(null);
        service.approveCancellation(1L);
    }

    @Test
    void testApprove_3() {
        mockUP.setOutstandingBalance(0.0);
        service.approveCancellation(1L);
    }

    @Test
    void testPay_1() {
        mockUP.setOutstandingBalance(null);
        service.payPremium(1L, 1.0);
    }

    @Test
    void testPay_2() {
        mockUP.setOutstandingBalance(10.0);
        service.payPremium(1L, 1.0);
    }

    @Test
    void testUpdate_1() {
        PolicyRequestDTO d = new PolicyRequestDTO(); d.setPolicyTypeId(1L);
        when(policyTypeRepository.findById(1L)).thenReturn(Optional.of(new PolicyType()));
        service.updatePolicy(1L, d);
    }

    @Test
    void testPrincipalString() {
        Authentication auth = mock(Authentication.class); when(auth.getPrincipal()).thenReturn("100");
        SecurityContext ctx = mock(SecurityContext.class); when(ctx.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(ctx);
        service.purchasePolicy(1L);
    }

    @Test
    void testDeleteAndCreate() {
        service.deletePolicy(1L);
        PolicyRequestDTO d = new PolicyRequestDTO(); d.setPolicyTypeId(1L);
        when(policyTypeRepository.findById(1L)).thenReturn(Optional.of(new PolicyType()));
        service.createPolicy(d);
    }
}
