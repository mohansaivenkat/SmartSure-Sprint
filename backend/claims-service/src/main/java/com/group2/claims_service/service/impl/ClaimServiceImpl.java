package com.group2.claims_service.service.impl;

import com.group2.claims_service.service.IClaimService;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import com.group2.claims_service.dto.*;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.group2.claims_service.entity.*;
import com.group2.claims_service.exception.*;
import com.group2.claims_service.feign.*;
import com.group2.claims_service.repository.*;
import com.group2.claims_service.util.ClaimMapper;
import org.slf4j.*;

@Service
public class ClaimServiceImpl implements IClaimService {
	
	private final ClaimRepository claimRepository;
	private final ClaimDocumentRepository documentRepository;
	private final AuthClient authClient;
	private final PolicyClient policyClient;
	private final NotificationClient notificationClient;
	private final RabbitTemplate rabbitTemplate;
	private final ClaimMapper claimMapper;
	private static final Logger log = LoggerFactory.getLogger(ClaimServiceImpl.class);
	
	public ClaimServiceImpl(ClaimRepository claimRepository, ClaimDocumentRepository documentRepository, AuthClient authClient, PolicyClient policyClient, NotificationClient notificationClient, RabbitTemplate rabbitTemplate, ClaimMapper claimMapper) {
		this.claimRepository = claimRepository;
		this.documentRepository = documentRepository;
		this.authClient = authClient;
		this.policyClient = policyClient;
		this.notificationClient = notificationClient;
		this.rabbitTemplate = rabbitTemplate;
		this.claimMapper = claimMapper;
	}
	
    @Override
    public ClaimResponseDTO initiateClaim(ClaimRequestDTO req) {
        try {
            UserPolicyDTO p = policyClient.getUserPolicyById(req.getPolicyId());
            if (p == null) throw new RuntimeException("404");
            if (!"ACTIVE".equals(p.getStatus())) throw new RuntimeException("Claim initiation failed: Policy status is " + p.getStatus());
            if (!p.getUserId().equals(req.getUserId())) throw new RuntimeException("Fraud detected");
        } catch (RuntimeException re) {
            log.error("Validation failed: {}", re.getMessage());
            String msg = re.getMessage() != null ? re.getMessage() : "";
            if (msg.contains("404")) throw new RuntimeException("Policy ID not found");
            if (msg.contains("401") || msg.contains("403")) throw new RuntimeException("Auth error");
            if (msg.contains("Connection refused") || msg.contains("timed out") || msg.contains("service down")) {
                throw new RuntimeException("System unavailable");
            }
            throw re;
        }

	    Claim c = claimMapper.mapToEntity(req);
        c.setClaimStatus(ClaimStatus.SUBMITTED);
        c.setCreatedAt(LocalDateTime.now());
	    Claim saved = claimRepository.save(c);

        try {
            UserDTO u = authClient.getUserById(saved.getUserId());
            if (u != null && u.getEmail() != null) {
                String polName = java.util.Optional.ofNullable(policyClient.getUserPolicyById(saved.getPolicyId())).map(UserPolicyDTO::getPolicyName).orElse("Your Policy");
                String sub = "SmartSure: Claim Submitted";
                String body = buildClaimSubmittedEmailHtml(u.getName(), polName);
                
                try {
                    notificationClient.sendEmail(new EmailRequest(u.getEmail(), sub, body));
                } catch (Exception ex) {
                    rabbitTemplate.convertAndSend("notification.exchange", "notification.send", new NotificationEvent(u.getEmail(), sub, body));
                }
            }
        } catch (Exception e) { log.error("Notify failed: {}", e.getMessage()); }

        return claimMapper.mapToResponse(saved);
    }
	
