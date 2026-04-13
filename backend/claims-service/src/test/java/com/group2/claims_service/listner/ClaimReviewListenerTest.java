package com.group2.claims_service.listner;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.group2.claims_service.dto.ClaimReviewEvent;
import com.group2.claims_service.service.IClaimService;

@ExtendWith(MockitoExtension.class)
public class ClaimReviewListenerTest {

    @Mock
    private IClaimService claimService;

    @InjectMocks
    private ClaimReviewListener claimReviewListener;

    /**
     * Given: A valid ClaimReviewEvent
     * When: handleClaimReview is called
     * Then: claimService updates status
     */
    @Test
    void testHandleClaimReview_Success() {
        ClaimReviewEvent event = new ClaimReviewEvent();
        event.setClaimId(1L);
        event.setStatus("APPROVED");
        event.setRemark("Test Remark");

        doNothing().when(claimService).updateClaimStatus(1L, "APPROVED", "Test Remark");

        claimReviewListener.handleClaimReview(event);

        verify(claimService, times(1)).updateClaimStatus(eq(1L), eq("APPROVED"), eq("Test Remark"));
    }

    /**
     * Given: Exception thrown by claimService
     * When: handleClaimReview is called
     * Then: Exception is swallowed (logged)
     */
    @Test
    void testHandleClaimReview_ExceptionSwallowed() {
        ClaimReviewEvent event = new ClaimReviewEvent();
        event.setClaimId(1L);
        event.setStatus("APPROVED");
        event.setRemark("Test Remark");

        doThrow(new RuntimeException("DB Error")).when(claimService).updateClaimStatus(1L, "APPROVED", "Test Remark");

        assertDoesNotThrow(() -> claimReviewListener.handleClaimReview(event));
        
        verify(claimService, times(1)).updateClaimStatus(eq(1L), eq("APPROVED"), eq("Test Remark"));
    }
}
