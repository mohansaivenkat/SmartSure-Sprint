package com.group2.claims_service.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.group2.claims_service.entity.Claim;
import com.group2.claims_service.entity.ClaimStatus;

public interface ClaimRepository extends JpaRepository<Claim, Long>{
	
	long countByClaimStatus(ClaimStatus status);
	
	List<Claim> findByUserId(Long userId);
}

