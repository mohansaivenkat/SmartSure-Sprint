package com.group2.policy_service.dto;

import java.io.Serializable;

public class PolicyStatsDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private long totalPolicies;
    private double totalRevenue;

    public long getTotalPolicies() {
        return totalPolicies;
    }

    public void setTotalPolicies(long totalPolicies) {
        this.totalPolicies = totalPolicies;
    }

    public double getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(double totalRevenue) {
        this.totalRevenue = totalRevenue;
    }
}
