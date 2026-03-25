package com.group2.policy_service.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import com.group2.policy_service.dto.PolicyResponseDTO;
import com.group2.policy_service.dto.PolicyStatsDTO;
import com.group2.policy_service.dto.UserPolicyResponseDTO;
import com.group2.policy_service.entity.PolicyType;
import com.group2.policy_service.repository.PolicyRepository;
import com.group2.policy_service.repository.PolicyTypeRepository;
import com.group2.policy_service.repository.UserPolicyRepository;
import com.group2.policy_service.util.PolicyMapper;

@Service
public class PolicyQueryService {

    private final PolicyRepository policyRepository;
    private final UserPolicyRepository userPolicyRepository;
    private final PolicyTypeRepository policyTypeRepository;
    private final PolicyMapper mapper;

    public PolicyQueryService(PolicyRepository policyRepository,
                             UserPolicyRepository userPolicyRepository,
                             PolicyTypeRepository policyTypeRepository, 
                             PolicyMapper mapper) {
        this.policyRepository = policyRepository;
        this.userPolicyRepository = userPolicyRepository;
        this.policyTypeRepository = policyTypeRepository;
        this.mapper = mapper;
    }

    public List<UserPolicyResponseDTO> getPoliciesByUserId(Long userId) {
        return userPolicyRepository.findByUserId(userId)
                .stream()
                .map(mapper::mapToUserPolicyResponse)
                .collect(Collectors.toList());
    }

    public List<UserPolicyResponseDTO> getAllUserPolicies() {
        return userPolicyRepository.findAll()
                .stream()
                .map(mapper::mapToUserPolicyResponse)
                .collect(Collectors.toList());
    }

    public List<PolicyResponseDTO> getAllPolicies() {
        return policyRepository.findByActiveTrue()
                .stream()
                .map(mapper::mapToPolicyResponse)
                .collect(Collectors.toList());
    }

    public List<PolicyType> getAllPolicyTypes() {
        return policyTypeRepository.findAll();
    }

    public PolicyResponseDTO getPolicyById(Long policyId) {
        return policyRepository.findById(policyId)
                .map(mapper::mapToPolicyResponse)
                .orElseThrow(() -> new RuntimeException("Policy not found"));
    }

    public PolicyStatsDTO getPolicyStats() {
        long totalPolicies = policyRepository.count();
        Double totalPremiums = userPolicyRepository.sumPremiumAmount();

        PolicyStatsDTO stats = new PolicyStatsDTO();
        stats.setTotalPolicies(totalPolicies);
        stats.setTotalRevenue(totalPremiums != null ? totalPremiums : 0.0);
        return stats;
    }
}
