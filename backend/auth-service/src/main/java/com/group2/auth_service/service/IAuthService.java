package com.group2.auth_service.service;

import java.util.List;
import com.group2.auth_service.dto.AuthResponse;
import com.group2.auth_service.dto.LoginRequest;
import com.group2.auth_service.dto.RegisterRequest;
import com.group2.auth_service.dto.ResetPasswordRequest;
import com.group2.auth_service.dto.UserProfileRequest;
import com.group2.auth_service.entity.User;

import com.group2.auth_service.dto.UserResponseDTO;

public interface IAuthService {
    UserResponseDTO register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    void sendRegistrationOtp(String email);
    void verifyOtp(String email, String otp);
    void sendForgotPasswordOtp(String email);
    void resetPassword(ResetPasswordRequest request);
    UserResponseDTO updateProfile(UserProfileRequest request);
    UserResponseDTO getUserById(Long id);
    List<UserResponseDTO> getAllUsers();
}
