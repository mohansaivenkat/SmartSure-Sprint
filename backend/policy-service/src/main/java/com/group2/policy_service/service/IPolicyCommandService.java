package com.group2.policy_service.service;

import com.group2.policy_service.dto.PolicyRequestDTO;
import com.group2.policy_service.dto.PolicyResponseDTO;
import com.group2.policy_service.dto.UserPolicyResponseDTO;

public interface IPolicyCommandService {
    UserPolicyResponseDTO purchasePolicy(Long policyId);
    UserPolicyResponseDTO requestCancellation(Long userPolicyId);
    UserPolicyResponseDTO approveCancellation(Long userPolicyId);
    PolicyResponseDTO createPolicy(PolicyRequestDTO dto);
    PolicyResponseDTO updatePolicy(Long id, PolicyRequestDTO dto);
    void deletePolicy(Long id);
    UserPolicyResponseDTO payPremium(Long id, Double amount);
}
