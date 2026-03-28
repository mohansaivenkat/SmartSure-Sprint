package com.group2.policy_service.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import com.group2.policy_service.dto.PolicyRequestDTO;
import com.group2.policy_service.dto.PolicyResponseDTO;
import com.group2.policy_service.dto.UserPolicyResponseDTO;
import com.group2.policy_service.service.IPolicyCommandService;

@ExtendWith(MockitoExtension.class)
public class PolicyCommandControllerTest {

    @Mock
    private IPolicyCommandService policyCommandService;

    @InjectMocks
    private PolicyCommandController policyCommandController;

    @Test
    void testPurchasePolicy() {
        UserPolicyResponseDTO response = new UserPolicyResponseDTO();
        when(policyCommandService.purchasePolicy(1L)).thenReturn(response);

        UserPolicyResponseDTO result = policyCommandController.purchasePolicy(1L);
        assertEquals(response, result);
    }

    @Test
    void testCreatePolicy() {
        PolicyResponseDTO response = new PolicyResponseDTO();
        when(policyCommandService.createPolicy(any(PolicyRequestDTO.class))).thenReturn(response);

        PolicyResponseDTO result = policyCommandController.createPolicy(new PolicyRequestDTO());
        assertEquals(response, result);
    }

    @Test
    void testUpdatePolicy() {
        PolicyResponseDTO response = new PolicyResponseDTO();
        when(policyCommandService.updatePolicy(eq(1L), any(PolicyRequestDTO.class))).thenReturn(response);

        PolicyResponseDTO result = policyCommandController.updatePolicy(1L, new PolicyRequestDTO());
        assertEquals(response, result);
    }

    @Test
    void testDeletePolicy() {
        doNothing().when(policyCommandService).deletePolicy(1L);

        policyCommandController.deletePolicy(1L);

        verify(policyCommandService, times(1)).deletePolicy(1L);
    }

    @Test
    void testRequestCancellation() {
        UserPolicyResponseDTO response = new UserPolicyResponseDTO();
        when(policyCommandService.requestCancellation(1L)).thenReturn(response);

        ResponseEntity<UserPolicyResponseDTO> result = policyCommandController.requestCancellation(1L);
        assertEquals(200, result.getStatusCode().value());
        assertEquals(response, result.getBody());
    }

    @Test
    void testApproveCancellation() {
        UserPolicyResponseDTO response = new UserPolicyResponseDTO();
        when(policyCommandService.approveCancellation(1L)).thenReturn(response);

        ResponseEntity<UserPolicyResponseDTO> result = policyCommandController.approveCancellation(1L);
        assertEquals(200, result.getStatusCode().value());
        assertEquals(response, result.getBody());
    }

    @Test
    void testPayPremium() {
        UserPolicyResponseDTO response = new UserPolicyResponseDTO();
        when(policyCommandService.payPremium(1L, 100.0)).thenReturn(response);

        ResponseEntity<UserPolicyResponseDTO> result = policyCommandController.payPremium(1L, 100.0);
        assertEquals(200, result.getStatusCode().value());
        assertEquals(response, result.getBody());
    }
}
