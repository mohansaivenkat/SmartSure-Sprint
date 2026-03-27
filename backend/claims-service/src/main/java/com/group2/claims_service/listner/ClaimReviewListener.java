package com.group2.claims_service.listner;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import com.group2.claims_service.dto.ClaimReviewEvent;
import com.group2.claims_service.service.ClaimService;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class ClaimReviewListener {

    private final ClaimService claimService;

    public ClaimReviewListener(ClaimService claimService) {
        this.claimService = claimService;
    }

    @RabbitListener(queues = "claim.review.queue")
    public void handleClaimReview(ClaimReviewEvent request) {
        log.info("Received claim review event - claimId: {}, status: {}", request.getClaimId(), request.getStatus());
        try {
            claimService.updateClaimStatus(
                    request.getClaimId(),
                    request.getStatus()
            );
            log.info("Claim {} updated to status {} successfully", request.getClaimId(), request.getStatus());
        } catch (Exception e) {
            // Log full exception — NEVER hide errors silently
            log.error("Error processing claim review event for claimId {}: {}", request.getClaimId(), e.getMessage(), e);
        }
    }
}
