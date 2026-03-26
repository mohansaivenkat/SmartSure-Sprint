package com.group2.policy_service.util;

import com.group2.policy_service.dto.PolicyResponseDTO;
import com.group2.policy_service.dto.UserPolicyResponseDTO;
import com.group2.policy_service.entity.Policy;
import com.group2.policy_service.entity.UserPolicy;
import org.springframework.stereotype.Component;

@Component
public class PolicyMapper {

    public PolicyResponseDTO mapToPolicyResponse(Policy p) {
        PolicyResponseDTO dto = new PolicyResponseDTO();
        dto.setId(p.getId());
        dto.setPolicyName(p.getPolicyName());
        dto.setDescription(p.getDescription());
        dto.setPremiumAmount(p.getPremiumAmount());
        dto.setCoverageAmount(p.getCoverageAmount());
        dto.setDurationInMonths(p.getDurationInMonths());
        if (p.getPolicyType() != null) {
            dto.setPolicyTypeId(p.getPolicyType().getId());
            if (p.getPolicyType().getCategory() != null) {
                dto.setPolicyCategory(p.getPolicyType().getCategory().toString());
            }
        }
        return dto;
    }

    public UserPolicyResponseDTO mapToUserPolicyResponse(UserPolicy up) {
        UserPolicyResponseDTO dto = new UserPolicyResponseDTO();
        dto.setId(up.getId());
        dto.setUserId(up.getUserId());
        dto.setPolicyName(up.getPolicy() != null ? up.getPolicy().getPolicyName() : "Unknown Policy");
        dto.setPremiumAmount(up.getPremiumAmount());
        dto.setStatus(up.getStatus());
        dto.setStartDate(up.getStartDate());
        dto.setEndDate(up.getEndDate());
        dto.setOutstandingBalance(up.getOutstandingBalance());
        dto.setNextDueDate(up.getNextDueDate());
        return dto;
    }
}
