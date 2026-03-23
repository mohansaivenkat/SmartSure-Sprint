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
import com.group2.auth_service.entity.User;
import com.group2.auth_service.service.AuthService;
import com.group2.auth_service.service.OtpService;
import org.springframework.test.util.ReflectionTestUtils;
import org.junit.jupiter.api.BeforeEach;

@ExtendWith(MockitoExtension.class)
public class AuthControllerTest {

    @Mock
    private AuthService authService;

    @Mock
    private OtpService otpService;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authController, "otpService", otpService);
    }

    /**
     * Given: A valid register request
     * When: register endpoint is called
     * Then: otp is validated and user is registered successfully
     */
    @Test
    void register() {
        User user = new User();
        RegisterRequest req = new RegisterRequest();
        req.setEmail("test@test.com");
        
        doNothing().when(otpService).validateOtpBeforeRegister(anyString());
        when(authService.register(any())).thenReturn(user);
        
        ResponseEntity<User> res = authController.register(req);
        assertEquals(user, res.getBody());
    }

    /**
     * Given: A valid login request
     * When: login endpoint is called
     * Then: AuthResponse containing the token is returned
     */
    @Test
    void login() {
        AuthResponse response = new AuthResponse("token", "CUSTOMER", 1L);
        when(authService.login(any())).thenReturn(response);
        
        ResponseEntity<AuthResponse> res = authController.login(new LoginRequest());
        assertEquals(response, res.getBody());
    }

    /**
     * Given: An email parameter
     * When: sendOtp endpoint is called
     * Then: success message is returned
     */
    @Test
    void testSendOtp() {
        doNothing().when(otpService).sendOtp(anyString());
        String res = authController.sendOtp("test@test.com");
        assertEquals("OTP sent to email", res);
    }

    /**
     * Given: An email and otp parameter
     * When: verifyOtp endpoint is called
     * Then: success message is returned
     */
    @Test
    void testVerifyOtp() {
        when(otpService.verifyOtp(anyString(), anyString())).thenReturn(true);
        String res = authController.verifyOtp("test@test.com", "123456");
        assertEquals("OTP verified successfully", res);
    }
}
