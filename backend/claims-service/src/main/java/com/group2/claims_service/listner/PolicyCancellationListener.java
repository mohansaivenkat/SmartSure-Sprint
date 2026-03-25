package com.group2.claims_service.listner;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import com.group2.claims_service.dto.PolicyCancellationEvent;
import com.group2.claims_service.service.ClaimService;

@Component
public class PolicyCancellationListener {

    private final ClaimService claimService;

    public PolicyCancellationListener(ClaimService claimService) {
        this.claimService = claimService;
    }

    @RabbitListener(queues = "policy.cancellation.queue")
    public void handlePolicyCancellation(PolicyCancellationEvent event) {
        System.out.println("📬 Saga Stage 2: Received Policy Cancellation Event for Policy ID: " + event.getPolicyId());
        try {
            claimService.cancelClaimsByPolicy(event.getPolicyId());
            System.out.println("✅ Saga Stage 2: Claims synchronized for Policy ID: " + event.getPolicyId());
        } catch (Exception e) {
            System.err.println("❌ Saga Stage 2 Error: Failed to sync claims logic for policy: " + event.getPolicyId() + ". Reason: " + e.getMessage());
        }
    }
}
