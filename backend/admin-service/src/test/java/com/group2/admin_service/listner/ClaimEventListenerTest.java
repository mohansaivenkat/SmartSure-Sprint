package com.group2.admin_service.listner;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

import com.group2.admin_service.dto.ClaimCreatedEvent;

@ExtendWith(MockitoExtension.class)
public class ClaimEventListenerTest {

    @InjectMocks
    private ClaimEventListener claimEventListener;

    /**
     * Given: ClaimCreatedEvent
     * When: handleClaimCreated is called
     * Then: Should handle quietly and return successfully
     */
    @Test
    void testHandleClaimCreated() {
        ClaimCreatedEvent event = new ClaimCreatedEvent();
        event.setUserId(1L);
        event.setClaimId(10L);

        assertDoesNotThrow(() -> claimEventListener.handleClaimCreated(event));
    }
}
