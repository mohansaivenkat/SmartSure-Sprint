package com.group2.claims_service.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import com.group2.claims_service.dto.ClaimCreatedEvent;
import com.group2.claims_service.dto.ClaimRequestDTO;
import com.group2.claims_service.dto.ClaimResponseDTO;
import com.group2.claims_service.dto.ClaimStatsDTO;
import com.group2.claims_service.entity.Claim;
import com.group2.claims_service.entity.ClaimDocument;
import com.group2.claims_service.entity.ClaimStatus;
import com.group2.claims_service.exception.ClaimNotFoundException;
import com.group2.claims_service.repository.ClaimDocumentRepository;
import com.group2.claims_service.repository.ClaimRepository;

@ExtendWith(MockitoExtension.class)
public class ClaimServiceTest {

    @Mock
    private ClaimRepository claimRepository;

    @Mock
    private ClaimDocumentRepository documentRepository;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @InjectMocks
    private ClaimService claimService;

    private Claim claim;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(claimService, "rabbitTemplate", rabbitTemplate);

        claim = new Claim();
        claim.setId(1L);
        claim.setPolicyId(100L);
        claim.setUserId(200L);
        claim.setClaimAmount(5000.0);
        claim.setDescription("Car Damage");
        claim.setClaimStatus(ClaimStatus.SUBMITTED);
        claim.setCreatedAt(LocalDateTime.now());
    }

    /**
     * Given: ClaimRequestDTO
     * When: initiateClaim is called
     * Then: saves to DB, sends RabbitMQ event, returns ClaimResponseDTO
     */
    @Test
    void testInitiateClaim() {
        ClaimRequestDTO requestDTO = new ClaimRequestDTO();
        requestDTO.setPolicyId(100L);
        requestDTO.setUserId(200L);
        requestDTO.setClaimAmount(5000.0);
        requestDTO.setDescription("Car Damage");

        when(claimRepository.save(any(Claim.class))).thenReturn(claim);
        doNothing().when(rabbitTemplate).convertAndSend(eq("claim.exchange"), eq("claim.created"), any(ClaimCreatedEvent.class));

        ClaimResponseDTO response = claimService.initateClaim(requestDTO);

        assertNotNull(response);
        assertEquals(1L, response.getClaimId());
        assertEquals("SUBMITTED", response.getStatus());
        verify(claimRepository, times(1)).save(any(Claim.class));
        verify(rabbitTemplate, times(1)).convertAndSend(eq("claim.exchange"), eq("claim.created"), any(ClaimCreatedEvent.class));
    }

    /**
     * Given: Invalid claimId
     * When: uploadDocument is called
     * Then: Throws ClaimNotFoundException
     */
    @Test
    void testUploadDocument_ClaimNotFound() {
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", "data".getBytes());
        when(claimRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ClaimNotFoundException.class, () -> claimService.uploadDocument(1L, file));
    }

    /**
     * Given: Valid claimId
     * When: uploadDocument is called
     * Then: saves Document and returns success string
     */
    @Test
    void testUploadDocument_Success() {
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", "data".getBytes());
        when(claimRepository.findById(1L)).thenReturn(Optional.of(claim));
        when(documentRepository.save(any(ClaimDocument.class))).thenReturn(new ClaimDocument());

        String response = claimService.uploadDocument(1L, file);

        assertEquals("Document uploaded Successfully", response);
        verify(documentRepository, times(1)).save(any(ClaimDocument.class));
    }

    /**
     * Given: Valid claimId
     * When: getClaimStatus is called
     * Then: returns ClaimResponseDTO with status
     */
    @Test
    void testGetClaimStatus() {
        when(claimRepository.findById(1L)).thenReturn(Optional.of(claim));

        ClaimResponseDTO response = claimService.getClaimStatus(1L);

        assertEquals("SUBMITTED", response.getStatus());
        assertEquals(1L, response.getClaimId());
    }

    /**
     * Given: Valid claimId
     * When: getClaimById is called
     * Then: returns full ClaimResponseDTO
     */
    @Test
    void testGetClaimById() {
        when(claimRepository.findById(1L)).thenReturn(Optional.of(claim));

        ClaimResponseDTO response = claimService.getClaimById(1L);

        assertEquals(1L, response.getClaimId());
        assertEquals(100L, response.getPolicyId());
        assertEquals(5000.0, response.getClaimAmount());
    }

    /**
     * Given: Valid Claim ID and legal transition
     * When: updateClaimStatus is called
     * Then: Claim status is updated and saved
     */
    @Test
    void testUpdateClaimStatus_ValidTransition() {
        when(claimRepository.findById(1L)).thenReturn(Optional.of(claim)); // Currently SUBMITTED
        when(claimRepository.save(any(Claim.class))).thenReturn(claim);

        claimService.updateClaimStatus(1L, "UNDER_REVIEW");

        assertEquals(ClaimStatus.UNDER_REVIEW, claim.getClaimStatus());
        verify(claimRepository, times(1)).save(claim);
    }

    /**
     * Given: Valid Claim ID and illegal transition
     * When: updateClaimStatus is called
     * Then: Throws RuntimeException
     */
    @Test
    void testUpdateClaimStatus_InvalidTransition() {
        when(claimRepository.findById(1L)).thenReturn(Optional.of(claim)); // Currently SUBMITTED

        // SUBMITTED -> APPROVED is invalid
        assertThrows(RuntimeException.class, () -> claimService.updateClaimStatus(1L, "APPROVED"));
        verify(claimRepository, times(0)).save(any(Claim.class));
    }

    /**
     * Given: Invalid status string
     * When: updateClaimStatus is called
     * Then: Throws RuntimeException
     */
    @Test
    void testUpdateClaimStatus_InvalidStatus() {
        when(claimRepository.findById(1L)).thenReturn(Optional.of(claim));

        assertThrows(RuntimeException.class, () -> claimService.updateClaimStatus(1L, "INVALID"));
    }

    /**
     * Given: Valid userId
     * When: getClaimsByUserId is called
     * Then: returns list of claims mapped to DTO
     */
    @Test
    void testGetClaimsByUserId() {
        when(claimRepository.findByUserId(200L)).thenReturn(Arrays.asList(claim, claim));

        List<ClaimResponseDTO> responseList = claimService.getClaimsByUserId(200L);

        assertEquals(2, responseList.size());
        assertEquals(1L, responseList.get(0).getClaimId());
    }

    /**
     * Given: Requests for claim stats
     * When: getClaimStats is called
     * Then: Returns accurate counts mapped in ClaimStatsDTO
     */
    @Test
    void testGetClaimStats() {
        when(claimRepository.count()).thenReturn(10L);
        when(claimRepository.countByClaimStatus(ClaimStatus.SUBMITTED)).thenReturn(5L);
        when(claimRepository.countByClaimStatus(ClaimStatus.APPROVED)).thenReturn(3L);
        when(claimRepository.countByClaimStatus(ClaimStatus.REJECTED)).thenReturn(2L);

        ClaimStatsDTO stats = claimService.getClaimStats();

        assertEquals(10L, stats.getTotalClaims());
        assertEquals(5L, stats.getSubmittedClaims());
        assertEquals(3L, stats.getApprovedClaims());
        assertEquals(2L, stats.getRejectedClaims());
    }
}
