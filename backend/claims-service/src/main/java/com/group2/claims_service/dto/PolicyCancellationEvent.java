package com.group2.claims_service.dto;

import java.time.LocalDateTime;

public class PolicyCancellationEvent {
    private Long userPolicyId;
    private Long userId;
    private LocalDateTime timestamp;

    public PolicyCancellationEvent() {}

    public PolicyCancellationEvent(Long userPolicyId, Long userId, LocalDateTime timestamp) {
        this.userPolicyId = userPolicyId;
        this.userId = userId;
        this.timestamp = timestamp;
    }

    public Long getUserPolicyId() { return userPolicyId; }
    public void setUserPolicyId(Long userPolicyId) { this.userPolicyId = userPolicyId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
