package com.group2.payment_service.dto;

public class PaymentResponse {
    private String orderId;
    private String status;
    private Double amount;
    private String message;

    public PaymentResponse() {
    }

    public PaymentResponse(String orderId, String status, Double amount, String message) {
        this.orderId = orderId;
        this.status = status;
        this.amount = amount;
        this.message = message;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
