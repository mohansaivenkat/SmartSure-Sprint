package com.group2.claims_service.listner;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import com.group2.claims_service.dto.ClaimReviewEvent;
import com.group2.claims_service.service.ClaimService;

@Component
public class ClaimReviewListener {

    private final ClaimService claimService;

    public ClaimReviewListener(ClaimService claimService) {
        this.claimService = claimService;
    }

    @RabbitListener(queues = "claim.review.queue")
    public void handleClaimReview(ClaimReviewEvent request) {

        try {
            claimService.updateClaimStatus(
                    request.getClaimId(),
                    request.getStatus()
            );

            System.out.println("✅ Claim updated via RabbitMQ");

        } catch (Exception e) {

            System.out.println("❌ Error processing message: " + e.getMessage());

            // VERY IMPORTANT: Don't throw exception
            // Otherwise it will retry infinitely
        }
    }
}
