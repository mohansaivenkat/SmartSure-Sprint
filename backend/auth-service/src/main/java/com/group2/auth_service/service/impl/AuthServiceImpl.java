package com.group2.auth_service.service.impl;

import com.group2.auth_service.service.IAuthService;

import java.util.Optional;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;

import com.group2.auth_service.dto.AuthResponse;
import com.group2.auth_service.dto.LoginRequest;
import com.group2.auth_service.dto.RegisterRequest;
import com.group2.auth_service.dto.ResetPasswordRequest;
import com.group2.auth_service.dto.UserProfileRequest;
import com.group2.auth_service.dto.UserResponseDTO;
import com.group2.auth_service.entity.Role;
import com.group2.auth_service.entity.User;
import com.group2.auth_service.feign.NotificationClient;
import com.group2.auth_service.repository.AuthServiceRepository;
import com.group2.auth_service.security.JwtUtil;

import com.group2.auth_service.util.AuthMapper;

@Service
public class AuthServiceImpl implements IAuthService {

	private final AuthServiceRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtUtil jwtUtil;
	private final NotificationClient notificationClient;
	private final AuthMapper authMapper;

	public AuthServiceImpl(AuthServiceRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil, NotificationClient notificationClient, AuthMapper authMapper) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtUtil = jwtUtil;
		this.notificationClient = notificationClient;
		this.authMapper = authMapper;
	}
	
	@org.springframework.context.annotation.Bean
	public org.springframework.boot.CommandLineRunner dataLoader(IAuthService authService) {
		return args -> {
			initAdmin();
		};
	}

    @Transactional
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
            System.out.println("Admin user initialized.");
        }
    }
	
    @Transactional
	public UserResponseDTO register(RegisterRequest request) {
        String sanitizedEmail = request.getEmail().trim().toLowerCase();
        Optional<User> existingUser = userRepository.findByEmail(sanitizedEmail);

        if (existingUser.isPresent()) {
            throw new com.group2.auth_service.exception.UserAlreadyExistsException("Email is already registered.");
        } 
        
        // Use sanitizedEmail for subsequent steps
        Boolean isVerified = notificationClient.isOtpVerified(sanitizedEmail).getBody();
        if (Boolean.FALSE.equals(isVerified)) {
            throw new RuntimeException("OTP not verified for registration.");
        }
        
        notificationClient.markOtpAsUsed(sanitizedEmail);

        request.setEmail(sanitizedEmail); // update request with sanitized email

        User user = authMapper.mapToUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));    
        user.setRole(Role.CUSTOMER); 
        
        return authMapper.mapToResponse(userRepository.save(user));
	}

	public AuthResponse login(LoginRequest request) {
	    String sanitizedEmail = request.getEmail().trim().toLowerCase();
	    Optional<User> userOpt = userRepository.findByEmail(sanitizedEmail);
	    
	    if (userOpt.isPresent()) {
	        User user = userOpt.get();        

	        if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
	            String token = jwtUtil.generateToken(user.getEmail(), user.getId(), user.getRole().name());
	            String refreshToken = jwtUtil.generateRefreshToken(user.getEmail(), user.getId());
	            return new AuthResponse(token, refreshToken, user.getRole().name(), user.getId());
	        }
	    }
	    throw new RuntimeException("Invalid credentials");
	}

	public AuthResponse refreshToken(String refreshToken) {
	    if (jwtUtil.validateToken(refreshToken)) {
	        String email = jwtUtil.extractEmail(refreshToken);
	        Long userId = jwtUtil.extractUserId(refreshToken);
	        User user = userRepository.findById(userId)
	                .orElseThrow(() -> new RuntimeException("User not found"));
	        
	        String newToken = jwtUtil.generateToken(email, userId, user.getRole().name());
	        return new AuthResponse(newToken, refreshToken, user.getRole().name(), user.getId());
	    }
	    throw new RuntimeException("Invalid refresh token");
	}

    public void sendRegistrationOtp(String email) {
        String sanitizedEmail = email.trim().toLowerCase();
        if (userRepository.findByEmail(sanitizedEmail).isPresent()) {
            throw new com.group2.auth_service.exception.UserAlreadyExistsException("Email is already registered.");
        }
        notificationClient.sendOtp(sanitizedEmail);
    }

    public void verifyOtp(String email, String otp) {
        notificationClient.verifyOtp(email.trim().toLowerCase(), otp);
    }

    public void sendForgotPasswordOtp(String email) {
        String sanitizedEmail = email.trim().toLowerCase();
        if (userRepository.findByEmail(sanitizedEmail).isEmpty()) {
            throw new RuntimeException("User with this email does not exist.");
        }
        notificationClient.sendOtp(sanitizedEmail);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String sanitizedEmail = request.getEmail().trim().toLowerCase();
        Boolean isVerified = notificationClient.isOtpVerified(sanitizedEmail).getBody();
        if (Boolean.FALSE.equals(isVerified)) {
            throw new RuntimeException("OTP not verified for password reset.");
        }

        User user = userRepository.findByEmail(sanitizedEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        
        notificationClient.markOtpAsUsed(sanitizedEmail);
    }

    @Transactional
    public UserResponseDTO updateProfile(UserProfileRequest request) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long userId = (principal instanceof Long) ? (Long) principal : Long.parseLong(principal.toString());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        authMapper.updateUserFromRequest(request, user);
        
        return authMapper.mapToResponse(userRepository.save(user));
    }

	public UserResponseDTO getUserById(Long id) {
	    return userRepository.findById(id)
	            .map(authMapper::mapToResponse)
	            .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
	}

	public java.util.List<UserResponseDTO> getAllUsers() {
		return userRepository.findAll().stream()
                .map(authMapper::mapToResponse)
                .collect(java.util.stream.Collectors.toList());
	}

}
