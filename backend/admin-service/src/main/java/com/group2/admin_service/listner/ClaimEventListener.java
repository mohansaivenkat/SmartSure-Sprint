package com.group2.admin_service.listner;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import com.group2.admin_service.dto.ClaimCreatedEvent;

@Component
public class ClaimEventListener {

    @RabbitListener(queues = "claim.created.queue")
    public void handleClaimCreated(ClaimCreatedEvent  claim) {
        System.out.println("New Claim Received: " + claim.getUserId() + " " + claim.getUserId());

        // You can store or notify admin dashboard
    }
}
