package com.group2.admin_service.dto;



public class ClaimStatusDTO {
    private int totalClaims;
    private int approvedClaims;
    private int rejectedClaims;
	public int getTotalClaims() {
		return totalClaims;
	}
	public void setTotalClaims(int totalClaims) {
		this.totalClaims = totalClaims;
	}
	public int getApprovedClaims() {
		return approvedClaims;
	}
	public void setApprovedClaims(int approvedClaims) {
		this.approvedClaims = approvedClaims;
	}
	public int getRejectedClaims() {
		return rejectedClaims;
	}
	public void setRejectedClaims(int rejectedClaims) {
		this.rejectedClaims = rejectedClaims;
	}
    
    
}
