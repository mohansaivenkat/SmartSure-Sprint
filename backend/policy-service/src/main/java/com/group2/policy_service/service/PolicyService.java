package com.group2.policy_service.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.group2.policy_service.dto.PolicyRequestDTO;
import com.group2.policy_service.dto.PolicyResponseDTO;
import com.group2.policy_service.dto.PolicyStatsDTO;
import com.group2.policy_service.dto.UserPolicyResponseDTO;
import com.group2.policy_service.entity.Policy;
import com.group2.policy_service.entity.PolicyStatus;
import com.group2.policy_service.entity.PolicyType;
import com.group2.policy_service.entity.UserPolicy;
import com.group2.policy_service.repository.PolicyRepository;
import com.group2.policy_service.repository.PolicyTypeRepository;
import com.group2.policy_service.repository.UserPolicyRepository;
import com.group2.policy_service.security.SecurityConfig;

@Service
public class PolicyService {

    private final SecurityConfig securityConfig;

    private final PolicyRepository policyRepository;
    private final UserPolicyRepository userPolicyRepository;
    private final PolicyTypeRepository policyTypeRepository;

    public PolicyService(PolicyRepository policyRepository,
                         UserPolicyRepository userPolicyRepository,
                         PolicyTypeRepository policyTypeRepository, SecurityConfig securityConfig) {
        this.policyRepository = policyRepository;
        this.userPolicyRepository = userPolicyRepository;
        this.policyTypeRepository = policyTypeRepository;
        this.securityConfig = securityConfig;
    }
    
    public List<UserPolicyResponseDTO> getPoliciesByUserId(Long userId) {

        return userPolicyRepository.findByUserId(userId)
                .stream()
                .map(this::mapToUserPolicyResponse)
                .toList();
    }
    
    public List<PolicyResponseDTO> getAllPolicies() {

        return policyRepository.findByActiveTrue()
                .stream()
                .map(this::mapToPolicyResponse)
                .toList();
    }
    
    public List<PolicyType> getAllPolicyTypes() {
        return policyTypeRepository.findAll();
    }

 public UserPolicyResponseDTO purchasePolicy(Long policyId) {

    Long userId = (Long) SecurityContextHolder
            .getContext()
            .getAuthentication()
            .getPrincipal();

    Policy policy = policyRepository.findById(policyId)
            .orElseThrow(() -> new RuntimeException("Policy not found"));

    UserPolicy userPolicy = new UserPolicy();
    userPolicy.setUserId(userId);
    userPolicy.setPolicy(policy);

    userPolicy.setStatus(PolicyStatus.ACTIVE);
    userPolicy.setStartDate(LocalDate.now());
    userPolicy.setEndDate(LocalDate.now()
            .plusMonths(policy.getDurationInMonths()));

    userPolicy.setPremiumAmount(policy.getPremiumAmount());

    userPolicyRepository.save(userPolicy);

    return mapToUserPolicyResponse(userPolicy);
}

    public PolicyResponseDTO getPolicyById(Long policyId) {

        Policy policy = policyRepository.findById(policyId)
                .orElseThrow(() -> new RuntimeException("Policy not found"));

        return mapToPolicyResponse(policy);
    }

    public PolicyResponseDTO createPolicy(PolicyRequestDTO dto) {

        PolicyType type = policyTypeRepository.findById(dto.getPolicyTypeId())
                .orElseThrow(() -> new RuntimeException("PolicyType not found"));

        Policy policy = new Policy();
        policy.setPolicyName(dto.getPolicyName());
        policy.setDescription(dto.getDescription());
        policy.setPolicyType(type);
        policy.setPremiumAmount(dto.getPremiumAmount());
        policy.setCoverageAmount(dto.getCoverageAmount());
        policy.setDurationInMonths(dto.getDurationInMonths());
        policy.setActive(true);

        policyRepository.save(policy);

        return mapToPolicyResponse(policy);
    }

    public PolicyResponseDTO updatePolicy(Long id, PolicyRequestDTO dto) {

        Policy policy = policyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Policy not found"));

        policy.setPolicyName(dto.getPolicyName());
        policy.setDescription(dto.getDescription());
        policy.setPremiumAmount(dto.getPremiumAmount());
        policy.setCoverageAmount(dto.getCoverageAmount());
        policy.setDurationInMonths(dto.getDurationInMonths());

        policyRepository.save(policy);

        return mapToPolicyResponse(policy);
    }

    public void deletePolicy(Long id) {

        Policy policy = policyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Policy not found"));

        policy.setActive(false);
        policyRepository.save(policy);
    }
    
    // Policy stats for admin reporting via Feign
    public PolicyStatsDTO getPolicyStats() {

        long totalPolicies = userPolicyRepository.count();

        Double revenue = userPolicyRepository.sumPremiumAmount();
        double totalRevenue = (revenue != null) ? revenue : 0.0;

        PolicyStatsDTO stats = new PolicyStatsDTO();
        stats.setTotalPolicies(totalPolicies);
        stats.setTotalRevenue(totalRevenue);

        return stats;
    }

    // Cancel a user-policy (Admin lifecycle: ACTIVE → CANCELLED)
    public UserPolicyResponseDTO cancelPolicy(Long userPolicyId) {

        UserPolicy userPolicy = userPolicyRepository.findById(userPolicyId)
                .orElseThrow(() -> new RuntimeException("UserPolicy not found with id: " + userPolicyId));

        if (userPolicy.getStatus() != PolicyStatus.ACTIVE) {
            throw new RuntimeException("Only ACTIVE policies can be cancelled. Current status: " + userPolicy.getStatus());
        }

        userPolicy.setStatus(PolicyStatus.CANCELLED);
        userPolicyRepository.save(userPolicy);

        return mapToUserPolicyResponse(userPolicy);
    }

    // ================= MAPPERS =================

    private PolicyResponseDTO mapToPolicyResponse(Policy policy) {
        PolicyResponseDTO dto = new PolicyResponseDTO();
        dto.setId(policy.getId());
        dto.setPolicyName(policy.getPolicyName());
        dto.setDescription(policy.getDescription());
        dto.setPremiumAmount(policy.getPremiumAmount());
        dto.setCoverageAmount(policy.getCoverageAmount());
        dto.setDurationInMonths(policy.getDurationInMonths());
        return dto;
    }

    private UserPolicyResponseDTO mapToUserPolicyResponse(UserPolicy userPolicy) {
        UserPolicyResponseDTO dto = new UserPolicyResponseDTO();
        dto.setId(userPolicy.getId());
        dto.setUserId(userPolicy.getUserId());
        dto.setPolicyName(userPolicy.getPolicy().getPolicyName());
        dto.setStatus(userPolicy.getStatus());
        dto.setPremiumAmount(userPolicy.getPremiumAmount());
        dto.setStartDate(userPolicy.getStartDate());
        dto.setEndDate(userPolicy.getEndDate());
        return dto;
    }
}