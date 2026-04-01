package com.group2.auth_service.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import com.group2.auth_service.dto.AuthResponse;
import com.group2.auth_service.dto.LoginRequest;
import com.group2.auth_service.dto.RegisterRequest;
import com.group2.auth_service.dto.UserResponseDTO;
import com.group2.auth_service.service.IAuthService;

@ExtendWith(MockitoExtension.class)
public class AuthControllerTest {

    @Mock
    private IAuthService authService;

    @InjectMocks
    private AuthController authController;

    @Test
    void register() {
        UserResponseDTO user = new UserResponseDTO();
        RegisterRequest req = new RegisterRequest();
        req.setEmail("test@test.com");
        
        when(authService.register(any())).thenReturn(user);
        
        ResponseEntity<UserResponseDTO> res = authController.register(req);
        assertEquals(user, res.getBody());
    }

    @Test
    void login() {
        AuthResponse response = new AuthResponse("token", "CUSTOMER", "rfdh", 1L);
        when(authService.login(any())).thenReturn(response);
        
        ResponseEntity<AuthResponse> res = authController.login(new LoginRequest());
        assertEquals(response, res.getBody());
    }

    @Test
    void testSendOtp() {
        doNothing().when(authService).sendRegistrationOtp(anyString());
        ResponseEntity<String> res = authController.sendOtp("test@test.com");
        assertEquals("OTP sent to email", res.getBody());
    }

    @Test
    void testVerifyOtp() {
        doNothing().when(authService).verifyOtp(anyString(), anyString());
        ResponseEntity<String> res = authController.verifyOtp("test@test.com", "123456");
        assertEquals("OTP verified successfully", res.getBody());
    }
}
