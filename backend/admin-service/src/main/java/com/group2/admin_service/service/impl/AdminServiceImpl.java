package com.group2.admin_service.service.impl;

import com.group2.admin_service.dto.*;
import com.group2.admin_service.feign.*;
import com.group2.admin_service.service.IAdminService;
import com.group2.admin_service.util.AdminMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class AdminServiceImpl implements IAdminService {

    private final AuthFeignClient authClient;
    private final ClaimsFeignClient claimClient;
    private final PolicyFeignClient policyClient;
    private final NotificationFeignClient notificationClient;
    private final AdminMapper adminMapper;
    private static final Logger log = LoggerFactory.getLogger(AdminServiceImpl.class);

    public AdminServiceImpl(AuthFeignClient authClient, ClaimsFeignClient claimClient,
                            PolicyFeignClient policyClient, NotificationFeignClient notificationClient,
                            AdminMapper adminMapper) {
        this.authClient = authClient;
        this.claimClient = claimClient;
        this.policyClient = policyClient;
        this.notificationClient = notificationClient;
        this.adminMapper = adminMapper;
    }

    @Override public List<UserDTO> getAllUsers() { return authClient.getAllUsers(); }

    @Override
    public List<ClaimDTO> getAllClaims() { return claimClient.getAllClaims(); }

    @Override
    public void reviewClaim(Long id, ReviewRequest req) {
        claimClient.updateClaimStatus(id, new ClaimStatusUpdateDTO(req.getStatus(), req.getRemark()));
        try {
            ClaimDTO c = claimClient.getClaimById(id);
            if (c != null && c.getUserId() != null) {
                UserDTO u = authClient.getUserById(c.getUserId());
                if (u != null && u.getEmail() != null) {
                    notificationClient.sendEmail(new EmailRequest(u.getEmail(), "SmartSure: Claim reviewed",
                            buildClaimReviewedEmailHtml(req.getStatus(), req.getRemark())));
                }
            }
        } catch (Exception e) { log.error("Notify fail: {}", e.getMessage()); }
    }

    @Override public ClaimDTO getClaimStatus(Long id) { return claimClient.getClaimStatus(id); }
    @Override public List<ClaimDTO> getClaimsByUserId(Long id) { return claimClient.getClaimsByUserId(id); }
    @Override public ResponseEntity<byte[]> downloadClaimDocument(Long id) { return claimClient.downloadDocument(id); }

    @Override public PolicyDTO createPolicy(PolicyRequestDTO dto) { return policyClient.createPolicy(dto); }
    @Override public PolicyDTO updatePolicy(Long id, PolicyRequestDTO dto) { return policyClient.updatePolicy(id, dto); }
    @Override public void deletePolicy(Long id) { policyClient.deletePolicy(id); }

    /**
     * Paginated customers for admin UI. Response shape matches Spring Page JSON expected by the frontend:
     * {@code content}, {@code totalElements}, {@code totalPages}, {@code number}, {@code size}.
     */
    @Override
    public Map<String, Object> getFilteredUsers(int p, int s, String q, String ps, String cs) {
        List<UserDTO> allUsers = safeList(() -> authClient.getAllUsers(), "users");
        List<UserPolicyDTO> policies = safeList(() -> policyClient.getAllUserPolicies(), "policies");
        List<ClaimDTO> claims = safeList(() -> claimClient.getAllClaims(), "claims");

        String search = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);

        List<UserDTO> customers = allUsers.stream()
                .filter(u -> u != null && u.getId() != null)
                .filter(u -> !isAdminRole(u.getRole()))
                .map(u -> enrichUser(u, policies, claims))
                .filter(u -> matchesSearch(u, search))
                .filter(u -> matchesPolicyStatus(u, ps))
                .filter(u -> matchesClaimStatus(u, cs))
                .collect(Collectors.toList());

        int size = Math.max(1, s);
        int page = Math.max(0, p);
        long total = customers.size();
        int from = (int) Math.min(page * (long) size, total);
        int to = (int) Math.min(from + size, total);
        List<UserDTO> content = from < to ? new ArrayList<>(customers.subList(from, to)) : new ArrayList<>();

        long totalPages = total == 0 ? 1 : (total + size - 1) / size;

        Map<String, Object> res = new HashMap<>();
        res.put("content", content);
        res.put("totalElements", total);
        res.put("totalPages", totalPages);
        res.put("number", page);
        res.put("size", size);
        return res;
    }

    private <T> List<T> safeList(java.util.concurrent.Callable<List<T>> call, String label) {
        try {
            List<T> list = call.call();
            return list != null ? list : List.of();
        } catch (Exception e) {
            log.error("getFilteredUsers {}: {}", label, e.getMessage());
            return List.of();
        }
    }

    private static boolean isAdminRole(String role) {
        if (role == null) return false;
        return role.toUpperCase(Locale.ROOT).contains("ADMIN");
    }

    private static UserDTO enrichUser(UserDTO u, List<UserPolicyDTO> policies, List<ClaimDTO> claims) {
        UserDTO dto = new UserDTO();
        dto.setId(u.getId());
        dto.setName(u.getName());
        dto.setEmail(u.getEmail());
        dto.setRole(u.getRole());
        dto.setPhone(u.getPhone());
        dto.setAddress(u.getAddress());

        Long uid = u.getId();
        List<UserPolicyDTO> ups = policies.stream()
                .filter(up -> up != null && uid.equals(up.getUserId()))
                .toList();

        dto.setPolicyCount(ups.size());
        dto.setHasPendingPolicy(ups.stream().anyMatch(up ->
                "PENDING_CANCELLATION".equalsIgnoreCase(String.valueOf(up.getStatus()))));
        dto.setHasActivePolicy(ups.stream().anyMatch(up ->
                "ACTIVE".equalsIgnoreCase(String.valueOf(up.getStatus()))));

        List<ClaimDTO> ucs = claims.stream()
                .filter(c -> c != null && uid.equals(c.getUserId()))
                .toList();
        dto.setHasSubmittedClaim(ucs.stream().anyMatch(c ->
                "SUBMITTED".equalsIgnoreCase(String.valueOf(c.getStatus()))));
        dto.setHasReviewingClaim(ucs.stream().anyMatch(c ->
                "UNDER_REVIEW".equalsIgnoreCase(String.valueOf(c.getStatus()))));
        return dto;
    }

    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    private static String buildClaimReviewedEmailHtml(String status, String remark) {
        String r = remark != null && !remark.isBlank()
                ? "<p style=\"margin:14px 0 0;font-size:14px;color:#64748b;line-height:1.5;\"><strong style=\"color:#334155;\">Remark:</strong> "
                + esc(remark) + "</p>"
                : "";
        return "<p style=\"margin:0 0 12px;font-size:16px;\"><strong style=\"color:#1e40af;\">Your claim was reviewed</strong></p>"
                + "<p style=\"margin:0;font-size:15px;color:#334155;\">New status: <strong style=\"color:#0f172a;\">" + esc(status) + "</strong></p>"
                + r;
    }

    private static boolean matchesSearch(UserDTO u, String search) {
        if (search.isEmpty()) return true;
        String name = u.getName() != null ? u.getName().toLowerCase(Locale.ROOT) : "";
        String email = u.getEmail() != null ? u.getEmail().toLowerCase(Locale.ROOT) : "";
        return name.contains(search) || email.contains(search);
    }

    private static boolean matchesPolicyStatus(UserDTO u, String ps) {
        if (ps == null || ps.isBlank() || "ALL".equalsIgnoreCase(ps)) return true;
        if ("PENDING_CANCELLATION".equalsIgnoreCase(ps)) return Boolean.TRUE.equals(u.getHasPendingPolicy());
        if ("ACTIVE".equalsIgnoreCase(ps)) return Boolean.TRUE.equals(u.getHasActivePolicy());
        return true;
    }

    private static boolean matchesClaimStatus(UserDTO u, String cs) {
        if (cs == null || cs.isBlank() || "ALL".equalsIgnoreCase(cs)) return true;
        if ("SUBMITTED".equalsIgnoreCase(cs)) return Boolean.TRUE.equals(u.getHasSubmittedClaim());
        if ("UNDER_REVIEW".equalsIgnoreCase(cs)) return Boolean.TRUE.equals(u.getHasReviewingClaim());
        return true;
    }

    @Override
    public ReportResponse getReports() {
        try {
            return adminMapper.mapToReportResponse(claimClient.getClaimStats(), policyClient.getPolicyStats());
        } catch (Exception e) {
            log.error("Report fail: {}", e.getMessage());
            return new ReportResponse();
        }
    }
}
