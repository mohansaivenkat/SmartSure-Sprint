package com.group2.claims_service.controller;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import com.group2.claims_service.dto.ClaimRequestDTO;
import com.group2.claims_service.dto.ClaimResponseDTO;
import com.group2.claims_service.dto.ClaimStatsDTO;
import com.group2.claims_service.dto.ClaimStatusUpdateDTO;
import com.group2.claims_service.entity.ClaimDocument;
import com.group2.claims_service.service.IClaimService;

@ExtendWith(MockitoExtension.class)
public class ClaimControllerTest {

    @Mock
    private IClaimService claimService;

    @InjectMocks
    private ClaimController claimController;

    private ClaimResponseDTO responseDTO;

    @BeforeEach
    void setUp() {
        responseDTO = new ClaimResponseDTO();
        responseDTO.setClaimId(1L);
        responseDTO.setStatus("SUBMITTED");
    }

    /**
     * Given: claimRequestDTO
     * When: initiateClaim is called
     * Then: returns ClaimResponseDTO
     */
    @Test
    void testInitiateClaim() {
        when(claimService.initiateClaim(any(ClaimRequestDTO.class))).thenReturn(responseDTO);

        ResponseEntity<ClaimResponseDTO> res = claimController.initiateClaim(new ClaimRequestDTO());
        assertEquals(200, res.getStatusCode().value());
        assertEquals(responseDTO, res.getBody());
    }

    /**
     * Given: claimId and document
     * When: uploadDocument is called
     * Then: returns success string
     */
    @Test
    void testUploadDocument() {
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", "data".getBytes());
        when(claimService.uploadDocument(eq(1L), any(MultipartFile.class))).thenReturn("Document uploaded Successfully");

        ResponseEntity<String> res = claimController.uploadDocument(1L, file);
        assertEquals(200, res.getStatusCode().value());
        assertEquals("Document uploaded Successfully", res.getBody());
    }

    /**
     * Given: claimId
     * When: getClaimStatus is called
     * Then: returns ClaimResponseDTO with status
     */
    @Test
    void testGetClaimStatus() {
        when(claimService.getClaimStatus(1L)).thenReturn(responseDTO);

        ResponseEntity<ClaimResponseDTO> res = claimController.getClaimStatus(1L);
        assertEquals(200, res.getStatusCode().value());
        assertEquals(responseDTO, res.getBody());
    }

    /**
     * Given: claimId
     * When: getClaimById is called
     * Then: returns full ClaimResponseDTO
     */
    @Test
    void testGetClaimById() {
        when(claimService.getClaimById(1L)).thenReturn(responseDTO);

        ResponseEntity<ClaimResponseDTO> res = claimController.getClaimById(1L);
        assertEquals(200, res.getStatusCode().value());
        assertEquals(responseDTO, res.getBody());
    }

    /**
     * Given: claimId and statusupdate dto
     * When: updateClaimStatus is called
     * Then: returns success message
     */
    @Test
    void testUpdateClaimStatus() {
        ClaimStatusUpdateDTO dto = new ClaimStatusUpdateDTO();
        dto.setStatus("APPROVED");
        dto.setRemark("Test Remark");

        doNothing().when(claimService).updateClaimStatus(1L, "APPROVED", "Test Remark");

        ResponseEntity<String> res = claimController.updateClaimStatus(1L, dto);
        assertEquals(200, res.getStatusCode().value());
        assertEquals("Claim status updated successfully", res.getBody());
    }

    /**
     * Given: userId
     * When: getClaimsByUserId is called
     * Then: returns list of claims
     */
    @Test
    void testGetClaimsByUserId() {
        when(claimService.getClaimsByUserId(1L)).thenReturn(Collections.singletonList(responseDTO));

        ResponseEntity<List<ClaimResponseDTO>> res = claimController.getClaimsByUserId(1L);
        assertEquals(200, res.getStatusCode().value());
        assertEquals(1, res.getBody().size());
    }

