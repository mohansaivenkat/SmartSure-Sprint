package com.group2.admin_service.util;

import com.group2.admin_service.dto.ClaimStatusDTO;
import com.group2.admin_service.dto.PolicyStatsDTO;
import com.group2.admin_service.dto.ReportResponse;
import org.springframework.stereotype.Component;

@Component
public class AdminMapper {

    public ReportResponse mapToReportResponse(ClaimStatusDTO claimStats, PolicyStatsDTO policyStats) {
        ReportResponse report = new ReportResponse();
        if (claimStats != null) {
            report.setTotalClaims((int) claimStats.getTotalClaims());
            report.setApprovedClaims((int) claimStats.getApprovedClaims());
            report.setRejectedClaims((int) claimStats.getRejectedClaims());
        }
        if (policyStats != null) {
            report.setTotalPolicies((int) policyStats.getTotalPolicies());
            report.setTotalRevenue(policyStats.getTotalRevenue());
        }
        return report;
    }
}
