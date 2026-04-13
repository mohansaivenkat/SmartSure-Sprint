package com.group2.policy_service.service.impl;

import com.group2.policy_service.service.IPolicyCommandService;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.group2.policy_service.config.RabbitMQConfig;
import com.group2.policy_service.dto.*;
import com.group2.policy_service.entity.*;
import com.group2.policy_service.repository.*;
import com.group2.policy_service.util.PolicyMapper;
import com.group2.policy_service.feign.*;

@Service
public class PolicyCommandServiceImpl implements IPolicyCommandService {

    private final PolicyRepository policyRepository;
    private final UserPolicyRepository userPolicyRepository;
    private final PolicyTypeRepository policyTypeRepository;
    private final PolicyMapper mapper;
    private final AsyncNotificationService asyncNotificationService;
    private final RabbitTemplate rabbitTemplate;
    private final AuthClient authClient;

    public PolicyCommandServiceImpl(PolicyRepository policyRepository, UserPolicyRepository userPolicyRepository,
                               PolicyTypeRepository policyTypeRepository, PolicyMapper mapper,
                               AsyncNotificationService asyncNotificationService, RabbitTemplate rabbitTemplate,
                               AuthClient authClient) {
        this.policyRepository = policyRepository;
        this.userPolicyRepository = userPolicyRepository;
        this.policyTypeRepository = policyTypeRepository;
        this.mapper = mapper;
        this.asyncNotificationService = asyncNotificationService;
        this.rabbitTemplate = rabbitTemplate;
        this.authClient = authClient;
    }

    private void notifyUser(Long userId, NotificationTask task) {
        try {
            Optional.ofNullable(authClient.getUserById(userId))
                .filter(u -> u.getEmail() != null)
                .ifPresent(u -> task.run(u.getEmail(), u.getName()));
        } catch (Exception e) {}
    }

    @FunctionalInterface
    interface NotificationTask { void run(String email, String name); }

    private Long getUserId() {
        Object p = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return Long.parseLong(String.valueOf(p));
    }

    @Transactional
    @CacheEvict(value = {"user_policies", "policy_stats"}, allEntries = true)
    public UserPolicyResponseDTO purchasePolicy(Long policyId) {
        Long userId = getUserId();
        Policy policy = policyRepository.findById(policyId).orElseThrow(() -> new RuntimeException("Policy not found"));

        boolean exists = userPolicyRepository.findByUserId(userId).stream()
                .anyMatch(up -> up.getPolicy().getId().equals(policyId) && 
                        (up.getStatus() == PolicyStatus.ACTIVE || up.getStatus() == PolicyStatus.PENDING_CANCELLATION));
        if (exists) throw new RuntimeException("Exists");

        UserPolicy up = new UserPolicy();
        up.setUserId(userId); up.setPolicy(policy); up.setStatus(PolicyStatus.ACTIVE);
        up.setPremiumAmount(policy.getPremiumAmount());
        up.setStartDate(LocalDate.now()); up.setEndDate(LocalDate.now().plusMonths(policy.getDurationInMonths()));
        up.setOutstandingBalance(policy.getPremiumAmount());
        up.setCoverageAmount(policy.getCoverageAmount());
        userPolicyRepository.save(up);

        notifyUser(userId, (email, name) -> asyncNotificationService.sendPurchaseNotification(email, name, policy.getPolicyName(), up.getPremiumAmount(), up.getCoverageAmount(), up.getEndDate()));
        return mapper.mapToUserPolicyResponse(up);
    }

    @Transactional
    @CacheEvict(value = "user_policies", allEntries = true)
    public UserPolicyResponseDTO requestCancellation(Long upId, String reason) {
        Long userId = getUserId();
        UserPolicy up = userPolicyRepository.findById(upId).orElseThrow(() -> new RuntimeException("Not found"));
        if (!up.getUserId().equals(userId)) throw new RuntimeException("Security");
        if (up.getStatus() != PolicyStatus.ACTIVE) throw new RuntimeException("Status");

        up.setStatus(PolicyStatus.PENDING_CANCELLATION);
        up.setCancellationReason(reason);
        userPolicyRepository.save(up);

        notifyUser(userId, (email, name) -> asyncNotificationService.sendCancellationRequestNotification(email, name, up.getPolicy().getPolicyName()));
        try { rabbitTemplate.convertAndSend(RabbitMQConfig.POLICY_EXCHANGE, RabbitMQConfig.CANCELLATION_ROUTING_KEY, new PolicyCancellationEvent(up.getId(), up.getUserId(), LocalDateTime.now())); } catch (Exception e) {}
        return mapper.mapToUserPolicyResponse(up);
    }

    @Transactional
    @CacheEvict(value = "user_policies", allEntries = true)
    public UserPolicyResponseDTO approveCancellation(Long upId) {
        UserPolicy up = userPolicyRepository.findById(upId).orElseThrow(() -> new RuntimeException("Not found"));
        if ((up.getOutstandingBalance() != null ? up.getOutstandingBalance() : 0.0) > 0) throw new RuntimeException("Balance");

        up.setStatus(PolicyStatus.CANCELLED);
        userPolicyRepository.save(up);

        notifyUser(up.getUserId(), (email, name) -> asyncNotificationService.sendCancellationApprovalNotification(email, name, up.getPolicy().getPolicyName()));
        return mapper.mapToUserPolicyResponse(up);
    }

    @Transactional
    @CacheEvict(value = {"policies", "policy_stats"}, allEntries = true)
    public PolicyResponseDTO createPolicy(PolicyRequestDTO dto) {
        PolicyType type = policyTypeRepository.findById(dto.getPolicyTypeId()).orElseThrow(() -> new RuntimeException("Type"));
        Policy p = new Policy();
        p.setPolicyName(dto.getPolicyName()); p.setDescription(dto.getDescription());
        p.setPremiumAmount(dto.getPremiumAmount()); p.setDurationInMonths(dto.getDurationInMonths());
        p.setPolicyType(type); p.setActive(true);
        policyRepository.save(p);
        return mapper.mapToPolicyResponse(p);
    }

    @Transactional
    @CacheEvict(value = "policies", allEntries = true)
    public PolicyResponseDTO updatePolicy(Long id, PolicyRequestDTO dto) {
        Policy p = policyRepository.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        p.setPolicyName(dto.getPolicyName()); p.setPremiumAmount(dto.getPremiumAmount());
        p.setDurationInMonths(dto.getDurationInMonths());
        if (dto.getPolicyTypeId() != null) p.setPolicyType(policyTypeRepository.findById(dto.getPolicyTypeId()).get());
        policyRepository.save(p);
        return mapper.mapToPolicyResponse(p);
    }

    @Transactional
    public void deletePolicy(Long id) {
        Policy p = policyRepository.findById(id).orElseThrow();
        p.setActive(false);
        policyRepository.save(p);
    }

    @Transactional
    @CacheEvict(value = "user_policies", allEntries = true)
    public UserPolicyResponseDTO payPremium(Long id, Double amount) {
        UserPolicy up = userPolicyRepository.findById(id).orElseThrow();
        double balance = up.getOutstandingBalance() != null ? up.getOutstandingBalance() : 0.0;
        up.setOutstandingBalance(Math.max(0, balance - amount));
        userPolicyRepository.save(up);
        notifyUser(up.getUserId(), (email, name) -> asyncNotificationService.sendPaymentNotification(email, name, up.getPolicy().getPolicyName(), amount, up.getOutstandingBalance()));
        return mapper.mapToUserPolicyResponse(up);
    }
}
