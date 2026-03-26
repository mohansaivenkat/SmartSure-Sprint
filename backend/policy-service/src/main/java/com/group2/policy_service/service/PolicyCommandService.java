package com.group2.policy_service.service;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.group2.policy_service.config.RabbitMQConfig;
import com.group2.policy_service.dto.PolicyCancellationEvent;
import com.group2.policy_service.dto.PolicyRequestDTO;
import com.group2.policy_service.dto.PolicyResponseDTO;
import com.group2.policy_service.dto.UserPolicyResponseDTO;
import com.group2.policy_service.entity.Policy;
import com.group2.policy_service.entity.PolicyStatus;
import com.group2.policy_service.entity.PolicyType;
import com.group2.policy_service.entity.UserPolicy;
import com.group2.policy_service.repository.PolicyRepository;
import com.group2.policy_service.repository.PolicyTypeRepository;
import com.group2.policy_service.repository.UserPolicyRepository;
import com.group2.policy_service.util.PolicyMapper;

@Service
public class PolicyCommandService {

    private final PolicyRepository policyRepository;
    private final UserPolicyRepository userPolicyRepository;
    private final PolicyTypeRepository policyTypeRepository;
    private final PolicyMapper mapper;

    @Autowired
    private RabbitTemplate rabbitTemplate;

    public PolicyCommandService(PolicyRepository policyRepository,
                               UserPolicyRepository userPolicyRepository,
                               PolicyTypeRepository policyTypeRepository,
                               PolicyMapper mapper) {
        this.policyRepository = policyRepository;
        this.userPolicyRepository = userPolicyRepository;
        this.policyTypeRepository = policyTypeRepository;
        this.mapper = mapper;
    }

    @Transactional
    @CacheEvict(value = {"user_policies", "policy_stats"}, allEntries = true)
    public UserPolicyResponseDTO purchasePolicy(Long policyId) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long userId = (principal instanceof Long) ? (Long) principal : Long.parseLong(principal.toString());

        Policy policy = policyRepository.findById(policyId)
                .orElseThrow(() -> new RuntimeException("Policy not found"));

        UserPolicy userPolicy = new UserPolicy();
        userPolicy.setUserId(userId);
        userPolicy.setPolicy(policy);
        userPolicy.setStatus(PolicyStatus.ACTIVE);
        userPolicy.setPremiumAmount(policy.getPremiumAmount());
        userPolicy.setStartDate(LocalDate.now());
        userPolicy.setEndDate(LocalDate.now().plusMonths(policy.getDurationInMonths()));
        userPolicy.setOutstandingBalance(policy.getPremiumAmount());
        userPolicy.setNextDueDate(LocalDate.now().plusMonths(1));

        userPolicyRepository.save(userPolicy);
        return mapper.mapToUserPolicyResponse(userPolicy);
    }

    @Transactional
    @CacheEvict(value = "user_policies", key = "#userPolicyId")
    public UserPolicyResponseDTO requestCancellation(Long userPolicyId) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long currentUserId = (principal instanceof Long) ? (Long) principal : Long.parseLong(principal.toString());

        UserPolicy userPolicy = userPolicyRepository.findById(userPolicyId)
                .orElseThrow(() -> new RuntimeException("Policy record not found"));

        if (!userPolicy.getUserId().equals(currentUserId)) {
            throw new RuntimeException("Security Violation: Ownership mismatch.");
        }

        if (userPolicy.getStatus() != PolicyStatus.ACTIVE) {
            throw new RuntimeException("Cannot cancel: Policy status is " + userPolicy.getStatus());
        }

        userPolicy.setStatus(PolicyStatus.PENDING_CANCELLATION);
        userPolicyRepository.save(userPolicy);

        // Saga Trigger
        PolicyCancellationEvent event = new PolicyCancellationEvent(
                userPolicy.getId(), // Fix: use the UserPolicy subscription ID, not the template ID
                userPolicy.getUserId(),
                LocalDateTime.now()
        );
        rabbitTemplate.convertAndSend(RabbitMQConfig.POLICY_EXCHANGE, RabbitMQConfig.CANCELLATION_ROUTING_KEY, event);

        return mapper.mapToUserPolicyResponse(userPolicy);
    }

    @Transactional
    @CacheEvict(value = "user_policies", key = "#userPolicyId")
    public UserPolicyResponseDTO approveCancellation(Long userPolicyId) {
        UserPolicy userPolicy = userPolicyRepository.findById(userPolicyId)
                .orElseThrow(() -> new RuntimeException("Policy not found"));

        if (userPolicy.getOutstandingBalance() != null && userPolicy.getOutstandingBalance() > 0) {
            throw new RuntimeException("Outstanding balance exists: ₹" + userPolicy.getOutstandingBalance());
        }

        userPolicy.setStatus(PolicyStatus.CANCELLED);
        userPolicyRepository.save(userPolicy);
        return mapper.mapToUserPolicyResponse(userPolicy);
    }

    @Transactional
    @CacheEvict(value = {"policies", "policy_stats"}, allEntries = true)
    public PolicyResponseDTO createPolicy(PolicyRequestDTO dto) {
        PolicyType type = policyTypeRepository.findById(dto.getPolicyTypeId())
                .orElseThrow(() -> new RuntimeException("Type not found"));

        Policy policy = new Policy();
        policy.setPolicyName(dto.getPolicyName());
        policy.setDescription(dto.getDescription());
        policy.setPremiumAmount(dto.getPremiumAmount());
        policy.setDurationInMonths(dto.getDurationInMonths());
        policy.setPolicyType(type);
        policy.setActive(true);

        policyRepository.save(policy);
        return mapper.mapToPolicyResponse(policy);
    }

    @Transactional
    @CacheEvict(value = "policies", allEntries = true)
    public PolicyResponseDTO updatePolicy(Long id, PolicyRequestDTO dto) {
        Policy policy = policyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Policy not found"));

        policy.setPolicyName(dto.getPolicyName());
        policy.setDescription(dto.getDescription());
        policy.setPremiumAmount(dto.getPremiumAmount());
        policy.setDurationInMonths(dto.getDurationInMonths());

        if (dto.getPolicyTypeId() != null) {
            PolicyType type = policyTypeRepository.findById(dto.getPolicyTypeId()).get();
            policy.setPolicyType(type);
        }

        policyRepository.save(policy);
        return mapper.mapToPolicyResponse(policy);
    }

    @Transactional
    @CacheEvict(value = "policies", allEntries = true)
    public void deletePolicy(Long id) {
        Policy policy = policyRepository.findById(id).orElseThrow();
        policy.setActive(false);
        policyRepository.save(policy);
    }

    @Transactional
    @CacheEvict(value = "user_policies", allEntries = true)
    public UserPolicyResponseDTO payPremium(Long id, Double amount) {
        UserPolicy userPolicy = userPolicyRepository.findById(id).orElseThrow();
        double currentBalance = userPolicy.getOutstandingBalance() != null ? userPolicy.getOutstandingBalance() : 0.0;
        userPolicy.setOutstandingBalance(Math.max(0, currentBalance - amount));
        userPolicyRepository.save(userPolicy);
        return mapper.mapToUserPolicyResponse(userPolicy);
    }
}
