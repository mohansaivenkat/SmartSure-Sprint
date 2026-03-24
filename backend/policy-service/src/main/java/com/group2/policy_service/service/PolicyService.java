package com.group2.policy_service.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Scheduled;

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
    
    public List<UserPolicyResponseDTO> getAllUserPolicies() {
        return userPolicyRepository.findAll()
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
    userPolicy.setOutstandingBalance(0.0);
    userPolicy.setNextDueDate(LocalDate.now().plusMonths(1));

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

    @org.springframework.transaction.annotation.Transactional
    public UserPolicyResponseDTO requestCancellation(Long userPolicyId) {
        Long currentUserId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        System.out.println("Processing Cancellation Request: Policy #" + userPolicyId + " by User #" + currentUserId);

        UserPolicy userPolicy = userPolicyRepository.findById(userPolicyId)
                .orElseThrow(() -> new RuntimeException("Policy record not found (ID: " + userPolicyId + ")"));

        if (!userPolicy.getUserId().equals(currentUserId)) {
            System.err.println("CRIMINAL DETECTED: User #" + currentUserId + " tried to cancel Policy #" + userPolicyId + " owned by User #" + userPolicy.getUserId());
            throw new RuntimeException("Security Violation: You do not own this policy!");
        }

        if (userPolicy.getStatus() != PolicyStatus.ACTIVE) {
            throw new RuntimeException("Cannot cancel: Policy is already " + userPolicy.getStatus());
        }

        userPolicy.setStatus(PolicyStatus.PENDING_CANCELLATION);
        userPolicyRepository.save(userPolicy);
        return mapToUserPolicyResponse(userPolicy);
    }

    public UserPolicyResponseDTO approveCancellation(Long userPolicyId) {
        UserPolicy userPolicy = userPolicyRepository.findById(userPolicyId)
                .orElseThrow(() -> new RuntimeException("UserPolicy not found"));
        if (userPolicy.getStatus() != PolicyStatus.PENDING_CANCELLATION) {
            throw new RuntimeException("Policy must be PENDING_CANCELLATION to approve.");
        }
        
        Double balance = userPolicy.getOutstandingBalance() != null ? userPolicy.getOutstandingBalance() : 0.0;
        if (balance > 0) {
            throw new RuntimeException("Cannot approve cancellation. User has outstanding balance: ₹" + balance);
        }

        userPolicy.setStatus(PolicyStatus.CANCELLED);
        userPolicy.setNextDueDate(null); // Terminate all future premium generations
        userPolicyRepository.save(userPolicy);
        return mapToUserPolicyResponse(userPolicy);
    }

    public UserPolicyResponseDTO payPremium(Long userPolicyId, Double amount) {
        UserPolicy userPolicy = userPolicyRepository.findById(userPolicyId)
                .orElseThrow(() -> new RuntimeException("UserPolicy not found"));

        Double balance = userPolicy.getOutstandingBalance() != null ? userPolicy.getOutstandingBalance() : 0.0;
        if (amount > balance) {
            throw new RuntimeException("Payment amount exceeds outstanding balance!");
        }

        userPolicy.setOutstandingBalance(balance - amount);
        userPolicyRepository.save(userPolicy);
        return mapToUserPolicyResponse(userPolicy);
    }

    // Cancel a user-policy violently (Admin lifecycle bypass)
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

    // Automatically execute Monthly Billings, Sent Reminders, and Mark Expirations
    @Scheduled(cron = "0 0 0 * * *")
    public void runDailyBillingAndReminders() {
        System.out.println("Starting Daily Cron Billing Engine...");

        // 1. Process Due Policies
        List<UserPolicy> duePolicies = userPolicyRepository.findPoliciesDueForBilling();
        for (UserPolicy p : duePolicies) {
            double currentBalance = p.getOutstandingBalance() != null ? p.getOutstandingBalance() : 0.0;
            p.setOutstandingBalance(currentBalance + p.getPremiumAmount());
            LocalDate currentDue = p.getNextDueDate() != null ? p.getNextDueDate() : LocalDate.now();
            p.setNextDueDate(currentDue.plusMonths(1));
            System.out.println("BILLED: Policy #" + p.getId() + " charged ₹" + p.getPremiumAmount() + ". Total Balance: ₹" + p.getOutstandingBalance());
        }
        userPolicyRepository.saveAll(duePolicies);

        // 2. Proactive Reminders 5 days prior
        LocalDate reminderDate = LocalDate.now().plusDays(5);
        List<UserPolicy> reminderPolicies = userPolicyRepository.findPoliciesForReminder(reminderDate);
        for (UserPolicy p : reminderPolicies) {
            System.out.println("NOTIFICATION DISPATCH [Email/Dashboard]: Friendly Reminder: Your Premium of ₹" + p.getPremiumAmount() + " for Policy #" + p.getId() + " is due on " + reminderDate);
        }

        // 3. Mark elapsed dates past duration as EXPIRED
        List<UserPolicy> expiredPolicies = userPolicyRepository.findExpiredActivePolicies();
        if (!expiredPolicies.isEmpty()) {
            for (UserPolicy userPolicy : expiredPolicies) {
                userPolicy.setStatus(PolicyStatus.EXPIRED);
            }
            userPolicyRepository.saveAll(expiredPolicies);
            System.out.println("Successfully marked " + expiredPolicies.size() + " elapsed policies as EXPIRED.");
        }
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
        if (policy.getPolicyType() != null) {
            dto.setPolicyTypeId(policy.getPolicyType().getId());
            if (policy.getPolicyType().getCategory() != null) {
                dto.setPolicyCategory(policy.getPolicyType().getCategory().name());
            }
        }
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
        dto.setOutstandingBalance(userPolicy.getOutstandingBalance() != null ? userPolicy.getOutstandingBalance() : 0.0);
        dto.setNextDueDate(userPolicy.getNextDueDate());
        return dto;
    }
}