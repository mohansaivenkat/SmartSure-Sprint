package com.group2.policy_service.dto;

public class PurchasePolicyRequestDTO {

    private Long userId;
    private Long policyId;
    
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

    
}

