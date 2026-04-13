package com.group2.claims_service.dto;

public class ClaimStatsDTO {
    private long totalClaims;
    private long submittedClaims;
    private long approvedClaims;
    private long rejectedClaims;
    
	public long getTotalClaims() {
		return totalClaims;
	}
	public void setTotalClaims(long totalClaims) {
		this.totalClaims = totalClaims;
	}
	public long getSubmittedClaims() {
		return submittedClaims;
	}
	public void setSubmittedClaims(long submittedClaims) {
		this.submittedClaims = submittedClaims;
	}
	public long getApprovedClaims() {
		return approvedClaims;
	}
	public void setApprovedClaims(long approvedClaims) {
		this.approvedClaims = approvedClaims;
	}
	public long getRejectedClaims() {
		return rejectedClaims;
	}
	public void setRejectedClaims(long rejectedClaims) {
		this.rejectedClaims = rejectedClaims;
	}
    
}
