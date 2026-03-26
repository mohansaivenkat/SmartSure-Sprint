package com.group2.policy_service.dto;

import java.io.Serializable;

public class PolicyResponseDTO implements Serializable {

    private static final long serialVersionUID = 1L;

	private Long id;
	private String policyName;
	private String description;
	private Double premiumAmount;
	private Double coverageAmount;
	private Integer durationInMonths;
	private Long policyTypeId;
	private String policyCategory;

	public Long getPolicyTypeId() {
		return policyTypeId;
	}

	public void setPolicyTypeId(Long policyTypeId) {
		this.policyTypeId = policyTypeId;
	}

	public String getPolicyCategory() {
		return policyCategory;
	}

	public void setPolicyCategory(String policyCategory) {
		this.policyCategory = policyCategory;
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getPolicyName() {
		return policyName;
	}

	public void setPolicyName(String policyName) {
		this.policyName = policyName;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public Double getPremiumAmount() {
		return premiumAmount;
	}

	public void setPremiumAmount(Double premiumAmount) {
		this.premiumAmount = premiumAmount;
	}

	public Double getCoverageAmount() {
		return coverageAmount;
	}

	public void setCoverageAmount(Double coverageAmount) {
		this.coverageAmount = coverageAmount;
	}

	public Integer getDurationInMonths() {
		return durationInMonths;
	}

	public void setDurationInMonths(Integer durationInMonths) {
		this.durationInMonths = durationInMonths;
	}

}
