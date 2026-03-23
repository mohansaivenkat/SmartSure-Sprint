package com.group2.auth_service.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedConstruction;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;

import com.group2.auth_service.entity.Otp;
import com.group2.auth_service.entity.User;
import com.group2.auth_service.exception.OtpException;
import com.group2.auth_service.exception.UserAlreadyExistsException;
import com.group2.auth_service.repository.AuthServiceRepository;
import com.group2.auth_service.repository.OtpRepository;

@ExtendWith(MockitoExtension.class)
public class OtpServiceTest {

    @Mock
    private OtpRepository otpRepository;

    @Mock
    private AuthServiceRepository authServiceRepository;

    @InjectMocks
    private OtpService otpService;

    private Otp validOtp;

    @BeforeEach
    void setUp() {
        validOtp = new Otp();
        validOtp.setEmail("test@test.com");
        validOtp.setOtp("123456");
        validOtp.setVerified(false);
        validOtp.setExpiryTime(LocalDateTime.now().plusMinutes(5));
    }

    /**
     * Given: An email already registered
     * When: sendOtp is called
     * Then: UserAlreadyExistsException is thrown
     */
    @Test
    void testSendOtp_UserAlreadyExists() {
        when(authServiceRepository.findByEmail(anyString())).thenReturn(Optional.of(new User()));
        
        assertThrows(UserAlreadyExistsException.class, () -> otpService.sendOtp("test@test.com"));
    }

    /**
     * Given: A new email address
     * When: sendOtp is called
     * Then: Otp is generated, saved, and email is sent
     */
    @Test
    void testSendOtp_Success() {
        when(authServiceRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        doNothing().when(otpRepository).deleteByEmail(anyString());
        when(otpRepository.save(any(Otp.class))).thenReturn(new Otp());

        try (MockedConstruction<RestTemplate> mocked = mockConstruction(RestTemplate.class,
                (mock, context) -> {
                    when(mock.postForObject(anyString(), any(), eq(String.class))).thenReturn("Mocked Response");
                })) {
            
            otpService.sendOtp("new@test.com");
            
            verify(otpRepository, times(1)).save(any(Otp.class));
        }
    }

    /**
     * Given: A valid and unexpired OTP
     * When: verifyOtp is called
     * Then: OTP is marked as verified and returns true
     */
    @Test
    void testVerifyOtp_Success() {
        when(otpRepository.findByEmail("test@test.com")).thenReturn(Optional.of(validOtp));
        
        boolean result = otpService.verifyOtp("test@test.com", "123456");
        
        assertTrue(result);
        assertTrue(validOtp.isVerified());
        verify(otpRepository, times(1)).save(validOtp);
    }

    /**
     * Given: An expired OTP
     * When: verifyOtp is called
     * Then: OtpException is thrown
     */
    @Test
    void testVerifyOtp_Expired() {
        validOtp.setExpiryTime(LocalDateTime.now().minusMinutes(5));
        when(otpRepository.findByEmail("test@test.com")).thenReturn(Optional.of(validOtp));
        
        assertThrows(OtpException.class, () -> otpService.verifyOtp("test@test.com", "123456"));
    }

    /**
     * Given: An invalid OTP string
     * When: verifyOtp is called
     * Then: OtpException is thrown
     */
    @Test
    void testVerifyOtp_InvalidOtp() {
        when(otpRepository.findByEmail("test@test.com")).thenReturn(Optional.of(validOtp));
        
        assertThrows(OtpException.class, () -> otpService.verifyOtp("test@test.com", "wrongOtp"));
    }

    /**
     * Given: A verified OTP
     * When: validateOtpBeforeRegister is called
     * Then: No exception is thrown
     */
    @Test
    void testValidateOtpBeforeRegister_Success() {
        validOtp.setVerified(true);
        when(authServiceRepository.findByEmail("test@test.com")).thenReturn(Optional.empty());
        when(otpRepository.findByEmail("test@test.com")).thenReturn(Optional.of(validOtp));
        
        assertDoesNotThrow(() -> otpService.validateOtpBeforeRegister("test@test.com"));
    }

    /**
     * Given: An unverified OTP
     * When: validateOtpBeforeRegister is called
     * Then: OtpException is thrown
     */
    @Test
    void testValidateOtpBeforeRegister_NotVerified() {
        when(authServiceRepository.findByEmail("test@test.com")).thenReturn(Optional.empty());
        when(otpRepository.findByEmail("test@test.com")).thenReturn(Optional.of(validOtp));
        
        assertThrows(OtpException.class, () -> otpService.validateOtpBeforeRegister("test@test.com"));
    }
}