    /**
     * Given: a valid request for stats
     * When: getStats is called
     * Then: returns ClaimStatsDTO
     */
    @Test
    void testGetStats() {
        ClaimStatsDTO stats = new ClaimStatsDTO();
        stats.setTotalClaims(10);
        when(claimService.getClaimStats()).thenReturn(stats);

        ResponseEntity<ClaimStatsDTO> res = claimController.getStats();
        assertEquals(200, res.getStatusCode().value());
        assertEquals(10, res.getBody().getTotalClaims());
    }
    @Test
    void testGetAllClaims() {
        when(claimService.getAllClaims()).thenReturn(Collections.singletonList(responseDTO));
        ResponseEntity<List<ClaimResponseDTO>> res = claimController.getAllClaims();
        assertEquals(200, res.getStatusCode().value());
        assertEquals(1, res.getBody().size());
    }

    @Test
    void testGetAllClaimsPaginated() {
        com.group2.claims_service.dto.PageResponseDTO<ClaimResponseDTO> page = new com.group2.claims_service.dto.PageResponseDTO<>();
        when(claimService.getAllClaimsPaginated(0, 10, "")).thenReturn(page);
        ResponseEntity<com.group2.claims_service.dto.PageResponseDTO<ClaimResponseDTO>> res = claimController.getAllClaimsPaginated(0, 10, "");
        assertEquals(200, res.getStatusCode().value());
        assertEquals(page, res.getBody());
    }

    @Test
    void testGetClaimsByUserIdPaginated() {
        com.group2.claims_service.dto.PageResponseDTO<ClaimResponseDTO> page = new com.group2.claims_service.dto.PageResponseDTO<>();
        when(claimService.getClaimsByUserIdPaginated(1L, 0, 10, "")).thenReturn(page);
        ResponseEntity<com.group2.claims_service.dto.PageResponseDTO<ClaimResponseDTO>> res = claimController.getClaimsByUserIdPaginated(1L, 0, 10, "");
        assertEquals(200, res.getStatusCode().value());
        assertEquals(page, res.getBody());
    }

    @Test
    void downloadDocument_usesOctetStreamAndAttachmentWhenTypeMissing() {
        ClaimDocument doc = new ClaimDocument();
        doc.setFileUrl("proof.pdf");
        doc.setDocumentType(null);
        doc.setFileData(new byte[] { 1, 2, 3 });
        when(claimService.getClaimDocument(5L)).thenReturn(doc);

        ResponseEntity<byte[]> res = claimController.downloadDocument(5L);
        assertEquals(200, res.getStatusCode().value());
        assertArrayEquals(doc.getFileData(), res.getBody());
        assertTrue(res.getHeaders().getFirst("Content-Disposition").contains("attachment"));
        assertEquals("application/octet-stream", res.getHeaders().getFirst("Content-Type"));
    }

    @Test
    void downloadDocument_inlineForImage() {
        ClaimDocument doc = new ClaimDocument();
        doc.setFileUrl("pic.jpg");
        doc.setDocumentType("image/jpeg");
        doc.setFileData(new byte[] { 9 });
        when(claimService.getClaimDocument(6L)).thenReturn(doc);

        ResponseEntity<byte[]> res = claimController.downloadDocument(6L);
        assertTrue(res.getHeaders().getFirst("Content-Disposition").contains("inline"));
        assertEquals("image/jpeg", res.getHeaders().getFirst("Content-Type"));
    }

    @Test
    void downloadDocument_attachmentForPdf() {
        ClaimDocument doc = new ClaimDocument();
        doc.setFileUrl("doc.pdf");
        doc.setDocumentType("application/pdf");
        doc.setFileData(new byte[] { 0 });
        when(claimService.getClaimDocument(7L)).thenReturn(doc);

        ResponseEntity<byte[]> res = claimController.downloadDocument(7L);
        assertTrue(res.getHeaders().getFirst("Content-Disposition").contains("attachment"));
        assertEquals("application/pdf", res.getHeaders().getFirst("Content-Type"));
    }
}

