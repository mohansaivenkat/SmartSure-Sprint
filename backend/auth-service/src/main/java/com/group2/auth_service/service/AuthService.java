package com.group2.auth_service.service;

import java.util.Optional;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import jakarta.transaction.Transactional;

import com.group2.auth_service.dto.AuthResponse;
import com.group2.auth_service.dto.LoginRequest;
import com.group2.auth_service.dto.RegisterRequest;
import com.group2.auth_service.dto.ResetPasswordRequest;
import com.group2.auth_service.dto.UserProfileRequest;
import com.group2.auth_service.entity.Role;
import com.group2.auth_service.entity.User;
import com.group2.auth_service.feign.NotificationClient;
import com.group2.auth_service.repository.AuthServiceRepository;
import com.group2.auth_service.security.JwtUtil;

@Service
public class AuthService {

	private final AuthServiceRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtUtil jwtUtil;
	private final NotificationClient notificationClient;

	public AuthService(AuthServiceRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil, NotificationClient notificationClient) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtUtil = jwtUtil;
		this.notificationClient = notificationClient;
	}
	
	@PostConstruct
	public void initAdmin() {
		Optional<User> adminOpt = userRepository.findByEmail("admin@capgemini.com");
		if (adminOpt.isEmpty()) {
			User admin = new User();
			admin.setName("Admin");
			admin.setEmail("admin@capgemini.com");
			admin.setPassword(passwordEncoder.encode("admin123"));
			admin.setRole(Role.ADMIN);
			admin.setPhone("0000000000"); 
			admin.setAddress("Admin Address");
			userRepository.save(admin);
		}
	}
	
    @Transactional
	public User register(RegisterRequest request) {
        Optional<User> existingUser = userRepository.findByEmail(request.getEmail());

        if (existingUser.isPresent()) {
            throw new com.group2.auth_service.exception.UserAlreadyExistsException("Email is already registered.");
        } 
        
        // Verify OTP was verified in Notification Service
        Boolean isVerified = notificationClient.isOtpVerified(request.getEmail()).getBody();
        if (Boolean.FALSE.equals(isVerified)) {
            throw new RuntimeException("OTP not verified for registration.");
        }
        
        notificationClient.markOtpAsUsed(request.getEmail());

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));    
        user.setPhone(request.getPhone());
        user.setAddress(request.getAddress());
        user.setRole(Role.CUSTOMER); 
        
        return userRepository.save(user);
	}

	public AuthResponse login(LoginRequest request) {
	    Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
	    
	    if (userOpt.isPresent()) {
	        User user = userOpt.get();        

	        if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
	            String token = jwtUtil.generateToken(user.getEmail(), user.getId(),user.getRole().name());
	            return new AuthResponse(token, user.getRole().name(), user.getId());
	        }
	    }
	    throw new RuntimeException("Invalid credentials");
	}

    public void sendRegistrationOtp(String email) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new com.group2.auth_service.exception.UserAlreadyExistsException("Email is already registered.");
        }
        notificationClient.sendOtp(email);
    }

    public void verifyOtp(String email, String otp) {
        notificationClient.verifyOtp(email, otp);
    }

    public void sendForgotPasswordOtp(String email) {
        if (userRepository.findByEmail(email).isEmpty()) {
            throw new RuntimeException("User with this email does not exist.");
        }
        notificationClient.sendOtp(email);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        Boolean isVerified = notificationClient.isOtpVerified(request.getEmail()).getBody();
        if (Boolean.FALSE.equals(isVerified)) {
            throw new RuntimeException("OTP not verified for password reset.");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        
        notificationClient.markOtpAsUsed(request.getEmail());
    }

    @Transactional
    public User updateProfile(UserProfileRequest request) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long userId = (principal instanceof Long) ? (Long) principal : Long.parseLong(principal.toString());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setName(request.getName());
        user.setPhone(request.getPhone());
        user.setAddress(request.getAddress());
        
        return userRepository.save(user);
    }

	public User getUserById(Long id) {
	    return userRepository.findById(id)
	            .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
	}

	public java.util.List<User> getAllUsers() {
		return userRepository.findAll();
	}

}
