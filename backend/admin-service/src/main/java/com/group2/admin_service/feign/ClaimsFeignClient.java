package com.group2.admin_service.feign;

import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import com.group2.admin_service.dto.ClaimDTO;
import com.group2.admin_service.dto.ClaimStatusDTO;
import com.group2.admin_service.dto.ClaimStatusUpdateDTO;
import com.group2.admin_service.config.FeignConfig;

@FeignClient(name = "claims-service", configuration = FeignConfig.class)
public interface ClaimsFeignClient {

    @GetMapping("/api/claims/{id}")
    ClaimDTO getClaimById(@PathVariable("id") Long id);

    @PutMapping("/api/claims/{id}/status")
    void updateClaimStatus(@PathVariable("id") Long id,
                           @RequestBody ClaimStatusUpdateDTO dto);

    //For overall stats
    @GetMapping("/api/claims/stats")
    ClaimStatusDTO getClaimStats();

    //For specific claim status
    @GetMapping("/api/claims/status/{id}")
    ClaimDTO getClaimStatus(@PathVariable("id") Long id);

    //Get claims for a specific user
    @GetMapping("/api/claims/user/{userId}")
    List<ClaimDTO> getClaimsByUserId(@PathVariable("userId") Long userId);

    @GetMapping("/api/claims/{id}/document")
    org.springframework.http.ResponseEntity<byte[]> downloadDocument(@PathVariable("id") Long id);

    @GetMapping("/api/claims")
    List<ClaimDTO> getAllClaims();
}