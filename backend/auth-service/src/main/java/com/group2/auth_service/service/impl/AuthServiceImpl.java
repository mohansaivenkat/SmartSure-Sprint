package com.group2.auth_service.service.impl;

import com.group2.auth_service.service.IAuthService;
import com.group2.auth_service.dto.*;
import com.group2.auth_service.entity.*;
import com.group2.auth_service.feign.NotificationClient;
import com.group2.auth_service.repository.AuthServiceRepository;
import com.group2.auth_service.security.JwtUtil;
import com.group2.auth_service.util.AuthMapper;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Optional;
import java.util.stream.Collectors;

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
		return args -> initAdmin();
	}

    @Transactional
    public void initAdmin() {
        if (userRepository.findByEmail("admin@capgemini.com").isEmpty()) {
            User admin = new User(); admin.setName("Admin"); admin.setEmail("admin@capgemini.com");
            admin.setPassword(passwordEncoder.encode("admin123")); admin.setRole(Role.ADMIN);
            admin.setPhone("0000000000"); admin.setAddress("Admin");
            userRepository.save(admin);
        }
    }
	
    @Transactional
	public UserResponseDTO register(RegisterRequest req) {
        String email = req.getEmail().trim().toLowerCase();
        if (userRepository.findByEmail(email).isPresent()) throw new com.group2.auth_service.exception.UserAlreadyExistsException("EXISTS");
        
        if (Boolean.FALSE.equals(notificationClient.isOtpVerified(email).getBody())) throw new RuntimeException("OTP_NOT_VERIFIED");
        notificationClient.markOtpAsUsed(email);

        req.setEmail(email);
        User user = authMapper.mapToUser(req);
        user.setPassword(passwordEncoder.encode(req.getPassword())); user.setRole(Role.CUSTOMER); 
        return authMapper.mapToResponse(userRepository.save(user));
	}

	@Transactional
	public AuthResponse login(LoginRequest req) {
	    String email = req.getEmail().trim().toLowerCase();
	    User user = userRepository.findByEmail(email).orElseThrow(() -> new com.group2.auth_service.exception.UnauthorizedException("Invalid email or password", "AUTH_INVALID_CREDENTIALS"));
	    
	    if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
	        throw new com.group2.auth_service.exception.UnauthorizedException("Invalid email or password", "AUTH_INVALID_CREDENTIALS");
	    }
	    
	    String token = jwtUtil.generateToken(user.getEmail(), user.getId(), user.getRole().name());
	    String refresh = jwtUtil.generateRefreshToken(user.getEmail(), user.getId());
	    user.setRefreshToken(refresh);
	    userRepository.save(user);
	    return new AuthResponse(token, refresh, user.getRole().name(), user.getId());
	}

	@Transactional
	public AuthResponse refreshToken(String token) {
	    if (!jwtUtil.validateToken(token)) throw new RuntimeException("INVALID");
	    
	    Long id = jwtUtil.extractUserId(token);
	    User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("NF"));
	    if (!token.equals(user.getRefreshToken())) {
            user.setRefreshToken(null); userRepository.save(user);
            throw new RuntimeException("REUSE");
        }

	    String access = jwtUtil.generateToken(user.getEmail(), id, user.getRole().name());
	    String refresh = jwtUtil.generateRefreshToken(user.getEmail(), id);
	    user.setRefreshToken(refresh);
	    userRepository.save(user);
	    return new AuthResponse(access, refresh, user.getRole().name(), user.getId());
	}

    public void sendRegistrationOtp(String email) {
        String e = email.trim().toLowerCase();
        if (userRepository.findByEmail(e).isPresent()) throw new com.group2.auth_service.exception.UserAlreadyExistsException("EXISTS");
        notificationClient.sendOtp(e);
    }

    public void verifyOtp(String email, String otp) { notificationClient.verifyOtp(email.trim().toLowerCase(), otp); }

    public void sendForgotPasswordOtp(String email) {
        String e = email.trim().toLowerCase();
        if (userRepository.findByEmail(e).isEmpty()) throw new RuntimeException("NF");
        notificationClient.sendOtp(e);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest req) {
        String email = req.getEmail().trim().toLowerCase();
        if (Boolean.FALSE.equals(notificationClient.isOtpVerified(email).getBody())) throw new RuntimeException("OTP");

        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("NF"));
        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
        notificationClient.markOtpAsUsed(email);
    }

    @Override
    public UserResponseDTO getProfile() {
        Long userId = getAuthUserId();
        return userRepository.findById(userId).map(authMapper::mapToResponse).orElseThrow(() -> new RuntimeException("NF"));
    }

    @Override
    @Transactional
    public UserResponseDTO updateProfile(UserProfileRequest req) {
        Long userId = getAuthUserId();
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("NF"));
        authMapper.updateUserFromRequest(req, user);
        return authMapper.mapToResponse(userRepository.save(user));
    }

    private Long getAuthUserId() {
        Object p = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (p instanceof Long) return (Long) p;
        try { return Long.valueOf(p.toString()); } catch (Exception e) { throw new RuntimeException("FAIL"); }
    }

	public UserResponseDTO getUserById(Long id) { return userRepository.findById(id).map(authMapper::mapToResponse).orElseThrow(() -> new RuntimeException("NF")); }
	public java.util.List<UserResponseDTO> getAllUsers() { return userRepository.findAll().stream().map(authMapper::mapToResponse).toList(); }

    @Override
    public PageResponseDTO<UserResponseDTO> getAllUsersPaginated(int p, int s, String q) {
        Page<User> pg = userRepository.findAllCustomersPaginated(q, PageRequest.of(p, s));
        return new PageResponseDTO<>(pg.getContent().stream().map(authMapper::mapToResponse).toList(), pg.getNumber(), pg.getSize(), pg.getTotalElements(), pg.getTotalPages(), pg.isLast());
    }
}
