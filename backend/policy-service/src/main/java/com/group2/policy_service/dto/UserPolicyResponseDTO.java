package com.group2.policy_service.dto;

import java.io.Serializable;
import java.time.LocalDate;

import com.group2.policy_service.entity.PolicyStatus;

public class UserPolicyResponseDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private Long userId; 
    private String policyName;
    private PolicyStatus status;
    private LocalDate startDate;
    private LocalDate endDate;
    private Double premiumAmount;

    private Double outstandingBalance;
    private LocalDate nextDueDate;
    private Long policyId; 
    private Double coverageAmount;

	public Double getCoverageAmount() { return coverageAmount; }
	public void setCoverageAmount(Double coverageAmount) { this.coverageAmount = coverageAmount; }

	public Double getOutstandingBalance() { return outstandingBalance; }
	public void setOutstandingBalance(Double outstandingBalance) { this.outstandingBalance = outstandingBalance; }

	public LocalDate getNextDueDate() { return nextDueDate; }
	public void setNextDueDate(LocalDate nextDueDate) { this.nextDueDate = nextDueDate; }

	public Long getPolicyId() { return policyId; }
	public void setPolicyId(Long policyId) { this.policyId = policyId; }

	public Long getId() {
		return id;
	}
	public void setId(Long id) {
		this.id = id;
	}
	
	
	
	public Long getUserId() {
		return userId;
	}
	public void setUserId(Long userId) {
		this.userId = userId;
	}
	public String getPolicyName() {
		return policyName;
	}
	public void setPolicyName(String policyName) {
		this.policyName = policyName;
	}
	public PolicyStatus getStatus() {
		return status;
	}
	public void setStatus(PolicyStatus status) {
		this.status = status;
	}
	public LocalDate getStartDate() {
		return startDate;
	}
	public void setStartDate(LocalDate startDate) {
		this.startDate = startDate;
	}
	public LocalDate getEndDate() {
		return endDate;
	}
	public void setEndDate(LocalDate endDate) {
		this.endDate = endDate;
	}
	public Double getPremiumAmount() {
		return premiumAmount;
	}
	public void setPremiumAmount(Double premiumAmount) {
		this.premiumAmount = premiumAmount;
	}

    
    
}
