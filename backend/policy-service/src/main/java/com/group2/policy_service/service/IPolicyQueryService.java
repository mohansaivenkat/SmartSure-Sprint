package com.group2.policy_service.service;

import java.util.List;
import com.group2.policy_service.dto.PageResponseDTO;
import com.group2.policy_service.dto.PolicyResponseDTO;
import com.group2.policy_service.dto.PolicyStatsDTO;
import com.group2.policy_service.dto.UserPolicyResponseDTO;
import com.group2.policy_service.entity.PolicyType;

public interface IPolicyQueryService {
    List<UserPolicyResponseDTO> getPoliciesByUserId(Long userId);
    PageResponseDTO<UserPolicyResponseDTO> getPoliciesByUserIdPaginated(Long userId, String status, int page, int size);
    List<UserPolicyResponseDTO> getAllUserPolicies();
    PageResponseDTO<UserPolicyResponseDTO> getAllUserPoliciesPaginated(int page, int size);
    List<PolicyResponseDTO> getAllPolicies();
    PageResponseDTO<PolicyResponseDTO> searchPolicies(String category, String query, int page, int size);
    List<PolicyType> getAllPolicyTypes();
    PolicyResponseDTO getPolicyById(Long policyId);
    PolicyStatsDTO getPolicyStats();
    UserPolicyResponseDTO getUserPolicyById(Long id);
}
