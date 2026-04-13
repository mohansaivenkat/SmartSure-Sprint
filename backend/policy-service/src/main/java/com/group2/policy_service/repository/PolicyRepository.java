package com.group2.policy_service.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.group2.policy_service.entity.Policy;


@Repository
public interface PolicyRepository extends JpaRepository<Policy, Long> {
	List<Policy> findByActiveTrue();

	Page<Policy> findByActiveTrue(Pageable pageable);

	@Query("SELECT p FROM Policy p JOIN p.policyType pt WHERE p.active = true " +
			"AND (:category = 'ALL' OR CAST(pt.category AS string) = :category) " +
			"AND (LOWER(p.policyName) LIKE LOWER(CONCAT('%', :query, '%')) " +
			"OR LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%')))")
	Page<Policy> searchPolicies(@Param("category") String category, @Param("query") String query, Pageable pageable);
}