	public String uploadDocument(Long claimId, MultipartFile file) {
		claimRepository.findById(claimId).orElseThrow(()-> new ClaimNotFoundException("NF"));

		// Enforce 1 MB limit
		long maxSize = 1 * 1024 * 1024; // 1 MB
		if (file.getSize() > maxSize) throw new IllegalArgumentException("File size exceeds 1 MB limit");
		
		String ct = file.getContentType();
		String fn = file.getOriginalFilename();
		boolean valid = (ct != null && (ct.equalsIgnoreCase("image/jpeg") || ct.equalsIgnoreCase("application/pdf"))) 
                     || (fn != null && (fn.toLowerCase().endsWith(".jpg") || fn.toLowerCase().endsWith(".pdf")));

		if (!valid) throw new IllegalArgumentException("Invalid format");
		
		ClaimDocument d = new ClaimDocument();
		d.setClaimId(claimId); d.setFileUrl(fn); d.setDocumentType(ct); d.setCreatedAt(LocalDateTime.now());
		try { d.setFileData(file.getBytes()); } catch (java.io.IOException e) { throw new RuntimeException("IO", e); }
		documentRepository.save(d);
		return "Document uploaded Successfully";
	}
	
	public ClaimDocument getClaimDocument(Long id) { return documentRepository.findByClaimId(id).orElseThrow(() -> new ClaimNotFoundException("NF")); }
	
	public ClaimResponseDTO getClaimStatus(Long id) {
		Claim c = claimRepository.findById(id).orElseThrow(()-> new ClaimNotFoundException("NF"));
		ClaimResponseDTO res = claimMapper.mapToResponse(c);
		populate(res, c);
		res.setMessage("OK");
		return res;
	}
	
	public ClaimResponseDTO getClaimById(Long id) {
	    Claim c = claimRepository.findById(id).orElseThrow(() -> new ClaimNotFoundException("NF"));
	    ClaimResponseDTO res = claimMapper.mapToResponse(c);
	    populate(res, c);
	    res.setMessage("OK");
	    return res;
	}

    public void updateClaimStatus(Long id, String s, String r) {
        Claim c = claimRepository.findById(id).orElseThrow(() -> new ClaimNotFoundException("NF"));
        ClaimStatus target = ClaimStatus.valueOf(s.toUpperCase());
        ClaimStatus cur = c.getClaimStatus();

        boolean ok = switch (target) {
            case UNDER_REVIEW -> cur == ClaimStatus.SUBMITTED || cur == ClaimStatus.CLOSED;
            case APPROVED, REJECTED -> cur == ClaimStatus.UNDER_REVIEW;
            case CLOSED -> cur == ClaimStatus.APPROVED || cur == ClaimStatus.REJECTED;
            default -> false;
        };

        if (!ok) throw new RuntimeException("Invalid transition from " + cur + " to " + target);

        c.setClaimStatus(target);
        if (r != null) c.setAdminRemark(r);
        claimRepository.save(c);

        if (target == ClaimStatus.APPROVED || target == ClaimStatus.REJECTED) {
            try {
                UserDTO u = authClient.getUserById(c.getUserId());
                if (u != null && u.getEmail() != null) {
                    String sub = "Claim Update: " + target;
                    String body = buildClaimStatusEmailHtml(c.getId(), target, r);
                    try {
                        notificationClient.sendEmail(new EmailRequest(u.getEmail(), sub, body));
                    } catch (Exception ex) {
                        rabbitTemplate.convertAndSend("notification.exchange", "notification.email", new NotificationEvent(u.getEmail(), sub, body));
                    }
                }
            } catch(Exception e) { log.error("Notify failed: {}", e.getMessage()); }
        }
    }

    /** Inline styles only — email clients ignore most {@code <style>} blocks. */
    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    private static String buildClaimSubmittedEmailHtml(String userName, String policyName) {
        return "<p style=\"margin:0 0 14px;font-size:16px;color:#1e40af;\"><strong>Hello " + esc(userName) + ",</strong></p>"
                + "<p style=\"margin:0 0 16px;color:#334155;line-height:1.6;\">We have received your claim for <strong style=\"color:#0f172a;\">"
                + esc(policyName) + "</strong>.</p>"
                + "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\" style=\"background-color:#eff6ff;border-radius:10px;border-left:4px solid #2563eb;\">"
                + "<tr><td style=\"padding:14px 18px;\">"
                + "<p style=\"margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;\">Status</p>"
                + "<p style=\"margin:0;font-size:17px;font-weight:700;color:#1e3a8a;\">Under review</p>"
                + "</td></tr></table>"
                + "<p style=\"margin:20px 0 0;font-size:14px;color:#64748b;\">You will receive another email when the status changes.</p>";
    }

