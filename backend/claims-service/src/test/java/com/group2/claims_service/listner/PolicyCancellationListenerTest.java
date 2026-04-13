package com.group2.claims_service.listner;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.group2.claims_service.dto.PolicyCancellationEvent;
import com.group2.claims_service.service.IClaimService;

@ExtendWith(MockitoExtension.class)
class PolicyCancellationListenerTest {

    @Mock
    private IClaimService claimService;

    @InjectMocks
    private PolicyCancellationListener listener;

    @Test
    void handlePolicyCancellation_success() {
        PolicyCancellationEvent event = new PolicyCancellationEvent();
        event.setUserPolicyId(99L);

        assertDoesNotThrow(() -> listener.handlePolicyCancellation(event));

        verify(claimService, times(1)).cancelClaimsByPolicy(eq(99L));
    }

    @Test
    void handlePolicyCancellation_logsOnFailure() {
        PolicyCancellationEvent event = new PolicyCancellationEvent();
        event.setUserPolicyId(100L);

        doThrow(new RuntimeException("db")).when(claimService).cancelClaimsByPolicy(100L);

        assertDoesNotThrow(() -> listener.handlePolicyCancellation(event));

        verify(claimService, times(1)).cancelClaimsByPolicy(eq(100L));
    }
}
