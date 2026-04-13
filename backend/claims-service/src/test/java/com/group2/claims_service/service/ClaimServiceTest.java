package com.group2.claims_service.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.anyLong;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.util.Optional;
import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.data.domain.*;
import org.springframework.web.multipart.MultipartFile;

import com.group2.claims_service.dto.*;
import com.group2.claims_service.entity.*;
import com.group2.claims_service.feign.*;
import com.group2.claims_service.repository.*;
import com.group2.claims_service.service.impl.ClaimServiceImpl;
import com.group2.claims_service.util.ClaimMapper;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class ClaimServiceTest {

    @Mock private ClaimRepository claimRepository;
    @Mock private ClaimDocumentRepository documentRepository;
    @Mock private AuthClient authClient;
    @Mock private PolicyClient policyClient;
    @Mock private NotificationClient notificationClient;
    @Mock private RabbitTemplate rabbitTemplate;
    @Mock private ClaimMapper claimMapper;

    @InjectMocks
    private ClaimServiceImpl claimService;

    private Claim claim;
    private UserPolicyDTO policy;

    @BeforeEach
    void setUp() {
        claim = new Claim(); claim.setId(1L); claim.setUserId(1L); claim.setPolicyId(1L); claim.setClaimStatus(ClaimStatus.SUBMITTED);
        policy = new UserPolicyDTO(); policy.setStatus("ACTIVE"); policy.setUserId(1L); policy.setPolicyName("P");
        
        when(claimRepository.findById(anyLong())).thenReturn(Optional.of(claim));
        when(claimRepository.findAll()).thenReturn(List.of(claim));
        when(claimRepository.findByUserId(anyLong())).thenReturn(List.of(claim));
        
        when(policyClient.getUserPolicyById(anyLong())).thenReturn(policy);
        when(claimMapper.mapToEntity(any())).thenReturn(claim);
        when(claimMapper.mapToResponse(any())).thenReturn(new ClaimResponseDTO());
        when(documentRepository.findByClaimId(anyLong())).thenReturn(Optional.of(new ClaimDocument()));
    }

    @Test
    void testInitiateClaim_Success() {
        ClaimRequestDTO req = new ClaimRequestDTO(); req.setUserId(1L); req.setPolicyId(1L);
        when(claimRepository.save(any())).thenReturn(claim);
        when(authClient.getUserById(anyLong())).thenReturn(new UserDTO("t@t.com", "N"));
        assertNotNull(claimService.initiateClaim(req));
        
        // Notify fail → RabbitMQ fallback
        doThrow(new RuntimeException()).when(notificationClient).sendEmail(any());
        assertNotNull(claimService.initiateClaim(req));
        verify(rabbitTemplate).convertAndSend(eq("notification.exchange"), eq("notification.send"), any(NotificationEvent.class));

        // Policy name fallback when second Feign call returns null
        when(policyClient.getUserPolicyById(1L)).thenReturn(policy).thenReturn(null);
        doReturn(ResponseEntity.ok("ok")).when(notificationClient).sendEmail(any());
        assertNotNull(claimService.initiateClaim(req));

        // No email → skip notification
        UserDTO noEmail = new UserDTO(); noEmail.setName("N"); noEmail.setEmail(null);
        when(authClient.getUserById(anyLong())).thenReturn(noEmail);
        when(policyClient.getUserPolicyById(1L)).thenReturn(policy);
        assertNotNull(claimService.initiateClaim(req));

        // Auth failure during notification (outer catch)
        when(authClient.getUserById(anyLong())).thenThrow(new RuntimeException("down"));
        when(policyClient.getUserPolicyById(1L)).thenReturn(policy);
        assertNotNull(claimService.initiateClaim(req));

        // No user row → skip inner notification block (u == null)
        doReturn(null).when(authClient).getUserById(anyLong());
        when(policyClient.getUserPolicyById(1L)).thenReturn(policy);
        assertNotNull(claimService.initiateClaim(req));
    }

    @Test
    void testInitiateClaim_Failures() {
        ClaimRequestDTO req = new ClaimRequestDTO(); req.setUserId(1L); req.setPolicyId(1L);
        
        when(policyClient.getUserPolicyById(1L)).thenReturn(null);
        assertThrows(RuntimeException.class, () -> claimService.initiateClaim(req));
        
        UserPolicyDTO p2 = new UserPolicyDTO(); p2.setUserId(99L); p2.setStatus("ACTIVE");
        when(policyClient.getUserPolicyById(1L)).thenReturn(p2);
        assertThrows(RuntimeException.class, () -> claimService.initiateClaim(req));
        
        UserPolicyDTO p3 = new UserPolicyDTO(); p3.setUserId(1L); p3.setStatus("INACTIVE");
        when(policyClient.getUserPolicyById(1L)).thenReturn(p3);
        assertThrows(RuntimeException.class, () -> claimService.initiateClaim(req));
        
        doThrow(new RuntimeException("403")).when(policyClient).getUserPolicyById(1L);
        assertThrows(RuntimeException.class, () -> claimService.initiateClaim(req));

        // Non-RuntimeException: auth-style message (doThrow avoids invoking a throwing stub during when())
        doThrow(new RuntimeException("401 Unauthorized")).when(policyClient).getUserPolicyById(1L);
        RuntimeException ex401 = assertThrows(RuntimeException.class, () -> claimService.initiateClaim(req));
        assertTrue(ex401.getMessage().contains("Auth"));

        doThrow(new RuntimeException("forbidden 403")).when(policyClient).getUserPolicyById(1L);
        RuntimeException ex403 = assertThrows(RuntimeException.class, () -> claimService.initiateClaim(req));
        assertTrue(ex403.getMessage().contains("Auth"));

        doThrow(new RuntimeException("service down")).when(policyClient).getUserPolicyById(1L);
        RuntimeException exSys = assertThrows(RuntimeException.class, () -> claimService.initiateClaim(req));
        assertEquals("System unavailable", exSys.getMessage());

        // Catch block: null exception message → empty msg, no mapping, rethrow same instance
        doThrow(new RuntimeException((String) null)).when(policyClient).getUserPolicyById(1L);
        RuntimeException exNullMsg = assertThrows(RuntimeException.class, () -> claimService.initiateClaim(req));
        assertNull(exNullMsg.getMessage());
    }

    @Test
    void testUploadDocument() throws Exception {
        MockMultipartFile file = new MockMultipartFile("f", "t.pdf", "application/pdf", "d".getBytes());
        assertEquals("Document uploaded Successfully", claimService.uploadDocument(1L, file));
        
        MockMultipartFile file2 = new MockMultipartFile("f", "t.jpg", "image/jpeg", "d".getBytes());
        claimService.uploadDocument(2L, file2);

        MockMultipartFile file3 = new MockMultipartFile("f", "t.txt", "text/plain", "d".getBytes());
        assertThrows(IllegalArgumentException.class, () -> claimService.uploadDocument(1L, file3));
        
        // isValid through filename
        MockMultipartFile file4 = new MockMultipartFile("f", "t.pdf", null, "d".getBytes());
        claimService.uploadDocument(1L, file4);

        MockMultipartFile jpgByName = new MockMultipartFile("f", "pic.jpg", null, "d".getBytes());
        claimService.uploadDocument(1L, jpgByName);

        MockMultipartFile jpegUpper = new MockMultipartFile("f", "pic.JPEG", null, "d".getBytes());
        assertThrows(IllegalArgumentException.class, () -> claimService.uploadDocument(1L, jpegUpper));

        // Valid via filename only (content type not jpeg/pdf)
        MockMultipartFile pdfByName = new MockMultipartFile("f", "doc.pdf", "text/plain", "d".getBytes());
        claimService.uploadDocument(1L, pdfByName);

        when(claimRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(com.group2.claims_service.exception.ClaimNotFoundException.class,
                () -> claimService.uploadDocument(99L, file));

        MultipartFile ioFail = mock(MultipartFile.class);
        when(ioFail.getOriginalFilename()).thenReturn("x.pdf");
        when(ioFail.getContentType()).thenReturn("application/pdf");
        when(ioFail.getBytes()).thenThrow(new IOException("read"));
        RuntimeException rex = assertThrows(RuntimeException.class, () -> claimService.uploadDocument(1L, ioFail));
        assertEquals("IO", rex.getMessage());
    }

    @Test
    void testNotFoundPaths() {
        when(claimRepository.findById(5L)).thenReturn(Optional.empty());
        when(documentRepository.findByClaimId(5L)).thenReturn(Optional.empty());
        assertThrows(com.group2.claims_service.exception.ClaimNotFoundException.class,
                () -> claimService.getClaimStatus(5L));
        assertThrows(com.group2.claims_service.exception.ClaimNotFoundException.class,
                () -> claimService.getClaimById(5L));
        assertThrows(com.group2.claims_service.exception.ClaimNotFoundException.class,
                () -> claimService.updateClaimStatus(5L, "APPROVED", "x"));
        assertThrows(com.group2.claims_service.exception.ClaimNotFoundException.class,
                () -> claimService.getClaimDocument(5L));
    }

    @Test
    void testInitiate_policyFeignFailsOnSecondCall() {
        ClaimRequestDTO req = new ClaimRequestDTO();
        req.setUserId(1L);
        req.setPolicyId(1L);
        when(claimRepository.save(any())).thenReturn(claim);
        when(authClient.getUserById(anyLong())).thenReturn(new UserDTO("a@b.com", "N"));
        when(policyClient.getUserPolicyById(1L)).thenReturn(policy).thenThrow(new RuntimeException("policy down"));
        assertNotNull(claimService.initiateClaim(req));
    }

    @Test
    void testInitiate_connectionRefusedAndTimeoutBranches() {
        ClaimRequestDTO req = new ClaimRequestDTO();
        req.setUserId(1L);
        req.setPolicyId(1L);
        doThrow(new RuntimeException("Connection refused: connect")).when(policyClient).getUserPolicyById(1L);
        assertEquals("System unavailable",
                assertThrows(RuntimeException.class, () -> claimService.initiateClaim(req)).getMessage());
        doThrow(new RuntimeException("Read timed out")).when(policyClient).getUserPolicyById(1L);
        assertEquals("System unavailable",
                assertThrows(RuntimeException.class, () -> claimService.initiateClaim(req)).getMessage());
    }

    @Test
    void testUpdate_invalidTransitionsAndDraft() {
        UserDTO u = new UserDTO();
        u.setEmail("e@e.com");
        when(authClient.getUserById(anyLong())).thenReturn(u);

        claim.setClaimStatus(ClaimStatus.SUBMITTED);
        assertThrows(RuntimeException.class, () -> claimService.updateClaimStatus(1L, "DRAFT", null));

        claim.setClaimStatus(ClaimStatus.SUBMITTED);
        assertThrows(RuntimeException.class, () -> claimService.updateClaimStatus(1L, "APPROVED", null));

        claim.setClaimStatus(ClaimStatus.APPROVED);
        assertThrows(RuntimeException.class, () -> claimService.updateClaimStatus(1L, "UNDER_REVIEW", null));

        claim.setClaimStatus(ClaimStatus.DRAFT);
        assertThrows(RuntimeException.class, () -> claimService.updateClaimStatus(1L, "CLOSED", null));
    }

    @Test
    void testGetters() {
        assertNotNull(claimService.getClaimDocument(1L));
        assertNotNull(claimService.getClaimStatus(1L));
        assertNotNull(claimService.getClaimById(1L));
        assertEquals(1, claimService.getClaimsByUserId(1L).size());
        assertEquals(1, claimService.getAllClaims().size());
        assertNotNull(claimService.getClaimStats());
    }

    @Test
    void testUpdateClaimStatus() {
        UserDTO u = new UserDTO(); u.setEmail("t@t.com");
        when(authClient.getUserById(any())).thenReturn(u);
        
        claim.setClaimStatus(ClaimStatus.SUBMITTED);
        claimService.updateClaimStatus(1L, "UNDER_REVIEW", "rem");
        
        claim.setClaimStatus(ClaimStatus.UNDER_REVIEW);
        claimService.updateClaimStatus(1L, "APPROVED", "rem");
        
        claim.setClaimStatus(ClaimStatus.APPROVED);
        claimService.updateClaimStatus(1L, "CLOSED", null);
        
        claim.setClaimStatus(ClaimStatus.CLOSED);
        claimService.updateClaimStatus(1L, "UNDER_REVIEW", null);
        
        claim.setClaimStatus(ClaimStatus.UNDER_REVIEW);
        claimService.updateClaimStatus(1L, "REJECTED", "rem");

        // CLOSED from REJECTED (switch branch: cur == REJECTED)
        claimService.updateClaimStatus(1L, "CLOSED", "done");
        
        claim.setClaimStatus(ClaimStatus.SUBMITTED);
        assertThrows(RuntimeException.class, () -> claimService.updateClaimStatus(1L, "APPROVED", null));
        assertThrows(IllegalArgumentException.class, () -> claimService.updateClaimStatus(1L, "NOT_A_STATUS", null));

        // RabbitMQ fallback on notify failure (APPROVED)
        claim.setClaimStatus(ClaimStatus.UNDER_REVIEW);
        doThrow(new RuntimeException("smtp down")).when(notificationClient).sendEmail(any());
        claimService.updateClaimStatus(1L, "APPROVED", "ok");

        // REJECTED path with null remark on setter branch
        claim.setClaimStatus(ClaimStatus.UNDER_REVIEW);
        doReturn(ResponseEntity.ok("ok")).when(notificationClient).sendEmail(any());
        claimService.updateClaimStatus(1L, "REJECTED", null);

        // Notify outer catch: auth fails after status update
        claim.setClaimStatus(ClaimStatus.UNDER_REVIEW);
        doThrow(new RuntimeException("auth")).when(authClient).getUserById(anyLong());
        claimService.updateClaimStatus(1L, "APPROVED", "x");

        // User present but no email
        claim.setClaimStatus(ClaimStatus.UNDER_REVIEW);
        UserDTO noMail = new UserDTO(); noMail.setEmail(null);
        doReturn(noMail).when(authClient).getUserById(anyLong());
        claimService.updateClaimStatus(1L, "APPROVED", "y");

        // Notify block skipped when auth returns null user
        claim.setClaimStatus(ClaimStatus.UNDER_REVIEW);
        doReturn(null).when(authClient).getUserById(anyLong());
        claimService.updateClaimStatus(1L, "APPROVED", "z");

        // RabbitMQ fallback on REJECTED notify failure
        claim.setClaimStatus(ClaimStatus.UNDER_REVIEW);
        doReturn(new UserDTO("r@r.com", "R")).when(authClient).getUserById(anyLong());
        doThrow(new RuntimeException("smtp")).when(notificationClient).sendEmail(any());
        claimService.updateClaimStatus(1L, "REJECTED", "no");
        verify(rabbitTemplate, times(2)).convertAndSend(eq("notification.exchange"), eq("notification.email"), any(NotificationEvent.class));
    }

    @Test
    void testPaginated() {
        Page<Claim> pg = mock(Page.class);
        when(pg.getContent()).thenReturn(List.of(claim));
        when(pg.getNumber()).thenReturn(0);
        when(pg.getSize()).thenReturn(10);
        when(pg.getTotalElements()).thenReturn(1L);
        when(pg.getTotalPages()).thenReturn(1);
        when(pg.isLast()).thenReturn(true);
        when(claimRepository.findAllPaginated(any(), any())).thenReturn(pg);
        when(claimRepository.findByUserIdPaginated(anyLong(), any(), any())).thenReturn(pg);
        
        assertNotNull(claimService.getAllClaimsPaginated(0, 10, "q"));
        assertNotNull(claimService.getClaimsByUserIdPaginated(1L, 0, 10, "q"));
    }

    @Test
    void testCancelClaims() {
        when(claimRepository.findByPolicyId(1L)).thenReturn(List.of(claim));
        claimService.cancelClaimsByPolicy(1L);
        assertEquals(ClaimStatus.REJECTED, claim.getClaimStatus());

        Claim submitted2 = new Claim(); submitted2.setClaimStatus(ClaimStatus.SUBMITTED);
        Claim other = new Claim(); other.setClaimStatus(ClaimStatus.APPROVED);
        when(claimRepository.findByPolicyId(2L)).thenReturn(List.of(submitted2, other));
        claimService.cancelClaimsByPolicy(2L);
        assertEquals(ClaimStatus.REJECTED, submitted2.getClaimStatus());
        assertEquals(ClaimStatus.APPROVED, other.getClaimStatus());
    }

    @Test
    void testPopulate() {
        ReflectionTestUtils.invokeMethod(claimService, "populate", (Object) null, (Object) null);
        ReflectionTestUtils.invokeMethod(claimService, "populate", (Object) null, claim);
        ClaimResponseDTO dto = new ClaimResponseDTO(); dto.setClaimId(1L);
        when(documentRepository.existsByClaimId(1L)).thenReturn(true);
        ReflectionTestUtils.invokeMethod(claimService, "populate", dto, claim);
        assertTrue(Boolean.TRUE.equals(dto.getHasDocument()));

        ClaimResponseDTO noId = new ClaimResponseDTO();
        ReflectionTestUtils.invokeMethod(claimService, "populate", noId, claim);
        assertEquals(claim.getAdminRemark(), noId.getAdminRemark());

        ClaimResponseDTO withId = new ClaimResponseDTO();
        withId.setClaimId(2L);
        when(documentRepository.existsByClaimId(2L)).thenReturn(false);
        ReflectionTestUtils.invokeMethod(claimService, "populate", withId, null);
        assertFalse(Boolean.TRUE.equals(withId.getHasDocument()));
    }
}