    private static String buildClaimStatusEmailHtml(Long claimId, ClaimStatus target, String remark) {
        String color = target == ClaimStatus.APPROVED ? "#059669" : "#dc2626";
        String rem = remark != null && !remark.isBlank() ? remark : "—";
        return "<p style=\"margin:0 0 12px;font-size:16px;\"><strong style=\"color:#1e40af;\">Claim update</strong></p>"
                + "<p style=\"margin:0 0 14px;color:#334155;\">Claim <strong>#" + claimId + "</strong> is now:</p>"
                + "<p style=\"margin:0 0 16px;padding:14px 16px;border-radius:8px;background-color:#f8fafc;font-weight:700;font-size:18px;color:"
                + color + ";\">" + esc(String.valueOf(target)) + "</p>"
                + "<p style=\"margin:0;font-size:14px;color:#64748b;line-height:1.5;\"><strong style=\"color:#334155;\">Remark:</strong> " + esc(rem) + "</p>";
    }

    private void populate(ClaimResponseDTO dto, Claim c) {
        if (dto != null && dto.getClaimId() != null) dto.setHasDocument(documentRepository.existsByClaimId(dto.getClaimId()));
        if (dto != null && c != null) dto.setAdminRemark(c.getAdminRemark());
    }

    public List<ClaimResponseDTO> getClaimsByUserId(Long id) {
        return claimRepository.findByUserId(id).stream().map(c -> { ClaimResponseDTO r = claimMapper.mapToResponse(c); populate(r, c); return r; }).toList();
    }

    public List<ClaimResponseDTO> getAllClaims() {
        return claimRepository.findAll().stream().map(c -> { ClaimResponseDTO r = claimMapper.mapToResponse(c); populate(r, c); return r; }).toList();
    }

    @Override
    public PageResponseDTO<ClaimResponseDTO> getAllClaimsPaginated(int p, int s, String q) {
        Page<Claim> pg = claimRepository.findAllPaginated(q, PageRequest.of(p, s));
        return new PageResponseDTO<>(pg.getContent().stream().map(c -> { ClaimResponseDTO r = claimMapper.mapToResponse(c); populate(r, c); return r; }).toList(), pg.getNumber(), pg.getSize(), pg.getTotalElements(), pg.getTotalPages(), pg.isLast());
    }

    @Override
    public PageResponseDTO<ClaimResponseDTO> getClaimsByUserIdPaginated(Long u, int p, int s, String q) {
        Page<Claim> pg = claimRepository.findByUserIdPaginated(u, q, PageRequest.of(p, s));
        return new PageResponseDTO<>(pg.getContent().stream().map(c -> { ClaimResponseDTO r = claimMapper.mapToResponse(c); populate(r, c); return r; }).toList(), pg.getNumber(), pg.getSize(), pg.getTotalElements(), pg.getTotalPages(), pg.isLast());
    }

	public ClaimStatsDTO getClaimStats() {
	    ClaimStatsDTO stats = new ClaimStatsDTO();
	    stats.setTotalClaims(claimRepository.count());
	    stats.setSubmittedClaims(claimRepository.countByClaimStatus(ClaimStatus.SUBMITTED));
	    stats.setApprovedClaims(claimRepository.countByClaimStatus(ClaimStatus.APPROVED));
	    stats.setRejectedClaims(claimRepository.countByClaimStatus(ClaimStatus.REJECTED));
	    return stats;
	}

    public void cancelClaimsByPolicy(Long id) {
        claimRepository.findByPolicyId(id).forEach(c -> {
            if (c.getClaimStatus() == ClaimStatus.SUBMITTED) {
                c.setClaimStatus(ClaimStatus.REJECTED);
                claimRepository.save(c);
            }
        });
    }
}
