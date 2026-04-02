package com.group2.policy_service.service.impl;

import com.group2.policy_service.service.IPolicyCommandService;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.group2.policy_service.config.RabbitMQConfig;
import com.group2.policy_service.dto.PolicyCancellationEvent;
import com.group2.policy_service.dto.PolicyRequestDTO;
import com.group2.policy_service.dto.PolicyResponseDTO;
import com.group2.policy_service.dto.UserPolicyResponseDTO;
import com.group2.policy_service.dto.EmailRequest;
import com.group2.policy_service.dto.NotificationEvent;
import com.group2.policy_service.entity.Policy;
import com.group2.policy_service.entity.PolicyStatus;
import com.group2.policy_service.entity.PolicyType;
import com.group2.policy_service.entity.UserPolicy;
import com.group2.policy_service.repository.PolicyRepository;
import com.group2.policy_service.repository.PolicyTypeRepository;
import com.group2.policy_service.repository.UserPolicyRepository;
import com.group2.policy_service.util.PolicyMapper;
import com.group2.policy_service.feign.AuthClient;
import com.group2.policy_service.feign.NotificationClient;
import com.group2.policy_service.feign.UserDTO;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class PolicyCommandServiceImpl implements IPolicyCommandService {

    private final PolicyRepository policyRepository;
    private final UserPolicyRepository userPolicyRepository;
    private final PolicyTypeRepository policyTypeRepository;
    private final PolicyMapper mapper;
    private final AuthClient authClient;
    private final NotificationClient notificationClient;
    private final RabbitTemplate rabbitTemplate;
    
    private static final Logger log = LoggerFactory.getLogger(PolicyCommandServiceImpl.class);

    public PolicyCommandServiceImpl(PolicyRepository policyRepository,
                               UserPolicyRepository userPolicyRepository,
                               PolicyTypeRepository policyTypeRepository,
                               PolicyMapper mapper,
                               AuthClient authClient,
                               NotificationClient notificationClient,
                               RabbitTemplate rabbitTemplate) {
        this.policyRepository = policyRepository;
        this.userPolicyRepository = userPolicyRepository;
        this.policyTypeRepository = policyTypeRepository;
        this.mapper = mapper;
        this.authClient = authClient;
        this.notificationClient = notificationClient;
        this.rabbitTemplate = rabbitTemplate;
    }

    @Transactional
    @CacheEvict(value = {"user_policies", "policy_stats"}, allEntries = true)
    public UserPolicyResponseDTO purchasePolicy(Long policyId) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long userId = (principal instanceof Long) ? (Long) principal : Long.parseLong(principal.toString());

        Policy policy = policyRepository.findById(policyId)
                .orElseThrow(() -> new RuntimeException("Policy not found"));

        if (userPolicyRepository.findByUserId(userId).stream()
                .anyMatch(up -> up.getPolicy().getId().equals(policyId) && 
                        (up.getStatus() == PolicyStatus.ACTIVE || 
                         up.getStatus() == PolicyStatus.PENDING_CANCELLATION))) {
            throw new RuntimeException("You already have an active or pending subscription for this policy.");
        }

        UserPolicy userPolicy = new UserPolicy();
        userPolicy.setUserId(userId);
        userPolicy.setPolicy(policy);
        userPolicy.setStatus(PolicyStatus.ACTIVE);
        userPolicy.setPremiumAmount(policy.getPremiumAmount());
        userPolicy.setStartDate(LocalDate.now());
        userPolicy.setEndDate(LocalDate.now().plusMonths(policy.getDurationInMonths()));
        userPolicy.setOutstandingBalance(policy.getPremiumAmount());
        userPolicy.setNextDueDate(LocalDate.now().plusMonths(1));
        userPolicy.setCoverageAmount(policy.getCoverageAmount());

        userPolicyRepository.save(userPolicy);

        // Send Purchase Notification
        try {
            UserDTO user = authClient.getUserById(userId);
            if (user != null && user.getEmail() != null) {
                String subject = "SmartSure: Policy Purchase Successful";
                String htmlBody = String.format(
                    "<html><body style='font-family: Arial, sans-serif; color: #333; line-height: 1.6;'>" +
                    "<div style='max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;'>" +
                    "<div style='background: #1e3c72; color: white; padding: 20px; text-align: center;'>" +
                    "<h1 style='margin: 0;'>🛡️ SmartSure</h1>" +
                    "</div>" +
                    "<div style='padding: 20px;'>" +
                    "<h2>Congratulations %s!</h2>" +
                    "<p>You have successfully purchased a new insurance policy.</p>" +
                    "<div style='background: #f4f7f6; padding: 15px; border-radius: 5px; border-left: 5px solid #1e3c72;'>" +
                    "<strong>Policy Name:</strong> %s<br/>" +
                    "<strong>Premium Amount:</strong> ₹%.2f<br/>" +
                    "<strong>Coverage:</strong> ₹%.2f<br/>" +
                    "<strong>Expiry Date:</strong> %s" +
                    "</div>" +
                    "<p style='margin-top: 20px;'>Thank you for choosing SmartSure for your protection.</p>" +
                    "</div>" +
                    "<div style='background: #f9f9f9; padding: 10px; text-align: center; font-size: 12px; color: #777;'>" +
                    "&copy; 2026 SmartSure Insurance Management System" +
                    "</div></div></body></html>",
                    user.getName(), policy.getPolicyName(), userPolicy.getPremiumAmount(), userPolicy.getCoverageAmount(), userPolicy.getEndDate()
                );
                
                // Primary: Feign
                try {
                    notificationClient.sendEmail(new EmailRequest(user.getEmail(), subject, htmlBody));
                    log.info("📧 Policy purchase notification sent via Feign to: {}", user.getEmail());
                } catch (Exception feignEx) {
                    NotificationEvent event = new NotificationEvent(user.getEmail(), subject, htmlBody);
                    rabbitTemplate.convertAndSend("notification.exchange", "notification.email", event);
                }
            }
        } catch (Exception e) {
            log.error("Failed to process purchase notification: {}", e.getMessage());
        }

        return mapper.mapToUserPolicyResponse(userPolicy);
    }

    @Transactional
    @CacheEvict(value = "user_policies", allEntries = true)
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

        // Send Cancellation Request Email
        try {
            UserDTO user = authClient.getUserById(currentUserId);
            String subject = "SmartSure: Cancellation Request Received";
            String htmlBody = String.format(
                "<html><body style='font-family: Arial, sans-serif; color: #333;'>" +
                "<div style='max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;'>" +
                "<div style='background: #e67e22; color: white; padding: 20px; text-align: center;'>" +
                "<h1 style='margin: 0;'>⚠️ Cancellation Request</h1>" +
                "</div>" +
                "<div style='padding: 20px;'>" +
                "<p>Hello %s,</p>" +
                "<p>We have received your request to cancel your policy: <strong>%s</strong>.</p>" +
                "<p>Our administration team is currently reviewing your request. You will be notified once the review is complete.</p>" +
                "<p>No further action is required from your side at this moment.</p>" +
                "</div>" +
                "<div style='background: #f9f9f9; padding: 10px; text-align: center; font-size: 12px; color: #777;'>" +
                "&copy; 2026 SmartSure Insurance Management System" +
                "</div></div></body></html>",
                user.getName(), userPolicy.getPolicy().getPolicyName()
            );
            notificationClient.sendEmail(new EmailRequest(user.getEmail(), subject, htmlBody));
            log.info("📧 Cancellation request notification sent via Feign to: {}", user.getEmail());
        } catch (Exception e) {
            log.warn("⚠️ Cancellation request email failed (Feign): {}", e.getMessage());
        }

        // Saga Trigger (RabbitMQ - Optional for STS users)
        try {
            PolicyCancellationEvent event = new PolicyCancellationEvent(
                    userPolicy.getId(),
                    userPolicy.getUserId(),
                    LocalDateTime.now()
            );
            rabbitTemplate.convertAndSend(RabbitMQConfig.POLICY_EXCHANGE, RabbitMQConfig.CANCELLATION_ROUTING_KEY, event);
        } catch (Exception e) {
            log.warn("⚠️ RabbitMQ saga event failed: {}", e.getMessage());
        }

        return mapper.mapToUserPolicyResponse(userPolicy);
    }

    @Transactional
    @CacheEvict(value = "user_policies", allEntries = true)
    public UserPolicyResponseDTO approveCancellation(Long userPolicyId) {
        UserPolicy userPolicy = userPolicyRepository.findById(userPolicyId)
                .orElseThrow(() -> new RuntimeException("Policy not found"));

        if (userPolicy.getOutstandingBalance() != null && userPolicy.getOutstandingBalance() > 0) {
            throw new RuntimeException("Outstanding balance exists: ₹" + userPolicy.getOutstandingBalance());
        }

        userPolicy.setStatus(PolicyStatus.CANCELLED);
        userPolicyRepository.save(userPolicy);

        try {
            UserDTO user = authClient.getUserById(userPolicy.getUserId());
            if (user != null && user.getEmail() != null) {
                String subject = "SmartSure: Policy Cancellation Approved";
                String htmlBody = String.format(
                    "<html><body style='font-family: Arial, sans-serif; color: #333;'>" +
                    "<div style='max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;'>" +
                    "<div style='background: #c0392b; color: white; padding: 20px; text-align: center;'>" +
                    "<h1 style='margin: 0;'>🚫 Policy Cancelled</h1>" +
                    "</div>" +
                    "<div style='padding: 20px;'>" +
                    "<p>Hello %s,</p>" +
                    "<p>Your cancellation request for policy <strong>%s</strong> has been <strong>Approved</strong>.</p>" +
                    "<p>The policy has been successfully terminated. Any associated benefits will no longer be available.</p>" +
                    "</div>" +
                    "<div style='background: #f9f9f9; padding: 10px; text-align: center; font-size: 12px; color: #777;'>" +
                    "&copy; 2026 SmartSure Insurance Management System" +
                    "</div></div></body></html>",
                    user.getName(), userPolicy.getPolicy().getPolicyName()
                );
                
                // Direct Feign
                try {
                    notificationClient.sendEmail(new EmailRequest(user.getEmail(), subject, htmlBody));
                    log.info("📧 Policy cancellation approval sent via Feign to: {}", user.getEmail());
                } catch (Exception feignEx) {
                    NotificationEvent evt = new NotificationEvent(user.getEmail(), subject, htmlBody);
                    rabbitTemplate.convertAndSend("notification.exchange", "notification.email", evt);
                }
            }
        } catch(Exception e) {
            log.error("Failed to process policy cancellation notification: {}", e.getMessage());
        }

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

        // Send Payment Confirmation Email
        try {
            UserDTO user = authClient.getUserById(userPolicy.getUserId());
            if (user != null && user.getEmail() != null) {
                String subject = "SmartSure: Premium Payment Successful";
                String htmlBody = String.format(
                    "<html><body style='font-family: Arial, sans-serif; color: #333;'>" +
                    "<div style='max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;'>" +
                    "<div style='background: #27ae60; color: white; padding: 20px; text-align: center;'>" +
                    "<h1 style='margin: 0;'>💰 Payment Received</h1>" +
                    "</div>" +
                    "<div style='padding: 20px;'>" +
                    "<p>Hello %s,</p>" +
                    "<p>A premium payment has been successfully processed for your policy: <strong>%s</strong>.</p>" +
                    "<div style='background: #f4f7f6; padding: 15px; border-radius: 5px; border-left: 5px solid #27ae60;'>" +
                    "<strong>Amount Paid:</strong> ₹%.2f<br/>" +
                    "<strong>Remaining Balance:</strong> ₹%.2f" +
                    "</div>" +
                    "<p style='margin-top: 20px;'>Thank you for keeping your policy active!</p>" +
                    "</div>" +
                    "<div style='background: #f9f9f9; padding: 10px; text-align: center; font-size: 12px; color: #777;'>" +
                    "&copy; 2026 SmartSure Insurance Management System" +
                    "</div></div></body></html>",
                    user.getName(), userPolicy.getPolicy().getPolicyName(), amount, userPolicy.getOutstandingBalance()
                );
                
                try {
                    notificationClient.sendEmail(new EmailRequest(user.getEmail(), subject, htmlBody));
                    log.info("📧 Payment confirmation notification sent via Feign to: {}", user.getEmail());
                } catch (Exception feignEx) {
                    NotificationEvent event = new NotificationEvent(user.getEmail(), subject, htmlBody);
                    rabbitTemplate.convertAndSend("notification.exchange", "notification.email", event);
                }
            }
        } catch (Exception e) {
            log.error("Failed to process payment confirmation notification: {}", e.getMessage());
        }

        return mapper.mapToUserPolicyResponse(userPolicy);
    }
}
