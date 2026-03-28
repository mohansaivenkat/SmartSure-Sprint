package com.group2.policy_service.util;

import com.group2.policy_service.dto.PolicyRequestDTO;
import com.group2.policy_service.dto.PolicyResponseDTO;
import com.group2.policy_service.dto.UserPolicyResponseDTO;
import com.group2.policy_service.entity.Policy;
import com.group2.policy_service.entity.UserPolicy;
import org.springframework.stereotype.Component;

@Component
public class PolicyMapper {

    public Policy mapToEntity(PolicyRequestDTO dto) {
        if (dto == null) return null;
        Policy policy = new Policy();
        policy.setPolicyName(dto.getPolicyName());
        policy.setDescription(dto.getDescription());
        policy.setPremiumAmount(dto.getPremiumAmount());
        policy.setCoverageAmount(dto.getCoverageAmount());
        policy.setDurationInMonths(dto.getDurationInMonths());
        policy.setActive(true);
        return policy;
    }

    public PolicyResponseDTO mapToPolicyResponse(Policy policy) {
        if (policy == null) return null;
        PolicyResponseDTO dto = new PolicyResponseDTO();
        dto.setId(policy.getId());
        dto.setPolicyName(policy.getPolicyName());
        dto.setDescription(policy.getDescription());
        dto.setPremiumAmount(policy.getPremiumAmount());
        dto.setCoverageAmount(policy.getCoverageAmount());
        dto.setDurationInMonths(policy.getDurationInMonths());
        if (policy.getPolicyType() != null) {
            dto.setPolicyTypeId(policy.getPolicyType().getId());
            if (policy.getPolicyType().getCategory() != null) {
                dto.setPolicyCategory(policy.getPolicyType().getCategory().name());
            }
        }
        return dto;
    }

    public UserPolicyResponseDTO mapToUserPolicyResponse(UserPolicy userPolicy) {
        if (userPolicy == null) return null;
        UserPolicyResponseDTO dto = new UserPolicyResponseDTO();
        dto.setId(userPolicy.getId());
        dto.setUserId(userPolicy.getUserId());
        if (userPolicy.getPolicy() != null) {
            dto.setPolicyName(userPolicy.getPolicy().getPolicyName());
            dto.setPremiumAmount(userPolicy.getPolicy().getPremiumAmount());
        }
        dto.setStartDate(userPolicy.getStartDate());
        dto.setEndDate(userPolicy.getEndDate());
        dto.setStatus(userPolicy.getStatus());
        dto.setOutstandingBalance(userPolicy.getOutstandingBalance());
        dto.setNextDueDate(userPolicy.getNextDueDate());
        return dto;
    }
}
