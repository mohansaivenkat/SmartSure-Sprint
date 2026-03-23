package com.group2.auth_service.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.group2.auth_service.dto.AuthResponse;
import com.group2.auth_service.dto.LoginRequest;
import com.group2.auth_service.dto.RegisterRequest;
import com.group2.auth_service.entity.Role;
import com.group2.auth_service.entity.User;
import com.group2.auth_service.exception.UserAlreadyExistsException;
import com.group2.auth_service.repository.AuthServiceRepository;
import com.group2.auth_service.security.JwtUtil;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private AuthServiceRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;
    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        sampleUser = new User();
        sampleUser.setId(1L);
        sampleUser.setName("Test User");
        sampleUser.setEmail("test@test.com");
        sampleUser.setPassword("encodedPassword");
        sampleUser.setRole(Role.CUSTOMER);

        registerRequest = new RegisterRequest();
        registerRequest.setName("Test User");
        registerRequest.setEmail("new@test.com");
        registerRequest.setPassword("password123");
        registerRequest.setPhone("1234567890");
        registerRequest.setAddress("Test Address");

        loginRequest = new LoginRequest();
        loginRequest.setEmail("test@test.com");
        loginRequest.setPassword("password123");
    }

    /**
     * Given: Admin user does not exist
     * When: initAdmin is called
     * Then: A new admin user should be saved to the repository
     */
    @Test
    void testInitAdmin_AdminDoesNotExist() {
        when(userRepository.findByEmail("admin@capgemini.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("encodedAdminPassword");

        authService.initAdmin();

        verify(userRepository, times(1)).save(any(User.class));
    }

    /**
     * Given: Admin user already exists
     * When: initAdmin is called
     * Then: No new user should be saved
     */
    @Test
    void testInitAdmin_AdminAlreadyExists() {
        User adminUser = new User();
        adminUser.setEmail("admin@capgemini.com");
        when(userRepository.findByEmail("admin@capgemini.com")).thenReturn(Optional.of(adminUser));

        authService.initAdmin();

        verify(userRepository, never()).save(any(User.class));
    }

    /**
     * Given: A valid register request with a new email
     * When: Register method is called
     * Then: A new user should be saved and returned
     */
    @Test
    void testRegister_Success() {
        when(userRepository.findByEmail(registerRequest.getEmail())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(registerRequest.getPassword())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        User savedUser = authService.register(registerRequest);

        assertNotNull(savedUser);
        assertEquals(sampleUser.getEmail(), savedUser.getEmail());
        verify(userRepository, times(1)).save(any(User.class));
    }

    /**
     * Given: A register request with an existing email
     * When: Register method is called
     * Then: A UserAlreadyExistsException should be thrown
     */
    @Test
    void testRegister_UserAlreadyExists() {
        when(userRepository.findByEmail(registerRequest.getEmail())).thenReturn(Optional.of(sampleUser));

        assertThrows(UserAlreadyExistsException.class, () -> authService.register(registerRequest));
        verify(userRepository, never()).save(any(User.class));
    }

    /**
     * Given: A valid login request
     * When: login is called
     * Then: A valid AuthResponse with a JWT token should be returned
     */
    @Test
    void testLogin_Success() {
        when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches(loginRequest.getPassword(), sampleUser.getPassword())).thenReturn(true);
        when(jwtUtil.generateToken(anyString(), anyLong(), anyString())).thenReturn("mockJwtToken");

        AuthResponse response = authService.login(loginRequest);

        assertNotNull(response);
        assertEquals("mockJwtToken", response.getToken());
        assertEquals(sampleUser.getRole().name(), response.getRole());
    }

    /**
     * Given: A login request with an invalid password
     * When: login is called
     * Then: A RuntimeException should be thrown
     */
    @Test
    void testLogin_InvalidPassword() {
        when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches(loginRequest.getPassword(), sampleUser.getPassword())).thenReturn(false);

        assertThrows(RuntimeException.class, () -> authService.login(loginRequest));
    }

    /**
     * Given: A login request with an invalid email
     * When: login is called
     * Then: A RuntimeException should be thrown
     */
    @Test
    void testLogin_UserNotFound() {
        when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> authService.login(loginRequest));
    }
}
