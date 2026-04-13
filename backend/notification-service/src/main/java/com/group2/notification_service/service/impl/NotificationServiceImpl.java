package com.group2.notification_service.service.impl;

import com.group2.notification_service.service.INotificationService;
import org.springframework.scheduling.annotation.Async;

import java.time.LocalDateTime;
import java.util.Random;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.group2.notification_service.entity.Otp;
import com.group2.notification_service.exception.OtpException;
import com.group2.notification_service.repository.OtpRepository;
import com.group2.notification_service.util.EmailHtmlLayout;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
@Service
@Transactional
public class NotificationServiceImpl implements INotificationService {
	
	private static final Logger log = LoggerFactory.getLogger(NotificationServiceImpl.class);

    private final OtpRepository otpRepository;
    private final JavaMailSender javaMailSender;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${brevo.api.key}")
    private String apiKey;

    @Value("${brevo.sender.email}")
    private String senderEmail;

    @Value("${spring.mail.username}")
    private String smtpUsername;

    public NotificationServiceImpl(OtpRepository otpRepository, JavaMailSender javaMailSender) {
        this.otpRepository = otpRepository;
        this.javaMailSender = javaMailSender;
    }

    @Override
    @Async
    public void sendOtp(String email) {
        log.info("Sending OTP via Brevo to email: {}", email);
        String otp = String.valueOf(new Random().nextInt(900000) + 100000);
        
        otpRepository.deleteByEmail(email);

        Otp otpEntity = new Otp();
        otpEntity.setEmail(email);
        otpEntity.setOtp(otp);
        otpEntity.setVerified(false);
        otpEntity.setExpiryTime(LocalDateTime.now().plusMinutes(10));

        otpRepository.save(otpEntity);

        sendEmailViaBrevo(email, otp);
    }

    private void sendEmailViaBrevo(String email, String otp) {
        log.debug("Dispatching OTP via Brevo API to: {}", email);
        String url = "https://api.brevo.com/v3/smtp/email";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", apiKey);

        String otpHtml = EmailHtmlLayout.build(EmailHtmlLayout.buildOtpInnerHtml(otp));
        String htmlEscaped = EmailHtmlLayout.escapeForJson(otpHtml);
        String emailEscaped = EmailHtmlLayout.escapeForJson(email);
        String senderEscaped = EmailHtmlLayout.escapeForJson(senderEmail);
        String body = "{\n" +
                "\"sender\": {\"name\": \"SmartSure\", \"email\": \"" + senderEscaped + "\"},\n" +
                "\"to\": [{\"email\": \"" + emailEscaped + "\"}],\n" +
                "\"subject\": \"OTP Verification\",\n" +
                "\"htmlContent\": \"" + htmlEscaped + "\"\n" +
                "}";

        try {
            HttpEntity<String> request = new HttpEntity<>(body, headers);
            String response = restTemplate.postForObject(url, request, String.class);
            log.info("Brevo OTP response: {}", response);
        } catch (Exception e) {
            log.error("Failed to send OTP via Brevo: {}", e.getMessage());
            throw new RuntimeException("OTP delivery failed", e);
        }
    }

    public boolean verifyOtp(String email, String otp) {
        log.info("Verifying OTP for email: {}", email);
        Otp otpEntity = otpRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("No OTP record found for: {}", email);
                    return new OtpException("OTP not found");
                });

        if (otpEntity.getExpiryTime().isBefore(LocalDateTime.now())) {
            log.warn("OTP expired for: {}", email);
            throw new OtpException("OTP expired");
        }

        if (!otpEntity.getOtp().equals(otp)) {
            log.warn("Invalid OTP entry for: {}", email);
            throw new OtpException("Invalid OTP");
        }

        otpEntity.setVerified(true);
        otpRepository.save(otpEntity);
        log.info("OTP verified for: {}", email);

        return true;
    }

    @Override
    @Async
    public void sendGeneralEmail(String to, String subject, String body) {
        log.info("Sending status notification via SMTP (HTML support) to: {}, Subject: {}", to, subject);
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(EmailHtmlLayout.build(body), true);
            helper.setFrom(smtpUsername); // CRITICAL FIX: Use SMTP auth email, not Brevo email

            javaMailSender.send(message);
            log.info("SMTP HTML email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send SMTP HTML email to {}: {}", to, e.getMessage());
            throw new RuntimeException("SMTP delivery failed", e);
        }
    }
    
    public boolean isOtpVerified(String email) {
        return otpRepository.findByEmail(email)
                .map(Otp::isVerified)
                .orElse(false);
    }
    
    public void markOtpAsUsed(String email) {
        log.info("Marking OTP used for: {}", email);
        otpRepository.deleteByEmail(email);
    }
}
