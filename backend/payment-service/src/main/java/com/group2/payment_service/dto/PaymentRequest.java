package com.group2.payment_service.dto;

public class PaymentRequest {
    private Long userId;
    private Long policyId;
    private Double amount;

    public PaymentRequest() {
    }

    public PaymentRequest(Long userId, Long policyId, Double amount) {
        this.userId = userId;
        this.policyId = policyId;
        this.amount = amount;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getPolicyId() {
        return policyId;
    }

    public void setPolicyId(Long policyId) {
        this.policyId = policyId;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }
}
