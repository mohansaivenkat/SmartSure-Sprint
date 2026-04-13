package com.group2.claims_service.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.group2.claims_service.entity.Claim;
import com.group2.claims_service.entity.ClaimStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ClaimRepository extends JpaRepository<Claim, Long>{
	
	long countByClaimStatus(ClaimStatus status);
	
	List<Claim> findByUserId(Long userId);

	List<Claim> findByPolicyId(Long policyId);

    @Query("SELECT c FROM Claim c WHERE CAST(c.id AS string) LIKE %:query% OR CAST(c.userId AS string) LIKE %:query% OR CAST(c.policyId AS string) LIKE %:query%")
    Page<Claim> findAllPaginated(@Param("query") String query, Pageable pageable);

    @Query("SELECT c FROM Claim c WHERE c.userId = :userId AND (CAST(c.id AS string) LIKE %:query% OR CAST(c.policyId AS string) LIKE %:query%)")
    Page<Claim> findByUserIdPaginated(@Param("userId") Long userId, @Param("query") String query, Pageable pageable);
}

