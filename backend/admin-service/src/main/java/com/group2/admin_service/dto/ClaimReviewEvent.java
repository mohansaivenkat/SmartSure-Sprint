package com.group2.admin_service.dto;

public class ClaimReviewEvent {

    private Long claimId;
    private String status;

    public ClaimReviewEvent() {}

    public Long getClaimId() {
        return claimId;
    }

    public void setClaimId(Long claimId) {
        this.claimId = claimId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}