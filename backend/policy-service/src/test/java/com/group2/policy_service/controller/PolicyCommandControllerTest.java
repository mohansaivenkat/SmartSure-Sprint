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
import com.group2.policy_service.service.PolicyCommandService;

@ExtendWith(MockitoExtension.class)
public class PolicyCommandControllerTest {

    @Mock
    private PolicyCommandService commandService;

    @InjectMocks
    private PolicyCommandController commandController;

    @Test
    void testPurchasePolicy() {
        UserPolicyResponseDTO response = new UserPolicyResponseDTO();
        when(commandService.purchasePolicy(1L)).thenReturn(response);

        UserPolicyResponseDTO result = commandController.purchasePolicy(1L);
        assertEquals(response, result);
    }

    @Test
    void testCreatePolicy() {
        PolicyResponseDTO response = new PolicyResponseDTO();
        when(commandService.createPolicy(any(PolicyRequestDTO.class))).thenReturn(response);

        PolicyResponseDTO result = commandController.createPolicy(new PolicyRequestDTO());
        assertEquals(response, result);
    }

    @Test
    void testUpdatePolicy() {
        PolicyResponseDTO response = new PolicyResponseDTO();
        when(commandService.updatePolicy(eq(1L), any(PolicyRequestDTO.class))).thenReturn(response);

        PolicyResponseDTO result = commandController.updatePolicy(1L, new PolicyRequestDTO());
        assertEquals(response, result);
    }

    @Test
    void testDeletePolicy() {
        doNothing().when(commandService).deletePolicy(1L);

        commandController.deletePolicy(1L);

        verify(commandService, times(1)).deletePolicy(1L);
    }

    @Test
    void testRequestCancellation() {
        UserPolicyResponseDTO response = new UserPolicyResponseDTO();
        when(commandService.requestCancellation(1L)).thenReturn(response);

        ResponseEntity<UserPolicyResponseDTO> result = commandController.requestCancellation(1L);
        assertEquals(200, result.getStatusCode().value());
        assertEquals(response, result.getBody());
    }

    @Test
    void testApproveCancellation() {
        UserPolicyResponseDTO response = new UserPolicyResponseDTO();
        when(commandService.approveCancellation(1L)).thenReturn(response);

        ResponseEntity<UserPolicyResponseDTO> result = commandController.approveCancellation(1L);
        assertEquals(200, result.getStatusCode().value());
        assertEquals(response, result.getBody());
    }

    @Test
    void testPayPremium() {
        UserPolicyResponseDTO response = new UserPolicyResponseDTO();
        when(commandService.payPremium(1L, 100.0)).thenReturn(response);

        ResponseEntity<UserPolicyResponseDTO> result = commandController.payPremium(1L, 100.0);
        assertEquals(200, result.getStatusCode().value());
        assertEquals(response, result.getBody());
    }
}
