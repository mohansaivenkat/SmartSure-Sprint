package com.group2.admin_service.dto;


public class ReportResponse {
	
	private long totalPolicies;
	private int totalClaims;
	private int approvedClaims;
	private int rejectedClaims;
	private double totalRevenue;
	public long getTotalPolicies() {
		return totalPolicies;
	}
	public void setTotalPolicies(long totalPolicies) {
		this.totalPolicies = totalPolicies;
	}
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
	public double getTotalRevenue() {
		return totalRevenue;
	}
	public void setTotalRevenue(double totalRevenue) {
		this.totalRevenue = totalRevenue;
	}
	
	
	

}
