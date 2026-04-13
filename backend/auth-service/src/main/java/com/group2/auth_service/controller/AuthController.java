package com.group2.auth_service.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.group2.auth_service.dto.AuthResponse;
import com.group2.auth_service.dto.LoginRequest;
import com.group2.auth_service.dto.PageResponseDTO;
import com.group2.auth_service.dto.RegisterRequest;
import com.group2.auth_service.dto.ResetPasswordRequest;
import com.group2.auth_service.dto.UserProfileRequest;
import com.group2.auth_service.dto.UserResponseDTO;
import com.group2.auth_service.service.IAuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
	
	private final IAuthService service;

	public AuthController(IAuthService service) {
		this.service = service;
	}

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(service.login(request));
    }
    
    @PostMapping("/register")
    public ResponseEntity<UserResponseDTO> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(service.register(request));
    }
    
    @PostMapping("/send-otp")
    public ResponseEntity<String> sendOtp(@RequestParam String email) {
        service.sendRegistrationOtp(email);
        return ResponseEntity.ok("OTP sent to email");
    }
    
    @PostMapping("/verify-otp")
    public ResponseEntity<String> verifyOtp(@RequestParam String email, @RequestParam String otp) {
        service.verifyOtp(email, otp);
        return ResponseEntity.ok("OTP verified successfully");
    }

    @PostMapping("/forgot-password/send-otp")
    public ResponseEntity<String> forgotPasswordSendOtp(@RequestParam String email) {
        service.sendForgotPasswordOtp(email);
        return ResponseEntity.ok("Forgot password OTP sent to email");
    }

    @PostMapping("/forgot-password/verify-otp")
    public ResponseEntity<String> forgotPasswordVerifyOtp(@RequestParam String email, @RequestParam String otp) {
        service.verifyOtp(email, otp);
        return ResponseEntity.ok("OTP verified successfully");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody ResetPasswordRequest request) {
        service.resetPassword(request);
        return ResponseEntity.ok("Password reset successfully");
    }

    @GetMapping("/profile")
    public ResponseEntity<UserResponseDTO> getProfile() {
        return ResponseEntity.ok(service.getProfile());
    }

    @PutMapping("/profile")
    public ResponseEntity<UserResponseDTO> updateProfile(@RequestBody UserProfileRequest request) {
        return ResponseEntity.ok(service.updateProfile(request));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getUserById(id));
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        return ResponseEntity.ok(service.getAllUsers());
    }

    @GetMapping("/users/paginated")
    public ResponseEntity<PageResponseDTO<UserResponseDTO>> getUsersPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String query) {
        return ResponseEntity.ok(service.getAllUsersPaginated(page, size, query));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<AuthResponse> refreshToken(@RequestParam String refreshToken) {
        return ResponseEntity.ok(service.refreshToken(refreshToken));
    }
}
