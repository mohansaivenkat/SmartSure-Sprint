package com.group2.policy_service.service.impl;

import com.group2.policy_service.dto.NotificationEvent;
import com.group2.policy_service.dto.EmailRequest;
import com.group2.policy_service.feign.NotificationClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.time.LocalDate;

@Service
public class AsyncNotificationService {
    private static final Logger log = LoggerFactory.getLogger(AsyncNotificationService.class);
    private final RabbitTemplate rabbitTemplate;
    private final NotificationClient notificationClient;

    public AsyncNotificationService(RabbitTemplate rabbitTemplate, NotificationClient notificationClient) {
        this.rabbitTemplate = rabbitTemplate;
        this.notificationClient = notificationClient;
    }

    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    private void process(String email, String subject, String body) {
        if (email == null) return;
        try {
            rabbitTemplate.convertAndSend("notification.exchange", "notification.email", new NotificationEvent(email, subject, body));
        } catch (Exception e) {
            try {
                notificationClient.sendEmail(new EmailRequest(email, subject, body));
            } catch (Exception ex) {
                log.error("Fatal fail");
            }
        }
    }

    @Async
    public void sendPurchaseNotification(String userEmail, String userName, String policyName, Double premium, Double coverage, LocalDate endDate) {
        String html = "<p style=\"margin:0 0 10px;font-size:16px;color:#059669;\"><strong>Policy purchase confirmed</strong></p>"
                + "<p style=\"margin:0 0 14px;color:#334155;line-height:1.6;\">Hi " + esc(userName) + ", thank you for choosing SmartSure.</p>"
                + "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\" style=\"background-color:#f0fdf4;border-radius:10px;border-left:4px solid #22c55e;\">"
                + "<tr><td style=\"padding:14px 18px;\">"
                + "<p style=\"margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;\">Policy</p>"
                + "<p style=\"margin:0 0 12px;font-size:17px;font-weight:700;color:#14532d;\">" + esc(policyName) + "</p>"
                + "<p style=\"margin:4px 0;font-size:14px;color:#334155;\">Premium: <strong>₹" + esc(String.valueOf(premium)) + "</strong></p>"
                + "<p style=\"margin:4px 0;font-size:14px;color:#334155;\">Coverage: <strong>₹" + esc(String.valueOf(coverage)) + "</strong></p>"
                + "<p style=\"margin:4px 0 0;font-size:14px;color:#334155;\">Valid until: <strong>" + esc(String.valueOf(endDate)) + "</strong></p>"
                + "</td></tr></table>";
        process(userEmail, "SmartSure: Policy Purchase", html);
    }

    @Async
    public void sendPaymentNotification(String userEmail, String userName, String policyName, Double amount, Double balance) {
        String html = "<p style=\"margin:0 0 10px;font-size:16px;color:#1e40af;\"><strong>Payment received</strong></p>"
                + "<p style=\"margin:0 0 14px;color:#334155;\">Hi " + esc(userName) + ", we received your premium payment.</p>"
                + "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\" style=\"background-color:#eff6ff;border-radius:10px;border-left:4px solid #2563eb;\">"
                + "<tr><td style=\"padding:14px 18px;\">"
                + "<p style=\"margin:0 0 8px;font-weight:700;color:#1e3a8a;\">" + esc(policyName) + "</p>"
                + "<p style=\"margin:0;font-size:15px;color:#334155;\">Amount paid: <strong style=\"color:#059669;\">₹" + esc(String.valueOf(amount)) + "</strong></p>"
                + "<p style=\"margin:8px 0 0;font-size:14px;color:#64748b;\">Outstanding balance: <strong>₹" + esc(String.valueOf(balance)) + "</strong></p>"
                + "</td></tr></table>";
        process(userEmail, "SmartSure: Payment Received", html);
    }

    @Async
    public void sendCancellationRequestNotification(String userEmail, String userName, String policyName) {
        String html = "<p style=\"margin:0 0 10px;font-size:16px;color:#b45309;\"><strong>Cancellation request received</strong></p>"
                + "<p style=\"margin:0 0 12px;color:#334155;\">Hi " + esc(userName) + ", we received your request to cancel:</p>"
                + "<p style=\"margin:0;padding:14px 16px;background-color:#fffbeb;border-radius:8px;border:1px solid #fcd34d;font-weight:600;color:#92400e;\">"
                + esc(policyName) + "</p>"
                + "<p style=\"margin:14px 0 0;font-size:14px;color:#64748b;\">An administrator will review and confirm shortly.</p>";
        process(userEmail, "SmartSure: Cancellation Request", html);
    }

    @Async
    public void sendCancellationApprovalNotification(String userEmail, String userName, String policyName) {
        String html = "<p style=\"margin:0 0 10px;font-size:16px;color:#334155;\"><strong>Policy cancelled</strong></p>"
                + "<p style=\"margin:0 0 12px;color:#334155;\">Hi " + esc(userName) + ", your cancellation is complete.</p>"
                + "<p style=\"margin:0;padding:14px 16px;background-color:#f8fafc;border-radius:8px;border-left:4px solid #64748b;font-weight:600;color:#0f172a;\">"
                + esc(policyName) + "</p>";
        process(userEmail, "SmartSure: Policy Cancelled", html);
    }
}
