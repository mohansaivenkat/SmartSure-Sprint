package com.group2.auth_service.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.group2.auth_service.dto.AuthResponse;
import com.group2.auth_service.dto.LoginRequest;
import com.group2.auth_service.dto.RegisterRequest;
import com.group2.auth_service.dto.ResetPasswordRequest;
import com.group2.auth_service.dto.UserResponseDTO;
import com.group2.auth_service.entity.Role;
import com.group2.auth_service.entity.User;
import com.group2.auth_service.exception.UserAlreadyExistsException;
import com.group2.auth_service.feign.NotificationClient;
import com.group2.auth_service.repository.AuthServiceRepository;
import com.group2.auth_service.security.JwtUtil;
import com.group2.auth_service.service.impl.AuthServiceImpl;
import com.group2.auth_service.util.AuthMapper;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock private AuthServiceRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;
    @Mock private NotificationClient notificationClient;
    @Mock private AuthMapper authMapper;

    @InjectMocks
    private AuthServiceImpl authService;

    private User sampleUser;
    
    @BeforeEach
    void setUp() {
        sampleUser = new User();
        sampleUser.setId(1L);
        sampleUser.setEmail("test@test.com");
        sampleUser.setPassword("encodedPassword");
        sampleUser.setRole(Role.CUSTOMER);
        sampleUser.setRefreshToken("mockOldRefresh");
    }

    @Test
    void testRegister_Success() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("new@test.com");
        req.setPassword("password");

        when(userRepository.findByEmail("new@test.com")).thenReturn(Optional.empty());
        when(notificationClient.isOtpVerified("new@test.com")).thenReturn(ResponseEntity.ok(true));
        when(authMapper.mapToUser(any())).thenReturn(sampleUser);
        when(authMapper.mapToResponse(any())).thenReturn(new UserResponseDTO());

        assertNotNull(authService.register(req));
        verify(userRepository, times(1)).save(sampleUser);
    }

    @Test
    void testRegister_AlreadyExists() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("test@test.com");
        when(userRepository.findByEmail("test@test.com")).thenReturn(Optional.of(sampleUser));
        assertThrows(UserAlreadyExistsException.class, () -> authService.register(req));
    }

    @Test
    void testLogin_Success() {
        LoginRequest req = new LoginRequest();
        req.setEmail("test@test.com");
        req.setPassword("pass");

        when(userRepository.findByEmail("test@test.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("pass", "encodedPassword")).thenReturn(true);
        when(jwtUtil.generateToken(anyString(), anyLong(), anyString())).thenReturn("mockAccess");
        when(jwtUtil.generateRefreshToken(anyString(), anyLong())).thenReturn("mockRefresh");

        AuthResponse res = authService.login(req);

        assertNotNull(res);
        assertEquals("mockAccess", res.getToken());
        assertEquals("mockRefresh", res.getRefreshToken());
    }

    @Test
    void testRefreshToken_Success() {
        when(jwtUtil.validateToken("mockOldRefresh")).thenReturn(true);
        when(jwtUtil.extractUserId("mockOldRefresh")).thenReturn(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(jwtUtil.generateToken(anyString(), anyLong(), anyString())).thenReturn("newAccess");
        when(jwtUtil.generateRefreshToken(anyString(), anyLong())).thenReturn("newRefresh");

        AuthResponse res = authService.refreshToken("mockOldRefresh");

        assertNotNull(res);
        assertEquals("newAccess", res.getToken());
        assertEquals("newRefresh", res.getRefreshToken());
    }

    @Test
    void testGetProfile_Success() {
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(1L);
        SecurityContext ctx = mock(SecurityContext.class);
        when(ctx.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(ctx);

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(authMapper.mapToResponse(any())).thenReturn(new UserResponseDTO());

        assertNotNull(authService.getProfile());
        SecurityContextHolder.clearContext();
    }

    @Test
    void testInitAdmin_AdminNotFound() {
        when(userRepository.findByEmail("admin@capgemini.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        authService.initAdmin();
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void testInitAdmin_AdminExists() {
        when(userRepository.findByEmail("admin@capgemini.com")).thenReturn(Optional.of(sampleUser));
        authService.initAdmin();
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testRegister_OtpNotVerified() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("new@test.com");
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(notificationClient.isOtpVerified(anyString())).thenReturn(ResponseEntity.ok(false));
        assertThrows(RuntimeException.class, () -> authService.register(req));
    }

    @Test
    void testLogin_UserNotFound() {
        LoginRequest req = new LoginRequest();
        req.setEmail("nonexistent@test.com");
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> authService.login(req));
    }

    @Test
    void testLogin_InvalidPassword() {
        LoginRequest req = new LoginRequest();
        req.setEmail("test@test.com");
        req.setPassword("wrong");
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("wrong", "encodedPassword")).thenReturn(false);
        assertThrows(RuntimeException.class, () -> authService.login(req));
    }

    @Test
    void testRefreshToken_UserNotFound() {
        when(jwtUtil.validateToken(anyString())).thenReturn(true);
        when(jwtUtil.extractUserId(anyString())).thenReturn(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> authService.refreshToken("token"));
    }

    @Test
    void testRefreshToken_ReuseAttack() {
        when(jwtUtil.validateToken(anyString())).thenReturn(true);
        when(jwtUtil.extractUserId(anyString())).thenReturn(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        assertThrows(RuntimeException.class, () -> authService.refreshToken("differentToken"));
    }

    @Test
    void testRefreshToken_InvalidStatus() {
        when(jwtUtil.validateToken(anyString())).thenReturn(false);
        assertThrows(RuntimeException.class, () -> authService.refreshToken("token"));
    }

    @Test
    void testSendRegistrationOtp_AlreadyExists() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(sampleUser));
        assertThrows(com.group2.auth_service.exception.UserAlreadyExistsException.class, () -> authService.sendRegistrationOtp("test@test.com"));
    }

    @Test
    void testSendRegistrationOtp_Success() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        authService.sendRegistrationOtp("test@test.com");
        verify(notificationClient, times(1)).sendOtp(anyString());
    }

    @Test
    void testVerifyOtp() {
        authService.verifyOtp("test@test.com", "123456");
        verify(notificationClient, times(1)).verifyOtp("test@test.com", "123456");
    }

    @Test
    void testSendForgotPasswordOtp_NotExists() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> authService.sendForgotPasswordOtp("test@test.com"));
    }

    @Test
    void testSendForgotPasswordOtp_Success() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(sampleUser));
        authService.sendForgotPasswordOtp("test@test.com");
        verify(notificationClient, times(1)).sendOtp(anyString());
    }

    @Test
    void testResetPassword_OtpNotVerified() {
        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setEmail("test@test.com");
        when(notificationClient.isOtpVerified(anyString())).thenReturn(ResponseEntity.ok(false));
        assertThrows(RuntimeException.class, () -> authService.resetPassword(req));
    }

    @Test
    void testResetPassword_Success() {
        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setEmail("test@test.com");
        req.setNewPassword("newPass");
        when(notificationClient.isOtpVerified(anyString())).thenReturn(ResponseEntity.ok(true));
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(sampleUser));
        authService.resetPassword(req);
        verify(passwordEncoder, times(1)).encode("newPass");
    }

    @Test
    void testUpdateProfile_Success() {
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(1L);
        SecurityContext ctx = mock(SecurityContext.class);
        when(ctx.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(ctx);

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(authMapper.mapToResponse(any())).thenReturn(new UserResponseDTO());

        assertNotNull(authService.updateProfile(new com.group2.auth_service.dto.UserProfileRequest()));
        SecurityContextHolder.clearContext();
    }

    @Test
    void testGetUserById_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(authMapper.mapToResponse(any())).thenReturn(new UserResponseDTO());
        assertNotNull(authService.getUserById(1L));
    }

    @Test
    void testGetUserById_NotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> authService.getUserById(1L));
    }

    @Test
    void testGetAllUsers() {
        when(userRepository.findAll()).thenReturn(java.util.Collections.singletonList(sampleUser));
        assertEquals(1, authService.getAllUsers().size());
    }

    @Test
    void testGetAllUsersPaginated() {
        org.springframework.data.domain.Page<User> page = mock(org.springframework.data.domain.Page.class);
        when(page.getContent()).thenReturn(java.util.Collections.singletonList(sampleUser));
        when(page.getNumber()).thenReturn(0);
        when(page.getSize()).thenReturn(10);
        when(page.getTotalElements()).thenReturn(1L);
        when(page.getTotalPages()).thenReturn(1);
        when(page.isLast()).thenReturn(true);

        when(userRepository.findAllCustomersPaginated(anyString(), any())).thenReturn(page);
        assertNotNull(authService.getAllUsersPaginated(0, 10, ""));
    }

    @Test
    void testGetProfile_InvalidPrincipal() {
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn("invalid");
        SecurityContext ctx = mock(SecurityContext.class);
        when(ctx.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(ctx);

        assertThrows(RuntimeException.class, () -> authService.getProfile());
        SecurityContextHolder.clearContext();
    }

    @Test
    void testDataLoader() throws Exception {
        org.springframework.boot.CommandLineRunner runner = authService.dataLoader(authService);
        when(userRepository.findByEmail("admin@capgemini.com")).thenReturn(Optional.of(sampleUser));
        runner.run(new String[0]);
        verify(userRepository, times(1)).findByEmail("admin@capgemini.com");
    }

    @Test
    void testUpdateProfile_NotFound() {
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(1L);
        SecurityContext ctx = mock(SecurityContext.class);
        when(ctx.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(ctx);

        when(userRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> authService.updateProfile(new com.group2.auth_service.dto.UserProfileRequest()));
        SecurityContextHolder.clearContext();
    }

    @Test
    void testUpdateProfile_InvalidPrincipal() {
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn("invalid");
        SecurityContext ctx = mock(SecurityContext.class);
        when(ctx.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(ctx);

        assertThrows(RuntimeException.class, () -> authService.updateProfile(new com.group2.auth_service.dto.UserProfileRequest()));
        SecurityContextHolder.clearContext();
    }

    @Test
    void testGetProfile_NotFound() {
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(1L);
        SecurityContext ctx = mock(SecurityContext.class);
        when(ctx.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(ctx);

        when(userRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> authService.getProfile());
        SecurityContextHolder.clearContext();
    }
}
