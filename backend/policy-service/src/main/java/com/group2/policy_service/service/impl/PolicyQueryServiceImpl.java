package com.group2.policy_service.service.impl;

import com.group2.policy_service.service.IPolicyQueryService;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import com.group2.policy_service.dto.PolicyResponseDTO;
import com.group2.policy_service.dto.PolicyStatsDTO;
import com.group2.policy_service.dto.UserPolicyResponseDTO;
import com.group2.policy_service.entity.PolicyType;
import com.group2.policy_service.repository.PolicyRepository;
import com.group2.policy_service.repository.PolicyTypeRepository;
import com.group2.policy_service.repository.UserPolicyRepository;
import com.group2.policy_service.util.PolicyMapper;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import com.group2.policy_service.dto.PageResponseDTO;
import com.group2.policy_service.entity.Policy;

@Service
public class PolicyQueryServiceImpl implements IPolicyQueryService {

    private final PolicyRepository policyRepository;
    private final UserPolicyRepository userPolicyRepository;
    private final PolicyTypeRepository policyTypeRepository;
    private final PolicyMapper mapper;

    public PolicyQueryServiceImpl(PolicyRepository policyRepository,
                             UserPolicyRepository userPolicyRepository,
                             PolicyTypeRepository policyTypeRepository, 
                             PolicyMapper mapper) {
        this.policyRepository = policyRepository;
        this.userPolicyRepository = userPolicyRepository;
        this.policyTypeRepository = policyTypeRepository;
        this.mapper = mapper;
    }

    @Override
    public PageResponseDTO<PolicyResponseDTO> searchPolicies(String category, String query, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Policy> policyPage = policyRepository.searchPolicies(category, query, pageable);

        List<PolicyResponseDTO> content = policyPage.getContent()
                .stream()
                .map(mapper::mapToPolicyResponse)
                .collect(Collectors.toList());

        return new PageResponseDTO<>(
                content,
                policyPage.getNumber(),
                policyPage.getSize(),
                policyPage.getTotalElements(),
                policyPage.getTotalPages(),
                policyPage.isLast()
        );
    }

    @Override
    public PageResponseDTO<UserPolicyResponseDTO> getPoliciesByUserIdPaginated(Long userId, String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<com.group2.policy_service.entity.UserPolicy> policyPage;

        if (status != null && !status.isEmpty() && !status.equalsIgnoreCase("ALL")) {
            com.group2.policy_service.entity.PolicyStatus policyStatus = com.group2.policy_service.entity.PolicyStatus.valueOf(status.toUpperCase());
            policyPage = userPolicyRepository.findByUserIdAndStatus(userId, policyStatus, pageable);
        } else {
            policyPage = userPolicyRepository.findByUserId(userId, pageable);
        }

        List<UserPolicyResponseDTO> content = policyPage.getContent()
                .stream()
                .map(mapper::mapToUserPolicyResponse)
                .collect(Collectors.toList());

        return new PageResponseDTO<>(
                content,
                policyPage.getNumber(),
                policyPage.getSize(),
                policyPage.getTotalElements(),
                policyPage.getTotalPages(),
                policyPage.isLast()
        );
    }

    @Cacheable(value = "user_policies", key = "#userId")
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

    @Override
    public PageResponseDTO<UserPolicyResponseDTO> getAllUserPoliciesPaginated(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<com.group2.policy_service.entity.UserPolicy> policyPage = userPolicyRepository.findAll(pageable);

        List<UserPolicyResponseDTO> content = policyPage.getContent()
                .stream()
                .map(mapper::mapToUserPolicyResponse)
                .collect(Collectors.toList());

        return new PageResponseDTO<>(
                content,
                policyPage.getNumber(),
                policyPage.getSize(),
                policyPage.getTotalElements(),
                policyPage.getTotalPages(),
                policyPage.isLast()
        );
    }

    @Cacheable(value = "policies", key = "'all'")
    public List<PolicyResponseDTO> getAllPolicies() {
        return policyRepository.findByActiveTrue()
                .stream()
                .map(mapper::mapToPolicyResponse)
                .collect(Collectors.toList());
    }

    public List<PolicyType> getAllPolicyTypes() {
        return policyTypeRepository.findAll();
    }

    @Cacheable(value = "policies", key = "#policyId")
    public PolicyResponseDTO getPolicyById(Long policyId) {
        return policyRepository.findById(policyId)
                .map(mapper::mapToPolicyResponse)
                .orElseThrow(() -> new RuntimeException("Policy not found"));
    }

    @Cacheable(value = "policy_stats", key = "'global'")
    public PolicyStatsDTO getPolicyStats() {
        long totalPolicies = policyRepository.count();
        Double totalPremiums = userPolicyRepository.sumPremiumAmount();

        PolicyStatsDTO stats = new PolicyStatsDTO();
        stats.setTotalPolicies(totalPolicies);
        stats.setTotalRevenue(totalPremiums != null ? totalPremiums : 0.0);
        return stats;
    }

    public UserPolicyResponseDTO getUserPolicyById(Long id) {
        return userPolicyRepository.findById(id)
                .map(mapper::mapToUserPolicyResponse)
                .orElseThrow(() -> new RuntimeException("User policy not found with id: " + id));
    }
}
