package com.group2.claims_service.listner;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import com.group2.claims_service.dto.PolicyCancellationEvent;
import com.group2.claims_service.service.IClaimService;

@Component
public class PolicyCancellationListener {

    private final IClaimService claimService;

    public PolicyCancellationListener(IClaimService claimService) {
        this.claimService = claimService;
    }

    @RabbitListener(queues = "policy.cancellation.queue")
    public void handlePolicyCancellation(PolicyCancellationEvent event) {
        System.out.println("📬 Saga Stage 2: Received Policy Cancellation Event for UserPolicy ID: " + event.getUserPolicyId());
        try {
            claimService.cancelClaimsByPolicy(event.getUserPolicyId());
            System.out.println("✅ Saga Stage 2: Claims synchronized for UserPolicy ID: " + event.getUserPolicyId());
        } catch (Exception e) {
            System.err.println("❌ Saga Stage 2 Error: Failed to sync claims logic for policy: " + event.getUserPolicyId() + ". Reason: " + e.getMessage());
        }
    }
}
