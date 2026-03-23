package com.group2.auth_service.service;


import java.time.LocalDateTime;
import java.util.Random;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.group2.auth_service.entity.Otp;
import com.group2.auth_service.exception.OtpException;
import com.group2.auth_service.exception.UserAlreadyExistsException;
import com.group2.auth_service.repository.AuthServiceRepository;
import com.group2.auth_service.repository.OtpRepository;

@Service
@Transactional
public class OtpService {

    private final OtpRepository otpRepository;
    private final AuthServiceRepository authServiceRepository;

    // 🔐 Inject API key from properties
    @Value("${brevo.api.key}")
    private String apiKey;

    public OtpService(OtpRepository otpRepository, AuthServiceRepository authServiceRepository) {
        this.otpRepository = otpRepository;
        this.authServiceRepository = authServiceRepository;
    }

    // 🔹 Generate & Send OTP
    public void sendOtp(String email) {

        if (authServiceRepository.findByEmail(email).isPresent()) {
            throw new UserAlreadyExistsException("User with email " + email + " is already registered.");
        }

        String otp = String.valueOf(new Random().nextInt(900000) + 100000);

        // delete old OTP if exists
        otpRepository.deleteByEmail(email);

        Otp otpEntity = new Otp();
        otpEntity.setEmail(email);
        otpEntity.setOtp(otp);
        otpEntity.setVerified(false);
        otpEntity.setExpiryTime(LocalDateTime.now().plusMinutes(10));

        otpRepository.save(otpEntity);

        sendEmail(email, otp);
    }

    // 🔹 Send email using Brevo API
    private void sendEmail(String email, String otp) {

        RestTemplate restTemplate = new RestTemplate();

        String url = "https://api.brevo.com/v3/smtp/email";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", apiKey);

        String body = "{\n" +
                "\"sender\": {\"name\": \"SmartSure\", \"email\": \"np164429@gmail.com\"},\n" +
                "\"to\": [{\"email\": \"" + email + "\"}],\n" +
                "\"subject\": \"OTP Verification\",\n" +
                "\"htmlContent\": \"<h3>Your OTP is: <b>" + otp + "</b></h3><p>Valid for 10 minutes.</p>\"\n" +
                "}";

        HttpEntity<String> request = new HttpEntity<>(body, headers);

        restTemplate.postForObject(url, request, String.class);
        
        String response = restTemplate.postForObject(url, request, String.class);
        System.out.println("Brevo Response: " + response);
    }

    // 🔹 Verify OTP
    public boolean verifyOtp(String email, String otp) {

        Otp otpEntity = otpRepository.findByEmail(email)
                .orElseThrow(() -> new OtpException("OTP not found"));

        if (otpEntity.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new OtpException("OTP expired");
        }

        if (!otpEntity.getOtp().equals(otp)) {
            throw new OtpException("Invalid OTP");
        }

        otpEntity.setVerified(true);
        otpRepository.save(otpEntity);

        return true;
    }

    // 🔹 Validate before registration
    public void validateOtpBeforeRegister(String email) {

        if (authServiceRepository.findByEmail(email).isPresent()) {
            throw new UserAlreadyExistsException("User with email " + email + " is already registered.");
        }

        Otp otp = otpRepository.findByEmail(email)
                .orElseThrow(() -> new OtpException("OTP not found"));

        if (!otp.isVerified()) {
            throw new OtpException("OTP not verified");
        }
    }
}
